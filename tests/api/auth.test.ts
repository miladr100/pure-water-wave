import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { POST as changePassword } from "@/app/api/academia/auth/change-password/route";
import { PATCH as changeEmail } from "@/app/api/academia/auth/email/route";
import { POST as forgotPassword } from "@/app/api/academia/auth/forgot-password/route";
import { PATCH as changeLanguage } from "@/app/api/academia/auth/language/route";
import { POST as login } from "@/app/api/academia/auth/login/route";
import { POST as logout } from "@/app/api/academia/auth/logout/route";
import { PATCH as changeProfile } from "@/app/api/academia/auth/profile/route";
import { POST as register } from "@/app/api/academia/auth/register/route";
import { POST as resetPassword } from "@/app/api/academia/auth/reset-password/route";
import { POST as verifyResetCode } from "@/app/api/academia/auth/verify-reset-code/route";
import { GET as getMe } from "@/app/api/academia/me/route";
import { SESSION_COOKIE } from "@/lib/academy/session-cookie";
import { hashPassword } from "@/lib/password";
import { AcademyPasswordReset } from "@/models/academy-password-reset";
import { AcademyUser } from "@/models/academy-user";

import { adoptSessionCookie, createUser, jsonRequest, readJson, setCookieHeader, signInAs } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

type AuthBody = {
  ok?: boolean;
  error?: string;
  code?: string;
  redirectTo?: string;
  user?: { fullName: string; login: string; role: string; language: string; theme: string };
};

const REGISTRATION = {
  fullName: "Nova Aluna",
  email: "nova@example.test",
  password: "senha123",
  country: "Brasil",
};

function registerWith(body: Record<string, unknown>) {
  return register(jsonRequest("/api/academia/auth/register", { body }));
}

function loginWith(loginValue: string, password: string) {
  return login(jsonRequest("/api/academia/auth/login", { body: { login: loginValue, password } }));
}

