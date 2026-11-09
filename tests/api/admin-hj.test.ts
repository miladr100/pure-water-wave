import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getEquipes, POST as postEquipe } from "@/app/api/admin/hj/equipes/route";
import { DELETE as deleteEquipe, PATCH as patchEquipe } from "@/app/api/admin/hj/equipes/[id]/route";
import { GET as getInicio } from "@/app/api/admin/hj/inicio/route";
import { GET as getPessoas } from "@/app/api/admin/hj/pessoas/route";
import { POST as postPapeis } from "@/app/api/admin/hj/pessoas/[id]/papeis/route";
import { GET as getProjetos, POST as postProjeto } from "@/app/api/admin/hj/projetos/route";
import { PATCH as patchProjeto } from "@/app/api/admin/hj/projetos/[id]/route";
import { GET as getRelatorios } from "@/app/api/admin/hj/relatorios/route";
import { GET as getResultados } from "@/app/api/admin/hj/resultados/route";
import { addDays } from "@/lib/hj/dates";
import type { AdminHjInicio, AdminResultados, EquipeAdmin, PessoaRow, ProjetoAdmin, RelatorioRow } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjEquipe } from "@/models/hj-equipe";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createAdmin, createEducator, createEquipe, createMember, createProjeto, createRelatorio, createTeamSetup, hoje, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const papeis = (id: string, body: unknown) =>
  postPapeis(jsonRequest(`/api/admin/hj/pessoas/${id}/papeis`, { body }), params({ id }));
const newTeam = (body: unknown) => postEquipe(jsonRequest("/api/admin/hj/equipes", { body }));
const editTeam = (id: string, body: unknown) =>
  patchEquipe(jsonRequest(`/api/admin/hj/equipes/${id}`, { method: "PATCH", body }), params({ id }));
const removeTeam = (id: string) => deleteEquipe(jsonRequest(`/api/admin/hj/equipes/${id}`, { method: "DELETE" }), params({ id }));
const newProject = (body: unknown) => postProjeto(jsonRequest("/api/admin/hj/projetos", { body }));
const editProject = (id: string, body: unknown) =>
  patchProjeto(jsonRequest(`/api/admin/hj/projetos/${id}`, { method: "PATCH", body }), params({ id }));

describe("who may enter the administration", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("a member gets a 404 everywhere, an educator reads, only an admin changes roles and projects", async () => {
    const { membro, educador } = await createTeamSetup();
    await signInAsPanel(membro);
    expect((await getInicio(jsonRequest("/api/admin/hj/inicio"))).status).toBe(404);
    expect((await getPessoas(jsonRequest("/api/admin/hj/pessoas"))).status).toBe(404);

    resetNextHeaders();
    await signInAsPanel(educador);
    expect((await getInicio(jsonRequest("/api/admin/hj/inicio"))).status).toBe(200);
    expect((await papeis(membro._id.toString(), { educador: true })).status).toBe(404);
    expect((await newProject({ nome: "RM", tipo: "arrecadacao", inicio: hoje, fim: hoje })).status).toBe(404);
    const { projeto } = await (async () => ({ projeto: await createProjeto({ nome: "Outro" }) }))();
    expect((await editProject(projeto._id.toString(), { nome: "Mexido" })).status).toBe(404);
  });
});

