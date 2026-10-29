import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));
// The site's mail module builds its Resend client at import time and throws
// without a key.
vi.mock("@/lib/emails", () => ({
  sendEmailPasswordReset: vi.fn(),
  sendEmailPasswordChanged: vi.fn(),
}));
// The academy's mail module is lazy, but nothing here may reach Resend: the
// sender is a spy and "configured" follows the (stubbed) key.
vi.mock("@/lib/academy/emails", () => ({
  emailConfigured: () => Boolean(process.env.RESEND_API_KEY),
  sendEmailWelcome: vi.fn(async () => undefined),
}));

import { POST as login } from "@/app/api/academia/auth/login/route";
import { POST as importAccounts } from "@/app/api/admin/contas/importar/route";
import { POST as createAccount } from "@/app/api/admin/contas/route";
import { GET as listPastors } from "@/app/api/admin/pastores/route";
import { ageToBirthday, generateTemporaryPassword } from "@/lib/academy/accounts";
import { sendEmailWelcome } from "@/lib/academy/emails";
import type {
  AdminCreateAccountBody,
  AdminCreateAccountResult,
  AdminImportResult,
  AdminImportRowInput,
  AdminPastorRow,
} from "@/lib/academy/types";
import { hashPassword } from "@/lib/password";
import { AcademyUser } from "@/models/academy-user";
import { SystemUser } from "@/models/system-user";

import { createUser, jsonRequest, readJson, signInAs } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string; fields?: Record<string, string> };
type LoginBody = { ok?: boolean; redirectTo?: string; code?: string };

const create = (body: Partial<AdminCreateAccountBody> | Record<string, unknown>) =>
  createAccount(jsonRequest("/api/admin/contas", { body }));
const importRows = (body: unknown) =>
  importAccounts(jsonRequest("/api/admin/contas/importar", { body }));
const pastors = () => listPastors();
const loginWith = (loginValue: string, password: string) =>
  login(jsonRequest("/api/academia/auth/login", { body: { login: loginValue, password } }));

async function tutorSession() {
  const tutor = await createUser({ fullName: "Educadora Chefe", role: "tutor" });
  await signInAs(tutor);
  return tutor;
}

async function created(body: Partial<AdminCreateAccountBody>) {
  const response = await create(body);
  expect(response.status).toBe(201);
  return readJson<AdminCreateAccountResult>(response);
}

async function createLibraryUser(role: "pastor" | "hjteam", email: string, phone: string) {
  return SystemUser.create({
    fullName: role === "pastor" ? "Pastor Antigo" : "Membro HJ Antigo",
    phone,
    email,
    churchName: "Igreja Teste",
    country: "Brasil",
    language: "pt",
    login: email,
    password: await hashPassword("senha123"),
    role,
  });
}