describe("auth", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("register", () => {
    it("creates a student, signs them in and points them at the academy", async () => {
      const response = await registerWith(REGISTRATION);
      expect(response.status).toBe(200);

      const body = await readJson<AuthBody>(response);
      expect(body.redirectTo).toBe("/academia");
      expect(body.user).toMatchObject({ role: "student", login: "nova@example.test", theme: "system", language: "pt" });
      expect(setCookieHeader(response)).toContain(`${SESSION_COOKIE}=`);

      const stored = await AcademyUser.findOne({ email: "nova@example.test" }).select("+password").lean();
      expect(stored?.role).toBe("student");
      expect(stored?.password).not.toBe("senha123");

      adoptSessionCookie(response);
      const me = await getMe();
      expect(me.status).toBe(200);
    });

    it("refuses a duplicate e-mail with EMAIL_IN_USE", async () => {
      await createUser({ email: "nova@example.test" });

      const response = await registerWith(REGISTRATION);
      expect(response.status).toBe(409);
      expect((await readJson<AuthBody>(response)).code).toBe("EMAIL_IN_USE");
    });

    it("rejects missing fields, a short password, a bad e-mail and an invalid birthday", async () => {
      const cases: Record<string, unknown>[] = [
        { ...REGISTRATION, country: "" },
        { ...REGISTRATION, password: "12345" },
        { ...REGISTRATION, email: "not-an-email" },
        { ...REGISTRATION, birthday: "2024-02-30" },
        { ...REGISTRATION, birthday: "2999-01-01" },
      ];

      for (const body of cases) {
        const response = await registerWith(body);
        expect(response.status, JSON.stringify(body)).toBe(400);
      }
      expect(await AcademyUser.countDocuments()).toBe(0);
    });

    it("refuses a tutor secret when none is configured", async () => {
      const response = await registerWith({ ...REGISTRATION, tutorSecret: "x" });
      expect(response.status).toBe(403);
      expect((await readJson<AuthBody>(response)).error).toBe("Segredo de tutor inválido");
    });

    it("creates a tutor when the secret matches and sends them to the panel", async () => {
      vi.stubEnv("TUTOR_REGISTER_SECRET", "x");

      const response = await registerWith({ ...REGISTRATION, tutorSecret: "X" });
      expect(response.status).toBe(200);

      const body = await readJson<AuthBody>(response);
      expect(body.redirectTo).toBe("/admin");
      expect(body.user?.role).toBe("tutor");
      expect((await AcademyUser.findOne({ email: "nova@example.test" }).lean())?.role).toBe("tutor");
    });
  });

  describe("login", () => {
    it("answers USER_NOT_FOUND for an unknown login", async () => {
      const response = await loginWith("nobody@example.test", "senha123");
      expect(response.status).toBe(404);
      expect((await readJson<AuthBody>(response)).code).toBe("USER_NOT_FOUND");
    });

    it("answers INVALID_PASSWORD for a wrong password", async () => {
      await createUser({ email: "a@example.test", password: "senha123" });

      const response = await loginWith("a@example.test", "errada1");
      expect(response.status).toBe(401);
      expect((await readJson<AuthBody>(response)).code).toBe("INVALID_PASSWORD");
    });

    it("signs a student in, stamps lastSeenAt and echoes the stored theme", async () => {
      const user = await createUser({ email: "a@example.test", password: "senha123" });
      await AcademyUser.updateOne({ _id: user._id }, { theme: "dark" });

      const response = await loginWith("A@example.test", "senha123");
      expect(response.status).toBe(200);

      const body = await readJson<AuthBody>(response);
      expect(body.redirectTo).toBe("/academia");
      expect(body.user?.theme).toBe("dark");
      expect(setCookieHeader(response)).toContain(`${SESSION_COOKIE}=`);

      const stored = await AcademyUser.findById(user._id).lean();
      expect(stored?.lastSeenAt).toBeInstanceOf(Date);
    });

    it("sends a tutor to the panel", async () => {
      await createUser({ email: "t@example.test", role: "tutor" });

      const response = await loginWith("t@example.test", "senha123");
      expect(response.status).toBe(200);
      expect((await readJson<AuthBody>(response)).redirectTo).toBe("/admin");
    });

    it("answers 503 when the database is not configured", async () => {
      vi.stubEnv("MONGODB_URI", "");

      const response = await loginWith("a@example.test", "senha123");
      expect(response.status).toBe(503);
    });
  });

  describe("logout", () => {
    it("clears the session cookie", async () => {
      const response = await logout();
      expect(response.status).toBe(200);

      const cookie = setCookieHeader(response);
      expect(cookie).toMatch(new RegExp(`${SESSION_COOKIE}=;`));
      expect(cookie.toLowerCase()).toContain("max-age=0");
    });
  });

  describe("profile and language", () => {
    it("renames the account and reissues the cookie", async () => {
      const user = await createUser({ fullName: "Antes" });
      await signInAs(user);

      const response = await changeProfile(jsonRequest("/api/academia/auth/profile", { method: "PATCH", body: { fullName: "  Depois  " } }));
      expect(response.status).toBe(200);
      expect((await readJson<{ fullName: string }>(response)).fullName).toBe("Depois");
      expect(setCookieHeader(response)).toContain(`${SESSION_COOKIE}=`);
      expect((await AcademyUser.findById(user._id).lean())?.fullName).toBe("Depois");
    });

    it("rejects a one-letter name and an unknown language", async () => {
      const user = await createUser();
      await signInAs(user);

      const name = await changeProfile(jsonRequest("/api/academia/auth/profile", { method: "PATCH", body: { fullName: "A" } }));
      expect(name.status).toBe(400);

      const language = await changeLanguage(jsonRequest("/api/academia/auth/language", { method: "PATCH", body: { language: "fr" } }));
      expect(language.status).toBe(400);
    });

    it("stores the language and reissues the cookie", async () => {
      const user = await createUser();
      await signInAs(user);

      const response = await changeLanguage(jsonRequest("/api/academia/auth/language", { method: "PATCH", body: { language: "es" } }));
      expect(response.status).toBe(200);
      expect(setCookieHeader(response)).toContain(`${SESSION_COOKIE}=`);
      expect((await AcademyUser.findById(user._id).lean())?.language).toBe("es");
    });

    it("refuses both without a session", async () => {
      const name = await changeProfile(jsonRequest("/api/academia/auth/profile", { method: "PATCH", body: { fullName: "Alguém" } }));
      expect(name.status).toBe(401);
      const language = await changeLanguage(jsonRequest("/api/academia/auth/language", { method: "PATCH", body: { language: "es" } }));
      expect(language.status).toBe(401);
    });
  });

  describe("change-password", () => {
    it("refuses a wrong current password", async () => {
      const user = await createUser({ password: "senha123" });
      await signInAs(user);

      const response = await changePassword(
        jsonRequest("/api/academia/auth/change-password", { body: { currentPassword: "errada1", newPassword: "nova1234" } }),
      );
      expect(response.status).toBe(401);
    });

    it("refuses a short new password", async () => {
      const user = await createUser({ password: "senha123" });
      await signInAs(user);

      const response = await changePassword(
        jsonRequest("/api/academia/auth/change-password", { body: { currentPassword: "senha123", newPassword: "abc" } }),
      );
      expect(response.status).toBe(400);
    });

    it("replaces the password so the new one signs in and the old one does not", async () => {
      const user = await createUser({ email: "a@example.test", password: "senha123" });
      await signInAs(user);

      const response = await changePassword(
        jsonRequest("/api/academia/auth/change-password", { body: { currentPassword: "senha123", newPassword: "nova1234" } }),
      );
      expect(response.status).toBe(200);

      expect((await loginWith("a@example.test", "nova1234")).status).toBe(200);
      expect((await loginWith("a@example.test", "senha123")).status).toBe(401);
    });
  });

  describe("email", () => {
    const patch = (body: Record<string, unknown>) =>
      changeEmail(jsonRequest("/api/academia/auth/email", { method: "PATCH", body }));

    it("refuses a wrong password with INVALID_PASSWORD", async () => {
      const user = await createUser({ email: "a@example.test", password: "senha123" });
      await signInAs(user);

      const response = await patch({ newEmail: "b@example.test", currentPassword: "errada1" });
      expect(response.status).toBe(401);
      expect((await readJson<AuthBody>(response)).code).toBe("INVALID_PASSWORD");
    });

    it("refuses an e-mail another account uses with EMAIL_IN_USE", async () => {
      await createUser({ email: "b@example.test" });
      const user = await createUser({ email: "a@example.test", password: "senha123" });
      await signInAs(user);

      const response = await patch({ newEmail: "B@example.test", currentPassword: "senha123" });
      expect(response.status).toBe(409);
      expect((await readJson<AuthBody>(response)).code).toBe("EMAIL_IN_USE");
    });

    it("rejects a malformed e-mail and a missing password", async () => {
      const user = await createUser({ password: "senha123" });
      await signInAs(user);

      expect((await patch({ newEmail: "nope", currentPassword: "senha123" })).status).toBe(400);
      expect((await patch({ newEmail: "b@example.test" })).status).toBe(400);
    });

    it("updates e-mail and login together and reissues the cookie", async () => {
      const user = await createUser({ email: "a@example.test", password: "senha123" });
      await signInAs(user);

      const response = await patch({ newEmail: "New@example.test", currentPassword: "senha123" });
      expect(response.status).toBe(200);
      expect((await readJson<{ email: string }>(response)).email).toBe("new@example.test");
      expect(setCookieHeader(response)).toContain(`${SESSION_COOKIE}=`);

      const stored = await AcademyUser.findById(user._id).lean();
      expect(stored?.email).toBe("new@example.test");
      expect(stored?.login).toBe("new@example.test");
      expect((await loginWith("new@example.test", "senha123")).status).toBe(200);
      expect((await loginWith("a@example.test", "senha123")).status).toBe(404);
    });
  });

  describe("forgot-password", () => {
    it("answers 503 while no mail provider is configured", async () => {
      await createUser({ email: "a@example.test" });

      const response = await forgotPassword(jsonRequest("/api/academia/auth/forgot-password", { body: { email: "a@example.test" } }));
      expect(response.status).toBe(503);
      expect(await AcademyPasswordReset.countDocuments()).toBe(0);
    });
  });

  describe("verify-reset-code and reset-password", () => {
    const CODE = "123456";

    async function seedReset(email: string, overrides: Partial<{ attempts: number; verifiedAt: Date | null; expiresAt: Date }> = {}) {
      return AcademyPasswordReset.create({
        email,
        codeHash: await hashPassword(CODE),
        expiresAt: overrides.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000),
        attempts: overrides.attempts ?? 0,
        verifiedAt: overrides.verifiedAt ?? null,
      });
    }

    const verify = (email: string, code: string) =>
      verifyResetCode(jsonRequest("/api/academia/auth/verify-reset-code", { body: { email, code } }));
    const reset = (email: string, password: string) =>
      resetPassword(jsonRequest("/api/academia/auth/reset-password", { body: { email, password } }));

    it("counts a wrong code as an attempt and locks after five", async () => {
      await createUser({ email: "a@example.test" });
      const row = await seedReset("a@example.test");

      const wrong = await verify("a@example.test", "000000");
      expect(wrong.status).toBe(400);
      expect((await AcademyPasswordReset.findById(row._id).lean())?.attempts).toBe(1);

      await AcademyPasswordReset.updateOne({ _id: row._id }, { attempts: 5 });
      const locked = await verify("a@example.test", CODE);
      expect(locked.status).toBe(429);
    });

    it("rejects a malformed code and an expired one", async () => {
      await createUser({ email: "a@example.test" });
      expect((await verify("a@example.test", "12ab")).status).toBe(400);

      await seedReset("a@example.test", { expiresAt: new Date(Date.now() - 1000) });
      expect((await verify("a@example.test", CODE)).status).toBe(400);
    });

    it("refuses to reset before the code was verified", async () => {
      await createUser({ email: "a@example.test", password: "senha123" });
      await seedReset("a@example.test");

      const response = await reset("a@example.test", "nova1234");
      expect(response.status).toBe(400);
      expect((await loginWith("a@example.test", "senha123")).status).toBe(200);
    });

    it("verifies the right code, resets the password and discards the row", async () => {
      await createUser({ email: "a@example.test", password: "senha123" });
      const row = await seedReset("a@example.test");

      const verified = await verify("a@example.test", "123 456");
      expect(verified.status).toBe(200);
      expect((await AcademyPasswordReset.findById(row._id).lean())?.verifiedAt).toBeInstanceOf(Date);

      const response = await reset("a@example.test", "nova1234");
      expect(response.status).toBe(200);
      expect(await AcademyPasswordReset.countDocuments({ email: "a@example.test" })).toBe(0);
      expect((await loginWith("a@example.test", "nova1234")).status).toBe(200);
      expect((await loginWith("a@example.test", "senha123")).status).toBe(401);
    });
  });
});