describe("roles", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("the administrator makes an educator, then an administrator, then takes both away", async () => {
    const { membro, educador, equipe } = await createTeamSetup();
    const admin = await createAdmin();
    await signInAsPanel(admin);

    expect((await papeis(membro._id.toString(), { educador: true })).status).toBe(200);
    expect((await AcademyUser.findById(membro._id).lean())?.role).toBe("tutor");

    expect((await readJson<ErrorBody>(await papeis(membro._id.toString(), { educador: false, administrador: true }))).code).toBe("ADMIN_NEEDS_EDUCATOR");
    expect((await papeis(membro._id.toString(), { administrador: true })).status).toBe(200);
    expect((await AcademyUser.findById(membro._id).lean())?.isAdmin).toBe(true);

    // Taking the educator role away also frees the teams they followed.
    const reply = await readJson<{ equipesLiberadas: number }>(await papeis(educador._id.toString(), { educador: false }));
    expect(reply.equipesLiberadas).toBe(1);
    expect((await HjEquipe.findById(equipe._id).lean())?.educadorId).toBeNull();
    expect((await AcademyUser.findById(educador._id).lean())).toMatchObject({ role: "student", isAdmin: false });
  });

  it("an administrator cannot demote themself", async () => {
    const admin = await createAdmin();
    await signInAsPanel(admin);
    expect((await readJson<ErrorBody>(await papeis(admin._id.toString(), { administrador: false }))).code).toBe("SELF_DEMOTE");
  });

  it("people are listed with their roles and team, filtered by role", async () => {
    const { capita, educador } = await createTeamSetup();
    const admin = await createAdmin();
    await signInAsPanel(admin);

    const all = await readJson<{ pessoas: PessoaRow[] }>(await getPessoas(jsonRequest("/api/admin/hj/pessoas")));
    const row = all.pessoas.find((p) => p.id === capita._id.toString())!;
    expect(row.papeis.capitao).toBe(true);
    expect(row.equipe?.nome).toBe("Equipe 01 – HJA");

    const educators = await readJson<{ pessoas: PessoaRow[] }>(await getPessoas(jsonRequest("/api/admin/hj/pessoas?papel=educador")));
    expect(educators.pessoas.map((p) => p.id).sort()).toEqual([educador._id.toString(), admin._id.toString()].sort());
    const admins = await readJson<{ pessoas: PessoaRow[] }>(await getPessoas(jsonRequest("/api/admin/hj/pessoas?papel=administrador")));
    expect(admins.pessoas.map((p) => p.id)).toEqual([admin._id.toString()]);
  });
});

describe("teams", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("creates a team with a captain among its members", async () => {
    const { educador, projeto } = await createTeamSetup();
    const a = await createMember("A");
    const b = await createMember("B");
    await signInAsPanel(educador);

    const response = await newTeam({ projetoId: projeto._id.toString(), nome: "Equipe 02 – HJA", programa: "HJA", educadorId: educador._id.toString(), capitaoId: a._id.toString(), membroIds: [a._id.toString(), b._id.toString()] });
    expect(response.status).toBe(201);
    const { equipe } = await readJson<{ equipe: EquipeAdmin }>(response);
    expect(equipe.capitao?.nome).toBe("A");
    expect(equipe.membros).toHaveLength(2);
  });

  it("nobody sits in two teams of the same project; the captain must be a member; the educator must be one", async () => {
    const { educador, membro, projeto } = await createTeamSetup();
    const outsider = await createMember("Fora");
    await signInAsPanel(educador);

    const taken = await newTeam({ projetoId: projeto._id.toString(), nome: "Equipe 02", programa: "HJA", membroIds: [membro._id.toString()] });
    expect(taken.status).toBe(409);
    expect((await readJson<ErrorBody>(taken)).code).toBe("MEMBER_ELSEWHERE");

    expect((await readJson<ErrorBody>(await newTeam({ projetoId: projeto._id.toString(), nome: "Equipe 02", programa: "HJA", capitaoId: outsider._id.toString(), membroIds: [] }))).code).toBe("CAPTAIN_NOT_MEMBER");
    expect((await readJson<ErrorBody>(await newTeam({ projetoId: projeto._id.toString(), nome: "Equipe 02", programa: "HJA", educadorId: outsider._id.toString() }))).code).toBe("NOT_EDUCATOR");
    expect((await readJson<ErrorBody>(await newTeam({ projetoId: projeto._id.toString(), nome: "Equipe 02", programa: "XYZ" }))).code).toBe("INVALID_PROGRAM");
  });

  it("moving a member out and in, and deleting only a team without reports", async () => {
    const { educador, capita, membro, colega, projeto, equipe } = await createTeamSetup();
    await createRelatorio(projeto._id, equipe._id, membro._id);
    await signInAsPanel(educador);

    // The captain leaves: the team keeps the others and loses its captain.
    const edited = await editTeam(equipe._id.toString(), { membroIds: [membro._id.toString(), colega._id.toString()], capitaoId: null });
    expect(edited.status).toBe(200);
    expect((await readJson<{ equipe: EquipeAdmin }>(edited)).equipe.capitao).toBeNull();

    const other = await readJson<{ equipe: EquipeAdmin }>(await newTeam({ projetoId: projeto._id.toString(), nome: "Equipe 02", programa: "HJR", capitaoId: capita._id.toString(), membroIds: [capita._id.toString()] }));
    expect(other.equipe.programa).toBe("HJR");

    expect((await readJson<ErrorBody>(await removeTeam(equipe._id.toString()))).code).toBe("HAS_REPORTS");
    expect((await removeTeam(other.equipe.id)).status).toBe(200);

    const listed = await readJson<{ equipes: EquipeAdmin[] }>(await getEquipes(jsonRequest("/api/admin/hj/equipes")));
    expect(listed.equipes.map((e) => e.nome)).toEqual(["Equipe 01 – HJA"]);
  });
});

