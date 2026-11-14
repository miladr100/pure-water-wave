import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getConfig, PUT as putConfig } from "@/app/api/admin/hj/configuracoes/route";
import { GET as listPessoas } from "@/app/api/admin/hj/pessoas/route";
import { GET as getPessoa, PATCH as patchPessoa } from "@/app/api/admin/hj/pessoas/[id]/route";
import { GET as getProgramas, PUT as putPrograma } from "@/app/api/admin/hj/programas/route";
import { GET as getEu } from "@/app/api/painel/eu/route";
import { GET as getMeuPerfil, PATCH as patchMeuPerfil } from "@/app/api/painel/perfil/route";
import type { PainelEu } from "@/app/api/painel/eu/route";
import type { MeuPerfilHj } from "@/app/api/painel/perfil/route";
import { anosDesde, idadeEm, resumoDe } from "@/lib/hj/perfil";
import type { ConfiguracoesAdmin, PessoaDetalhe, PessoaRow, ProgramaCatalogo } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createAdmin, createEducator, createProjeto, createTeamSetup, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

describe("perfil helpers", () => {
  it("computes age and years as a member on a given day", () => {
    expect(idadeEm(new Date(Date.UTC(2004, 1, 3)), "2026-11-14")).toBe(22);
    expect(idadeEm(new Date(Date.UTC(2004, 10, 15)), "2026-11-14")).toBe(21);
    expect(idadeEm(null, "2026-11-14")).toBeNull();
    expect(anosDesde("2019-03-10", "2026-11-14")).toBe(7);
    expect(anosDesde("2026-05-01", "2026-11-14")).toBe(0);
  });

  it("writes the one line per program", () => {
    const base = { programa: null, turma: "", membroDesde: null, cursoUniversitario: "", formacao: "" };
    expect(resumoDe({ ...base, programa: "HJA", cursoUniversitario: "Psicologia" }, null, "2026-11-14")).toBe("Formado(a) em Psicologia");
    expect(resumoDe({ ...base, programa: "PW", membroDesde: "2024-01-01" }, null, "2026-11-14")).toBe("Membro há 2 anos");
    expect(resumoDe({ ...base, programa: "HJR" }, { familiaCheonBo: true, segundaGeracao: null, pais: "", espiritosLibertados: null, padraoVidaFe: "" }, "2026-11-14")).toBe("Família Cheon Bo");
    expect(resumoDe({ ...base, programa: "HJR" }, null, "2026-11-14")).toBe("");
  });
});

