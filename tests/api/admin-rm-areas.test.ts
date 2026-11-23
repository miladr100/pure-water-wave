import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as resultadosRm } from "@/app/api/admin/hj/resultados/route";
import type { AdminResultados } from "@/lib/hj/types";
import { HjArea } from "@/models/hj-area";
import { HjEquipe } from "@/models/hj-equipe";

import { jsonRequest, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createEducator, createEquipe, createMember, createProjeto, createRelatorio, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

// The RM numbers by region and by country Wang Song asked for (23/11/2026).
describe("RM por região e país", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  async function cenario() {
    const educador = await createEducator();
    const projeto = await createProjeto();
    const r1 = await HjArea.create({ tipo: "regiao", nome: "Região 1", paiId: null, ordem: 0 });
    const r2 = await HjArea.create({ tipo: "regiao", nome: "Região 2", paiId: null, ordem: 1 });
    const brasil = await HjArea.create({ tipo: "pais", nome: "Brasil", paiId: r1._id, ordem: 0 });
    const uruguai = await HjArea.create({ tipo: "pais", nome: "Uruguai", paiId: r2._id, ordem: 1 });
    const paraguai = await HjArea.create({ tipo: "pais", nome: "Paraguai", paiId: r2._id, ordem: 0 });
    const sp = await HjArea.create({ tipo: "local", nome: "São Paulo", paiId: brasil._id });
    const campinas = await HjArea.create({ tipo: "local", nome: "Campinas", paiId: brasil._id });
    const montevideu = await HjArea.create({ tipo: "local", nome: "Montevidéu", paiId: uruguai._id });
    const assuncao = await HjArea.create({ tipo: "local", nome: "Assunção", paiId: paraguai._id });

    const equipe = async (nome: string, areaId: unknown, programa: "HJA" | "HJR" = "HJA") => {
      const membros = [await createMember(`${nome} A`), await createMember(`${nome} B`)];
      const doc = await createEquipe(projeto._id, { nome, programa, educadorId: educador._id, membroIds: membros.map((m) => m._id) });
      await HjEquipe.updateOne({ _id: doc._id }, { $set: { areaId } });
      return { doc, membros };
    };
    const a = await equipe("Equipe SP", sp._id);
    const b = await equipe("Equipe Campinas", campinas._id, "HJR");
    const c = await equipe("Equipe Montevidéu", montevideu._id);
    const d = await equipe("Equipe Assunção", assuncao._id);
    const e = await equipe("Equipe sem local", null);

    const dia = projeto.inicio;
    await createRelatorio(projeto._id, a.doc._id, a.membros[0]._id, { data: dia, dinheiroCents: 30000, pixCents: 10000, despesasCents: 5000 });
    await createRelatorio(projeto._id, a.doc._id, a.membros[1]._id, { data: dia, dinheiroCents: 20000, pixCents: 0, despesasCents: 0 });
    await createRelatorio(projeto._id, b.doc._id, b.membros[0]._id, { data: dia, dinheiroCents: 10000, pixCents: 0, despesasCents: 0 });
    await createRelatorio(projeto._id, c.doc._id, c.membros[0]._id, { data: dia, dinheiroCents: 40000, pixCents: 0, despesasCents: 0 });
    await createRelatorio(projeto._id, d.doc._id, d.membros[0]._id, { data: dia, dinheiroCents: 5000, pixCents: 0, despesasCents: 0 });
    // a returned report does not count
    await createRelatorio(projeto._id, d.doc._id, d.membros[1]._id, { data: dia, dinheiroCents: 99900, pixCents: 0, despesasCents: 0, estado: "devolvido" });
    await createRelatorio(projeto._id, e.doc._id, e.membros[0]._id, { data: dia, dinheiroCents: 1000, pixCents: 0, despesasCents: 0 });
    return { educador };
  }

  it("adds the reports up by the region and the country of each team's local, sem área last", async () => {
    const { educador } = await cenario();
    await signInAsPanel(educador);
    const data = await readJson<AdminResultados>(await resultadosRm(jsonRequest("/api/admin/hj/resultados")));
    const { regioes, paises, total } = data.porArea;

    expect(regioes.map((row) => [row.nome, row.equipes, row.membros, row.relatorios, row.liquidoCents])).toEqual([
      ["Região 1", 2, 4, 3, 35000 + 20000 + 10000],
      ["Região 2", 2, 4, 2, 45000],
      ["Sem área definida", 1, 2, 1, 1000],
    ]);
    // countries in the order of the areas: region first, then the country's own order
    expect(paises.map((row) => [row.nome, row.regiao, row.liquidoCents])).toEqual([
      ["Brasil", "Região 1", 65000],
      ["Paraguai", "Região 2", 5000],
      ["Uruguai", "Região 2", 40000],
      ["Sem área definida", null, 1000],
    ]);
    expect(total).toMatchObject({ equipes: 5, membros: 10, relatorios: 6, dinheiroCents: 106000, pixCents: 10000, despesasCents: 5000, liquidoCents: 111000 });
    expect(paises[0]).toMatchObject({ dinheiroCents: 60000, pixCents: 10000, despesasCents: 5000, mediaCents: Math.round(65000 / 3) });
    expect(paises[0].participacao).toBeCloseTo(65000 / 111000);
    // the two tables add up to the same total
    expect(regioes.reduce((sum, row) => sum + row.liquidoCents, 0)).toBe(total.liquidoCents);
    expect(paises.reduce((sum, row) => sum + row.liquidoCents, 0)).toBe(total.liquidoCents);
  });

  it("follows the filters: one program keeps only its teams", async () => {
    const { educador } = await cenario();
    await signInAsPanel(educador);
    const data = await readJson<AdminResultados>(await resultadosRm(jsonRequest("/api/admin/hj/resultados?programa=HJR")));
    expect(data.porArea.regioes.map((row) => row.nome)).toEqual(["Região 1"]);
    expect(data.porArea.paises).toMatchObject([{ nome: "Brasil", equipes: 1, membros: 2, liquidoCents: 10000 }]);
    expect(data.porArea.total.participacao).toBe(1);
  });
});