describe("projects", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("the administrator opens the next period copying the teams, and the active project is the one running today", async () => {
    const { projeto, equipe } = await createTeamSetup();
    const admin = await createAdmin();
    await signInAsPanel(admin);

    const response = await newProject({
      nome: "RM 30 dias – próximo",
      tipo: "arrecadacao",
      inicio: addDays(projeto.fim, 1),
      fim: addDays(projeto.fim, 30),
      diasDescanso: [addDays(projeto.fim, 7)],
      metaTotalCents: 130_000_000,
      metasPrograma: [{ programa: "HJA", metaCents: 40_000_000 }],
      regraNovaMeta: { fator: 1.5 },
      copiarEquipesDe: projeto._id.toString(),
    });
    expect(response.status).toBe(201);
    const created = await readJson<{ projeto: ProjetoAdmin; equipesCopiadas: number }>(response);
    expect(created.equipesCopiadas).toBe(1);
    expect(created.projeto).toMatchObject({ equipes: 1, membros: 3, metaTotalCents: 130_000_000 });
    expect(created.projeto.regraNovaMeta.fator).toBe(1.5);
    const copied = await HjEquipe.findOne({ projetoId: created.projeto.id }).lean();
    expect(copied?.nome).toBe(equipe.nome);
    expect(copied?.membroIds).toHaveLength(3);

    // Today's project is still the current one.
    const home = await readJson<AdminHjInicio>(await getInicio(jsonRequest("/api/admin/hj/inicio")));
    expect(home.projeto?.id).toBe(projeto._id.toString());

    const all = await readJson<{ projetos: ProjetoAdmin[] }>(await getProjetos());
    expect(all.projetos).toHaveLength(2);
  });

  it("validates the period and the goal rule", async () => {
    const admin = await createAdmin();
    await signInAsPanel(admin);
    expect((await readJson<ErrorBody>(await newProject({ nome: "x", tipo: "arrecadacao", inicio: "2026-12-01", fim: "2026-12-10" }))).code).toBe("NAME_REQUIRED");
    expect((await readJson<ErrorBody>(await newProject({ nome: "RM", tipo: "arrecadacao", inicio: "2026-12-10", fim: "2026-12-01" }))).code).toBe("INVALID_PERIOD");
    expect((await readJson<ErrorBody>(await newProject({ nome: "RM", tipo: "festa", inicio: "2026-12-01", fim: "2026-12-10" }))).code).toBe("INVALID_TYPE");
    expect((await readJson<ErrorBody>(await newProject({ nome: "RM", tipo: "arrecadacao", inicio: "2026-12-01", fim: "2026-12-10", regraNovaMeta: { fator: 9 } }))).code).toBe("INVALID_FACTOR");
    expect((await readJson<ErrorBody>(await newProject({ nome: "RM", tipo: "arrecadacao", inicio: "2026-12-01", fim: "2026-12-10", regraNovaMeta: null }))).code).toBe("INVALID_RULE");

    const projeto = await createProjeto();
    const edited = await editProject(projeto._id.toString(), { nome: "Renomeado", ativo: false });
    expect(edited.status).toBe(200);
    expect((await readJson<{ projeto: ProjetoAdmin }>(edited)).projeto).toMatchObject({ nome: "Renomeado", ativo: false });
  });
});