describe("Perfil HJ Team, programas e turmas, módulo Testemunho", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("the educator sets program, cohort and the confidential half; the member sees only the public half", async () => {
    const { educador, membro } = await createTeamSetup();
    await AcademyUser.updateOne({ _id: membro._id }, { $set: { birthday: new Date(Date.UTC(2004, 1, 3)) } });
    const id = membro._id.toString();

    await signInAsPanel(educador);
    const patched = await patchPessoa(
      jsonRequest(`/api/admin/hj/pessoas/${id}`, {
        method: "PATCH",
        body: {
          perfil: { programa: "HJA", turma: "2ª Turma", cursoUniversitario: "Psicologia", membroDesde: "2019-03-10" },
          confidencial: { familiaCheonBo: true, segundaGeracao: true, pais: "Família Silva", espiritosLibertados: 430, padraoVidaFe: "HDH diário" },
          anotacoes: "Primeira conversa ok",
        },
      }),
      params({ id }),
    );
    expect(patched.status).toBe(200);
    const { pessoa } = await readJson<{ pessoa: PessoaDetalhe }>(patched);
    expect(pessoa).toMatchObject({ programa: "HJA", turma: "2ª Turma", resumo: "Formado(a) em Psicologia", anotacoes: "Primeira conversa ok", equipe: { nome: "Equipe 01 – HJA" } });
    expect(pessoa.confidencial).toEqual({ familiaCheonBo: true, segundaGeracao: true, pais: "Família Silva", espiritosLibertados: 430, padraoVidaFe: "HDH diário" });
    expect(pessoa.idade).toBeGreaterThanOrEqual(22);

    const lista = await readJson<{ pessoas: PessoaRow[] }>(await listPessoas(jsonRequest("/api/admin/hj/pessoas?papel=membro&programa=HJA&turma=2%C2%AA%20Turma")));
    expect(lista.pessoas.map((row) => row.nome)).toEqual(["Membro da Equipe"]);
    expect(JSON.stringify(lista)).not.toContain("Cheon");

    await signInAsPanel(membro);
    expect((await getPessoa(jsonRequest(`/api/admin/hj/pessoas/${id}`), params({ id }))).status).toBe(404);
    const meu = await readJson<MeuPerfilHj>(await getMeuPerfil());
    expect(meu.perfil).toEqual({ programa: "HJA", turma: "2ª Turma", membroDesde: "2019-03-10", cursoUniversitario: "Psicologia", formacao: "" });
    expect(meu.programaNome).toBe("HJ Academy");
    expect(meu.educador?.nome).toBe("Educador da Equipe");
    expect(JSON.stringify(meu)).not.toContain("Cheon");
    // program and cohort are the educator's; the rest is the member's
    const mine = await readJson<MeuPerfilHj>(await patchMeuPerfil(jsonRequest("/api/painel/perfil", { method: "PATCH", body: { programa: "PW", turma: "x", formacao: "Inglês", membroDesde: "2020-01-01" } })));
    expect(mine.perfil).toMatchObject({ programa: "HJA", turma: "2ª Turma", formacao: "Inglês", membroDesde: "2020-01-01" });
    expect((await readJson<ErrorBody>(await patchMeuPerfil(jsonRequest("/api/painel/perfil", { method: "PATCH", body: {} })))).code).toBe("EMPTY");
  });

  it("the catalogue seeds the programs; only the administrator edits cohorts", async () => {
    const educador = await createEducator();
    await signInAsPanel(educador);
    const seeded = await readJson<{ programas: ProgramaCatalogo[] }>(await getProgramas());
    expect(seeded.programas.map((item) => `${item.sigla}:${item.turmas.length}`)).toEqual(["HJA:3", "HJR:1", "PW:1", "STG:1", "UPA:1"]);
    expect((await putPrograma(jsonRequest("/api/admin/hj/programas", { method: "PUT", body: { sigla: "HJA", nome: "X" } }))).status).toBe(404);

    const admin = await createAdmin();
    await signInAsPanel(admin);
    expect((await readJson<ErrorBody>(await putPrograma(jsonRequest("/api/admin/hj/programas", { method: "PUT", body: { sigla: "XX", nome: "X" } })))).code).toBe("INVALID_PROGRAM");
    expect((await readJson<ErrorBody>(await putPrograma(jsonRequest("/api/admin/hj/programas", { method: "PUT", body: { sigla: "HJA", turmas: [{ nome: "4ª Turma" }, { nome: "4ª turma" }] } })))).code).toBe("DUPLICATE_COHORT");
    const saved = await readJson<{ programas: ProgramaCatalogo[] }>(await putPrograma(jsonRequest("/api/admin/hj/programas", { method: "PUT", body: { sigla: "HJA", nome: "HJ Academy Brasil", turmas: [{ nome: "1ª Turma", ativa: false }, { nome: "4ª Turma" }] } })));
    expect(saved.programas.find((item) => item.sigla === "HJA")).toEqual({ sigla: "HJA", nome: "HJ Academy Brasil", ativo: true, turmas: [{ nome: "1ª Turma", ativa: false }, { nome: "4ª Turma", ativa: true }] });
  });

  it("the testimony module follows the setting for members and stays on for educators", async () => {
    const { educador, membro } = await createTeamSetup();
    const admin = await createAdmin();

    await signInAsPanel(membro);
    // no testimony project → hidden in automatic mode
    expect((await readJson<PainelEu>(await getEu())).modulos).toEqual({ rm: true, testemunho: false });
    await createProjeto({ nome: "Testemunho", tipo: "testemunho" });
    expect((await readJson<PainelEu>(await getEu())).modulos.testemunho).toBe(true);

    await signInAsPanel(educador);
    expect((await putConfig(jsonRequest("/api/admin/hj/configuracoes", { method: "PUT", body: { modulos: { testemunho: "oculto" } } }))).status).toBe(404);

    await signInAsPanel(admin);
    expect((await readJson<ErrorBody>(await putConfig(jsonRequest("/api/admin/hj/configuracoes", { method: "PUT", body: { modulos: { testemunho: "x" } } })))).code).toBe("INVALID_MODE");
    const config = await readJson<ConfiguracoesAdmin>(await putConfig(jsonRequest("/api/admin/hj/configuracoes", { method: "PUT", body: { modulos: { testemunho: "oculto" } } })));
    expect(config).toMatchObject({ modulos: { testemunho: "oculto" }, testemunhoVisivelParaMembros: false, projetoTestemunho: { nome: "Testemunho" } });

    await signInAsPanel(membro);
    expect((await readJson<PainelEu>(await getEu())).modulos.testemunho).toBe(false);
    await signInAsPanel(educador);
    expect((await readJson<PainelEu>(await getEu())).modulos.testemunho).toBe(true);
    expect((await readJson<ConfiguracoesAdmin>(await getConfig())).modulos.testemunho).toBe("oculto");
  });
});
