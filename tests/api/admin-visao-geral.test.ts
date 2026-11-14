import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getInicio } from "@/app/api/admin/hj/inicio/route";
import { GET as getResultados } from "@/app/api/admin/hj/resultados/route";
import { GET as getMeuPerfil, PATCH as patchMeuPerfil } from "@/app/api/painel/perfil/route";
import type { MeuPerfilHj } from "@/app/api/painel/perfil/route";
import type { AdminHjInicio, AdminResultados } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";

import { jsonRequest, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createConvidado, createMember, createRelatorio, createTeamSetup, hoje, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

// The Painel home shows the course's general numbers (Yeseong, 14/11/2026);
// the fundraising panorama lives in Restauração Material › Resultados.
describe("Dados gerais do curso", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("counts people, programs, boys and girls, the average age, and who stands out", async () => {
    const { educador, membro, colega, projeto, equipe } = await createTeamSetup();
    const [ano] = hoje.split("-").map(Number);
    // the member is filed under HJ Rang by their profile, the colleague under the team's program (HJA)
    await AcademyUser.updateOne({ _id: membro._id }, { $set: { birthday: new Date(Date.UTC(ano - 22, 0, 1)), "hj.perfil.genero": "feminino", "hj.perfil.programa": "HJR" } });
    await AcademyUser.updateOne({ _id: colega._id }, { $set: { birthday: new Date(Date.UTC(ano - 26, 0, 1)), "hj.perfil.genero": "masculino" } });
    // in no team, but filed under Pure Water: counts; a plain academy student does not
    const solto = await createMember("Sem Equipe");
    await AcademyUser.updateOne({ _id: solto._id }, { $set: { "hj.perfil.programa": "PW", "hj.perfil.genero": "feminino" } });
    await createMember("Só Academia");

    await createRelatorio(projeto._id, equipe._id, membro._id, { dinheiroCents: 10000, pixCents: 0, estado: "validado" });
    await createRelatorio(projeto._id, equipe._id, colega._id, { dinheiroCents: 30000, pixCents: 0, estado: "validado" });
    await createConvidado(membro._id, { nome: "No Jardim", etapa: "jardim" });
    await createConvidado(membro._id, { nome: "Gateway", etapa: "gateway" });
    for (const nome of ["A", "B", "C"]) {
      await createConvidado(colega._id, { nome, etapa: "pre_gateway" });
    }

    await signInAsPanel(educador);
    const home = await readJson<AdminHjInicio>(await getInicio(jsonRequest("/api/admin/hj/inicio")));
    expect(home.geral).toMatchObject({ pessoas: 4, meninos: 1, meninas: 2, semGenero: 1, idadeMedia: 24, comIdade: 2 });
    expect(home.geral.porPrograma).toEqual([
      { programa: "HJA", nome: "HJ Academy", pessoas: 2 },
      { programa: "HJR", nome: "HJ Rang", pessoas: 1 },
      { programa: "PW", nome: "Pure Water", pessoas: 1 },
    ]);
    expect(home.geral.destaquesRm.map((item) => [item.membro.nome, item.totalCents])).toEqual([
      ["Colega da Equipe", 30000],
      ["Membro da Equipe", 10000],
    ]);
    // someone who brought a guest to Jardim stands out over someone with more guests
    expect(home.geral.destaquesTestemunho.map((item) => [item.membro.nome, item.convidados, item.jardim])).toEqual([
      ["Membro da Equipe", 2, 1],
      ["Colega da Equipe", 3, 0],
    ]);
    expect(home.geral.destaquesTestemunho[0].equipe).toBe("Equipe 01 – HJA");

    // the panorama (totals, by program, by team) is still on the home's API and now on Resultados too
    expect(home.totais).toMatchObject({ liquidoCents: 40000, membros: 3, equipes: 1 });
    const resultados = await readJson<AdminResultados>(await getResultados(jsonRequest("/api/admin/hj/resultados?busca=colega")));
    expect(resultados.linhas).toHaveLength(1);
    expect(resultados.totais.liquidoCents).toBe(30000);
    expect(resultados.panorama?.totais).toMatchObject({ liquidoCents: 40000, membros: 3, equipes: 1 });
    expect(resultados.panorama?.equipes[0]).toMatchObject({ nome: "Equipe 01 – HJA", liquidoCents: 40000, membros: 3 });
  });

  it("the member keeps their own 'sexo'; an unknown value is ignored", async () => {
    const { membro } = await createTeamSetup();
    await signInAsPanel(membro);
    const saved = await readJson<MeuPerfilHj>(await patchMeuPerfil(jsonRequest("/api/painel/perfil", { method: "PATCH", body: { genero: "feminino" } })));
    expect(saved.perfil.genero).toBe("feminino");
    expect((await readJson<ErrorBody>(await patchMeuPerfil(jsonRequest("/api/painel/perfil", { method: "PATCH", body: { genero: "outro" } })))).code).toBe("EMPTY");
    expect((await readJson<MeuPerfilHj>(await getMeuPerfil())).perfil.genero).toBe("feminino");
    const cleared = await readJson<MeuPerfilHj>(await patchMeuPerfil(jsonRequest("/api/painel/perfil", { method: "PATCH", body: { genero: null } })));
    expect(cleared.perfil.genero).toBeNull();
  });
});