describe("results and the day's reports", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("the grid has one line per member with totals, filters and the day's cells", async () => {
    const { educador, capita, membro, colega, projeto, equipe } = await createTeamSetup();
    const otherEducator = await createEducator("Outro educador");
    const hjr = await createMember("Membro HJR");
    const equipeHjr = await createEquipe(projeto._id, { nome: "Equipe 01 – HJR", programa: "HJR", educadorId: otherEducator._id, capitaoId: hjr._id, membroIds: [hjr._id] });
    await createRelatorio(projeto._id, equipe._id, membro._id, { data: addDays(hoje, -1), dinheiroCents: 40000, pixCents: 0, estado: "validado" });
    await createRelatorio(projeto._id, equipe._id, membro._id, { dinheiroCents: 20000, pixCents: 10000 });
    await createRelatorio(projeto._id, equipe._id, capita._id, { dinheiroCents: 5000, pixCents: 0, estado: "devolvido", motivoDevolucao: "x" });
    await createRelatorio(projeto._id, equipeHjr._id, hjr._id, { dinheiroCents: 70000, pixCents: 0 });
    await signInAsPanel(educador);

    const all = await readJson<AdminResultados>(await getResultados(jsonRequest("/api/admin/hj/resultados")));
    expect(all.linhas).toHaveLength(4);
    const ofMember = all.linhas.find((l) => l.membro.id === membro._id.toString())!;
    expect(ofMember.totalCents).toBe(70000);
    expect(ofMember.diasEnviados).toBe(2);
    expect(ofMember.porDia[hoje]).toEqual({ liquidoCents: 30000, estado: "enviado" });
    // The returned report is shown but does not count.
    const ofCaptain = all.linhas.find((l) => l.membro.id === capita._id.toString())!;
    expect(ofCaptain.totalCents).toBe(0);
    expect(ofCaptain.porDia[hoje].estado).toBe("devolvido");
    expect(all.totais.liquidoCents).toBe(140000);
    expect(all.totais.dinheiroCents).toBe(130000);
    expect(all.totais.pixCents).toBe(10000);
    expect(all.programas.map((p) => p.programa)).toEqual(["HJA", "HJR"]);
    expect(all.filtros.educadores.map((e) => e.nome).sort()).toEqual(["Educador da Equipe", "Outro educador"]);

    const onlyHjr = await readJson<AdminResultados>(await getResultados(jsonRequest("/api/admin/hj/resultados?programa=HJR")));
    expect(onlyHjr.linhas).toHaveLength(1);
    expect(onlyHjr.totais.liquidoCents).toBe(70000);

    const byName = await readJson<AdminResultados>(await getResultados(jsonRequest("/api/admin/hj/resultados?busca=colega")));
    expect(byName.linhas.map((l) => l.membro.id)).toEqual([colega._id.toString()]);
    expect(byName.totais.liquidoCents).toBe(0);
  });

  it("the day's reports say which ones this educator may validate", async () => {
    const { educador, membro, projeto, equipe } = await createTeamSetup();
    const otherEducator = await createEducator("Outro educador");
    const hjr = await createMember("Membro HJR");
    const equipeHjr = await createEquipe(projeto._id, { nome: "Equipe 01 – HJR", programa: "HJR", educadorId: otherEducator._id, membroIds: [hjr._id] });
    const mine = await createRelatorio(projeto._id, equipe._id, membro._id);
    const theirs = await createRelatorio(projeto._id, equipeHjr._id, hjr._id);
    await signInAsPanel(educador);

    const day = await readJson<{ relatorios: RelatorioRow[]; podeValidar: Record<string, boolean> }>(await getRelatorios(jsonRequest("/api/admin/hj/relatorios")));
    expect(day.relatorios).toHaveLength(2);
    expect(day.podeValidar[mine._id.toString()]).toBe(true);
    expect(day.podeValidar[theirs._id.toString()]).toBe(false);

    const pending = await readJson<{ relatorios: RelatorioRow[] }>(await getRelatorios(jsonRequest("/api/admin/hj/relatorios?estado=enviado")));
    expect(pending.relatorios).toHaveLength(2);

    const home = await readJson<AdminHjInicio>(await getInicio(jsonRequest("/api/admin/hj/inicio")));
    expect(home.totais).toMatchObject({ membros: 4, equipes: 2, enviadosHoje: 2, pendentesValidacao: 2 });
    expect(home.programas.find((p) => p.programa === "HJA")?.metaCents).toBe(35_000_000);
  });
});
