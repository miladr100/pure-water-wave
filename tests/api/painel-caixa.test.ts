import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as resumo } from "@/app/api/admin/hj/caixa/route";
import { PATCH as patchEquipe } from "@/app/api/admin/hj/equipes/[id]/route";
import { DELETE as apagar, GET as getCaixa, POST as lancar } from "@/app/api/painel/caixa/route";
import type { CaixaEquipe, CaixaResumo } from "@/lib/hj/types";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createEducator, createProjeto, createTeamSetup, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const caixa = (query = "") => getCaixa(jsonRequest(`/api/painel/caixa${query}`));
const post = (body: unknown, query = "") => lancar(jsonRequest(`/api/painel/caixa${query}`, { body }));
const del = (id: string, query = "") => apagar(jsonRequest(`/api/painel/caixa${query}${query ? "&" : "?"}lancamento=${id}`, { method: "DELETE" }));

describe("Caixa da equipe", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
    await createProjeto({ nome: "Testemunho", tipo: "testemunho" });
  });

  it("the captain posts, the team reads, the stay fee comes from the educator", async () => {
    const { educador, capita, membro, equipe } = await createTeamSetup();

    await signInAsPanel(membro);
    const visto = await readJson<CaixaEquipe>(await caixa());
    expect(visto).toMatchObject({ saldoCents: 0, podeLancar: false, equipe: { nome: "Equipe 01 – HJA", membros: 3 } });
    expect((await readJson<ErrorBody>(await post({ tipo: "saida", categoria: "alimentacao", valorCents: 1000 }))).code).toBe("NOT_ALLOWED");

    await signInAsPanel(capita);
    expect((await readJson<ErrorBody>(await post({ tipo: "x", categoria: "rm", valorCents: 1 }))).code).toBe("INVALID_TYPE");
    expect((await readJson<ErrorBody>(await post({ tipo: "entrada", categoria: "rm", valorCents: 0 }))).code).toBe("AMOUNT_REQUIRED");
    const entrada = await readJson<CaixaEquipe>(await post({ tipo: "entrada", categoria: "rm", valorCents: 150000, descricao: "RM da semana" }));
    expect(entrada.saldoCents).toBe(150000);
    const saida = await readJson<CaixaEquipe>(await post({ tipo: "saida", categoria: "alimentacao", valorCents: 32050, data: "2026-11-12" }));
    expect(saida).toMatchObject({ saldoCents: 117950, entradasCents: 150000, saidasCents: 32050 });
    expect(saida.lancamentos.map((row) => row.categoria)).toEqual(["rm", "alimentacao"]);

    // no fee yet → nothing to post
    expect((await readJson<ErrorBody>(await post({ estadia: { inicio: "2026-11-08", fim: "2026-11-14" } }))).code).toBe("NOTHING_TO_POST");

    await signInAsPanel(educador);
    const patched = await patchEquipe(jsonRequest(`/api/admin/hj/equipes/${equipe._id}`, { method: "PATCH", body: { taxaEstadiaCents: 2500 } }), params({ id: equipe._id.toString() }));
    expect(patched.status).toBe(200);

    await signInAsPanel(capita);
    const estadia = await readJson<CaixaEquipe>(await post({ estadia: { inicio: "2026-11-08", fim: "2026-11-14" } }));
    // 3 members × 7 days × R$ 25. Found by category, not by position: the list is
    // newest day first, and the entry above is dated the day the test runs.
    const taxa = estadia.lancamentos.find((row) => row.categoria === "estadia");
    expect(taxa).toMatchObject({ categoria: "estadia", automatico: true, valorCents: 52500, periodo: { inicio: "2026-11-08", fim: "2026-11-14" } });
    expect(estadia.saldoCents).toBe(117950 - 52500);
    expect((await readJson<ErrorBody>(await post({ estadia: { inicio: "2026-11-12", fim: "2026-11-20" } }))).code).toBe("PERIOD_POSTED");
    expect((await readJson<ErrorBody>(await post({ estadia: { inicio: "2026-11-20", fim: "2026-11-10" } }))).code).toBe("INVALID_PERIOD");

    const afterDelete = await readJson<CaixaEquipe>(await del(taxa!.id));
    expect(afterDelete.saldoCents).toBe(117950);
    expect((await del(taxa!.id)).status).toBe(404);
  });

  it("the team's educator posts; another educator only reads; the administrator sees every box", async () => {
    const { educador, capita, equipe } = await createTeamSetup();
    const outro = await createEducator("Outro Educador");
    const query = `?equipe=${equipe._id}`;

    await signInAsPanel(capita);
    await post({ tipo: "entrada", categoria: "doacao", valorCents: 10000 });

    await signInAsPanel(outro);
    expect((await readJson<CaixaEquipe>(await caixa(query))).podeLancar).toBe(false);
    expect((await readJson<ErrorBody>(await post({ tipo: "saida", categoria: "outro", valorCents: 100 }, query))).code).toBe("NOT_ALLOWED");

    await signInAsPanel(educador);
    const posted = await readJson<CaixaEquipe>(await post({ tipo: "saida", categoria: "transporte", valorCents: 4000 }, query));
    expect(posted.saldoCents).toBe(6000);

    const geral = await readJson<CaixaResumo>(await resumo());
    expect(geral.totais).toEqual({ saldoCents: 6000, entradasCents: 10000, saidasCents: 4000 });
    expect(geral.equipes[0]).toMatchObject({ equipe: { nome: "Equipe 01 – HJA" }, lancamentos: 2, taxaEstadiaCents: 0 });
  });

  it("someone outside every team has no box", async () => {
    const solto = await createEducator("Sem Equipe");
    await signInAsPanel(solto);
    expect((await readJson<ErrorBody>(await caixa())).code).toBe("NO_TEAM");
  });
});