describe("accounts created by educators", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
    vi.mocked(sendEmailWelcome).mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("helpers", () => {
    it("generates 10-character passwords from the unambiguous alphabet", () => {
      for (let i = 0; i < 50; i += 1) {
        const password = generateTemporaryPassword();
        expect(password).toHaveLength(10);
        expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
      }
    });

    it("turns an age into 1 January of the matching year, in UTC", () => {
      const birthday = ageToBirthday(20);
      expect(birthday.toISOString()).toBe(`${new Date().getUTCFullYear() - 20}-01-01T00:00:00.000Z`);
    });
  });

  describe("access", () => {
    it("answers 403 to a student on all three routes", async () => {
      const student = await createUser({ role: "student" });
      await signInAs(student);

      const responses = await Promise.all([
        create({ kind: "hjteam", fullName: "Alguém", email: "x@example.test" }),
        importRows({ rows: [{ line: 1, kind: "hjteam", fullName: "Alguém", email: "x@example.test" }] }),
        pastors(),
      ]);
      expect(responses.map((response) => response.status)).toEqual([403, 403, 403]);
      expect(await AcademyUser.countDocuments({ email: "x@example.test" })).toBe(0);
    });

    it("answers 403 without a session", async () => {
      expect((await pastors()).status).toBe(403);
    });
  });

  describe("POST /api/admin/contas", () => {
    it("creates a pastor in the library's collection with a digits-only phone", async () => {
      await tutorSession();

      const result = await created({
        kind: "pastor",
        fullName: "  Pastor Novo ",
        email: "Pastor.Novo@Example.test",
        phone: "+55 (11) 98888-7777",
        churchName: "Igreja da Paz",
        country: "Brasil",
        language: "es",
      });

      expect(result.kind).toBe("pastor");
      expect(result.fullName).toBe("Pastor Novo");
      expect(result.email).toBe("pastor.novo@example.test");
      expect(result.temporaryPassword).toMatch(/^.{10}$/);
      expect(result.emailed).toBe(false);

      const stored = await SystemUser.findById(result.id).select("+password").lean();
      expect(stored).toMatchObject({
        fullName: "Pastor Novo",
        email: "pastor.novo@example.test",
        login: "pastor.novo@example.test",
        phone: "5511988887777",
        churchName: "Igreja da Paz",
        country: "Brasil",
        language: "es",
        role: "pastor",
      });
      expect(stored?.password).not.toBe(result.temporaryPassword);
      expect(await AcademyUser.countDocuments({ email: "pastor.novo@example.test" })).toBe(0);

      // and the pastor can sign in with the temporary password, to the library
      const signedIn = await loginWith("pastor.novo@example.test", result.temporaryPassword!);
      expect(signedIn.status).toBe(200);
      expect((await readJson<LoginBody>(signedIn)).redirectTo).toBe("/biblioteca");
    });

    it("requires a phone for a pastor", async () => {
      await tutorSession();

      const response = await create({ kind: "pastor", fullName: "Sem Telefone", email: "p@example.test" });
      expect(response.status).toBe(400);
      const body = await readJson<ErrorBody>(response);
      expect(body.code).toBe("validation");
      expect(body.fields).toEqual({ phone: "required" });
    });

    it("refuses a pastor whose phone is already in the library", async () => {
      await tutorSession();
      await createLibraryUser("pastor", "antigo@example.test", "11988887777");

      const response = await create({
        kind: "pastor",
        fullName: "Outro Pastor",
        email: "outro@example.test",
        phone: "(11) 98888-7777",
      });
      expect(response.status).toBe(409);
      expect((await readJson<ErrorBody>(response)).code).toBe("PHONE_IN_USE");
    });

    it("creates an HJ Team member as a student who can sign in to the academy", async () => {
      await tutorSession();

      const result = await created({
        kind: "hjteam",
        fullName: "Membro HJ",
        email: "hj@example.test",
        country: "Portugal",
        city: "Lisboa",
        birthday: "2004-05-17",
      });
      expect(result.kind).toBe("hjteam");
      expect(result.temporaryPassword).toHaveLength(10);

      const stored = await AcademyUser.findById(result.id).lean();
      expect(stored).toMatchObject({
        role: "student",
        theme: "system",
        country: "Portugal",
        city: "Lisboa",
        language: "pt",
        login: "hj@example.test",
      });
      expect(stored?.birthday?.toISOString()).toBe("2004-05-17T00:00:00.000Z");
      expect(await SystemUser.countDocuments({ email: "hj@example.test" })).toBe(0);

      const signedIn = await loginWith("hj@example.test", result.temporaryPassword!);
      expect(signedIn.status).toBe(200);
      expect((await readJson<LoginBody>(signedIn)).redirectTo).toBe("/academia");
    });

    it("creates an educator as a tutor who lands in the panel", async () => {
      await tutorSession();

      const result = await created({ kind: "educador", fullName: "Nova Educadora", email: "edu@example.test" });

      const stored = await AcademyUser.findById(result.id).lean();
      expect(stored?.role).toBe("tutor");

      const signedIn = await loginWith("edu@example.test", result.temporaryPassword!);
      expect(signedIn.status).toBe(200);
      expect((await readJson<LoginBody>(signedIn)).redirectTo).toBe("/admin");
    });

    it("honours an explicit password and returns no temporary one", async () => {
      await tutorSession();

      const result = await created({
        kind: "hjteam",
        fullName: "Com Senha",
        email: "senha@example.test",
        password: "minhasenha",
      });
      expect(result.temporaryPassword).toBeNull();

      expect((await loginWith("senha@example.test", "minhasenha")).status).toBe(200);
      expect((await loginWith("senha@example.test", "outra-coisa")).status).toBe(401);
    });

    it("refuses an e-mail already used by the other collection", async () => {
      await tutorSession();
      await createLibraryUser("pastor", "dup@example.test", "11988887777");
      await createUser({ email: "dup2@example.test" });

      const asAcademy = await create({ kind: "hjteam", fullName: "Duplicado", email: "DUP@example.test" });
      expect(asAcademy.status).toBe(409);
      expect((await readJson<ErrorBody>(asAcademy)).code).toBe("EMAIL_IN_USE");

      const asPastor = await create({
        kind: "pastor",
        fullName: "Duplicado",
        email: "dup2@example.test",
        phone: "11977776666",
      });
      expect(asPastor.status).toBe(409);
      expect((await readJson<ErrorBody>(asPastor)).code).toBe("EMAIL_IN_USE");
    });

    it("answers 400 with every failing field", async () => {
      await tutorSession();

      const response = await create({
        kind: "bispo",
        fullName: "A",
        email: "not-an-email",
        phone: "abc",
        country: "Atlântida",
        birthday: "31/02/2000",
        language: "fr",
        password: "123",
      });
      expect(response.status).toBe(400);
      const body = await readJson<ErrorBody>(response);
      expect(body.error).toBe("Verifique os campos destacados");
      expect(body.code).toBe("validation");
      expect(body.fields).toEqual({
        kind: "invalid",
        fullName: "too_short",
        email: "invalid",
        phone: "invalid",
        country: "invalid",
        birthday: "invalid",
        language: "invalid",
        password: "too_short",
      });
    });

    it("sends the welcome e-mail with the temporary password when Resend is configured", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://purewaterwave.org");
      await tutorSession();

      const result = await created({ kind: "educador", fullName: "Avisada", email: "avisada@example.test" });
      expect(result.emailed).toBe(true);
      expect(sendEmailWelcome).toHaveBeenCalledTimes(1);
      expect(sendEmailWelcome).toHaveBeenCalledWith({
        to: "avisada@example.test",
        fullName: "Avisada",
        kind: "educador",
        email: "avisada@example.test",
        temporaryPassword: result.temporaryPassword,
        appUrl: "https://purewaterwave.org",
      });
    });

    it("still creates the account when the e-mail fails", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");
      vi.mocked(sendEmailWelcome).mockRejectedValueOnce(new Error("resend down"));
      await tutorSession();

      const result = await created({ kind: "hjteam", fullName: "Sem Aviso", email: "semaviso@example.test" });
      expect(result.emailed).toBe(false);
      expect(result.temporaryPassword).toHaveLength(10);
      expect(await AcademyUser.countDocuments({ email: "semaviso@example.test" })).toBe(1);
    });

    it("does not send mail without a key", async () => {
      await tutorSession();
      await created({ kind: "hjteam", fullName: "Quieto", email: "quieto@example.test" });
      expect(sendEmailWelcome).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/admin/contas/importar", () => {
    it("handles every row on its own and counts them", async () => {
      await tutorSession();
      await createLibraryUser("pastor", "existe@example.test", "11900000000");
      const year = new Date().getUTCFullYear();

      const rows: AdminImportRowInput[] = [
        { line: 2, kind: "pastor", fullName: "Pastor CSV", email: "pastor.csv@example.test", phone: "11 91111-1111", churchName: "Igreja CSV" },
        { line: 3, kind: "hjteam", fullName: "HJ CSV", email: "hj.csv@example.test", birthday: "17/05/2004" },
        { line: 4, kind: "educador", fullName: "Edu CSV", email: "edu.csv@example.test", age: 30, password: "senhaforte" },
        { line: 5, kind: "hjteam", fullName: "Já Existe", email: "existe@example.test" },
        { line: 6, kind: "bispo" as unknown as AdminImportRowInput["kind"], fullName: "Tipo Errado", email: "tipo@example.test" },
        { line: 7, kind: "hjteam", fullName: "Email Errado", email: "sem-arroba" },
        { line: 8, kind: "pastor", fullName: "Pastor Sem Telefone", email: "semtel@example.test" },
        { line: 9, kind: "hjteam", fullName: "Repetido", email: "HJ.CSV@example.test" },
      ];

      const response = await importRows({ rows });
      expect(response.status).toBe(200);
      const result = await readJson<AdminImportResult>(response);

      expect(result.created).toBe(3);
      expect(result.exists).toBe(2);
      expect(result.invalid).toBe(3);
      expect(result.rows).toHaveLength(8);
      expect(result.rows.map((row) => [row.line, row.status])).toEqual([
        [2, "created"],
        [3, "created"],
        [4, "created"],
        [5, "exists"],
        [6, "invalid"],
        [7, "invalid"],
        [8, "invalid"],
        [9, "exists"],
      ]);

      const byLine = new Map(result.rows.map((row) => [row.line, row]));
      expect(byLine.get(2)?.temporaryPassword).toHaveLength(10);
      expect(byLine.get(4)?.temporaryPassword).toBeNull();
      expect(byLine.get(5)?.message).toBe("E-mail já cadastrado");
      expect(byLine.get(6)?.message).toBe("Tipo inválido");
      expect(byLine.get(6)?.kind).toBeNull();
      expect(byLine.get(7)?.message).toBe("E-mail inválido");
      expect(byLine.get(8)?.message).toBe("Telefone obrigatório para pastor");
      expect(byLine.get(9)?.message).toBe("E-mail repetido no arquivo");
      expect(byLine.get(9)?.email).toBe("hj.csv@example.test");
      expect(result.rows.every((row) => row.emailed === false)).toBe(true);

      const pastor = await SystemUser.findOne({ email: "pastor.csv@example.test" }).lean();
      expect(pastor).toMatchObject({ phone: "11911111111", churchName: "Igreja CSV", role: "pastor" });

      const hj = await AcademyUser.findOne({ email: "hj.csv@example.test" }).lean();
      expect(hj?.role).toBe("student");
      expect(hj?.birthday?.toISOString()).toBe("2004-05-17T00:00:00.000Z");

      const edu = await AcademyUser.findOne({ email: "edu.csv@example.test" }).lean();
      expect(edu?.role).toBe("tutor");
      expect(edu?.birthday?.toISOString()).toBe(`${year - 30}-01-01T00:00:00.000Z`);
      expect((await loginWith("edu.csv@example.test", "senhaforte")).status).toBe(200);

      expect(await AcademyUser.countDocuments({ email: "tipo@example.test" })).toBe(0);
      expect(await AcademyUser.countDocuments({ fullName: "Repetido" })).toBe(0);
    });

    it("prefers a given birthday over the age and flags a bad age", async () => {
      await tutorSession();

      const response = await importRows({
        rows: [
          { line: 1, kind: "hjteam", fullName: "Com Data", email: "data@example.test", birthday: "2000-01-15", age: 5 },
          { line: 2, kind: "hjteam", fullName: "Idade Ruim", email: "idade@example.test", age: 400 },
        ],
      });
      const result = await readJson<AdminImportResult>(response);
      expect(result.rows[0].status).toBe("created");
      expect((await AcademyUser.findOne({ email: "data@example.test" }).lean())?.birthday?.toISOString()).toBe(
        "2000-01-15T00:00:00.000Z",
      );
      expect(result.rows[1]).toMatchObject({ status: "invalid", message: "Idade inválida" });
    });

    it("names a missing name", async () => {
      await tutorSession();

      const response = await importRows({ rows: [{ line: 1, kind: "hjteam", fullName: "", email: "x@example.test" }] });
      const result = await readJson<AdminImportResult>(response);
      expect(result.rows[0]).toMatchObject({ status: "invalid", message: "Nome obrigatório" });
    });

    it("answers 400 for an empty file or more than 500 rows", async () => {
      await tutorSession();

      expect((await importRows({ rows: [] })).status).toBe(400);
      expect((await importRows({})).status).toBe(400);
      expect((await importRows({ rows: "nope" })).status).toBe(400);

      const tooMany = Array.from({ length: 501 }, (_, i) => ({
        line: i + 1,
        kind: "hjteam",
        fullName: `Pessoa ${i}`,
        email: `p${i}@example.test`,
      }));
      const response = await importRows({ rows: tooMany });
      expect(response.status).toBe(400);
      expect(await AcademyUser.countDocuments({ role: "student" })).toBe(0);
    });

    it("e-mails each created row when Resend is configured", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");
      await tutorSession();

      const response = await importRows({
        rows: [
          { line: 1, kind: "hjteam", fullName: "Um", email: "um@example.test" },
          { line: 2, kind: "hjteam", fullName: "Dois", email: "dois@example.test", password: "senha-propria" },
        ],
      });
      const result = await readJson<AdminImportResult>(response);
      expect(result.rows.map((row) => row.emailed)).toEqual([true, true]);
      expect(sendEmailWelcome).toHaveBeenCalledTimes(2);
      expect(vi.mocked(sendEmailWelcome).mock.calls[0][0]).toMatchObject({
        to: "um@example.test",
        temporaryPassword: result.rows[0].temporaryPassword,
      });
      expect(vi.mocked(sendEmailWelcome).mock.calls[1][0]).toMatchObject({
        to: "dois@example.test",
        temporaryPassword: null,
      });
    });
  });

  describe("GET /api/admin/pastores", () => {
    it("lists pastors and legacy HJ Team members, newest first", async () => {
      await tutorSession();
      const older = await createLibraryUser("hjteam", "hj.antigo@example.test", "11911111111");
      await SystemUser.updateOne({ _id: older._id }, { $set: { createdAt: new Date("2024-01-01T00:00:00Z") } });
      await createLibraryUser("pastor", "pastor.antigo@example.test", "11922222222");
      // An academy account is not a library account.
      await createUser({ fullName: "Aluno Qualquer" });

      await created({
        kind: "pastor",
        fullName: "Pastor Recente",
        email: "recente@example.test",
        phone: "11933333333",
        churchName: "Igreja Nova",
        country: "Peru",
        language: "es",
      });

      const response = await pastors();
      expect(response.status).toBe(200);
      const { pastors: rows } = await readJson<{ pastors: AdminPastorRow[] }>(response);

      expect(rows.map((row) => row.fullName)).toEqual(["Pastor Recente", "Pastor Antigo", "Membro HJ Antigo"]);
      expect(rows[0]).toMatchObject({
        email: "recente@example.test",
        phone: "11933333333",
        country: "Peru",
        churchName: "Igreja Nova",
        language: "es",
        role: "pastor",
      });
      expect(rows[2].role).toBe("hjteam");
      expect(rows.every((row) => typeof row.createdAt === "string" && row.id.length === 24)).toBe(true);
    });
  });
});
