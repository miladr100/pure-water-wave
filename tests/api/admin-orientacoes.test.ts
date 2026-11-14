import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as inicioAdmin } from "@/app/api/admin/hj/inicio/route";
import { GET as listOrientacoes, POST as postOrientacao } from "@/app/api/admin/hj/orientacoes/route";
import { DELETE as deleteOrientacao } from "@/app/api/admin/hj/orientacoes/[id]/route";
import { GET as resultadosRm } from "@/app/api/admin/hj/resultados/route";
import { GET as equipesTestemunho } from "@/app/api/admin/hj/testemunho/equipes/route";
import { GET as inicioMembro } from "@/app/api/painel/inicio/route";
import { ATENCAO_MINIMO, indicadoresDe, pontoDeAtencao } from "@/lib/hj/testemunho";
import type { AdminHjInicio, AdminResultados, OrientacaoRow, PainelInicio, TestemunhoEquipes } from "@/lib/hj/types";
import { HjConvidado } from "@/models/hj-convidado";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createAdmin, createConvidado, createEducator, createProjeto, createTeamSetup, hoje, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

describe("os quatro indicadores e o ponto de atenção", () => {
  const vazio = { primeiroContato: null, gateway: null, fichaAssinada: null, inicioSistema1: null, fimSistema1: null, inicioSistema2: null, jardim: null };
  it("counts cumulatively: a guest in Jardim is in Kit 1, Kit 2 and Jardim", () => {
    const ind = indicadoresDe([
      { etapa: "gateway", datas: vazio },
      { etapa: "sistema1", datas: { ...vazio, fichaAssinada: "2026-01-02" } },
      { etapa: "sistema2", datas: { ...vazio, fichaAssinada: "2026-01-02" } },
      { etapa: "jardim", datas: { ...vazio, fichaAssinada: "2026-01-02" } },
    ]);
    expect(ind).toEqual({ kit1: 3, fichas: 3, kit2: 2, jardim: 1 });
  });

  it("flags a big drop between neighbours, never on tiny numbers", () => {
    expect(pontoDeAtencao({ kit1: 90, fichas: 2, kit2: 0, jardim: 0 })?.para).toBe("fichas");
    expect(pontoDeAtencao({ kit1: 10, fichas: 10, kit2: 0, jardim: 0 })?.para).toBe("kit2");
    expect(pontoDeAtencao({ kit1: 10, fichas: 10, kit2: 10, jardim: 0 })?.para).toBe("jardim");
    expect(pontoDeAtencao({ kit1: 10, fichas: 9, kit2: 8, jardim: 7 })).toBeNull();
    expect(pontoDeAtencao({ kit1: ATENCAO_MINIMO - 1, fichas: 0, kit2: 0, jardim: 0 })).toBeNull();
    expect(pontoDeAtencao({ kit1: 0, fichas: 0, kit2: 0, jardim: 0 })).toBeNull();
  });
});

describe("Orientações do educador", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("a team with Kit 1 but no fichas shows the attention flag; the educator writes down the orientation and the team sees it", async () => {
    const { educador, membro, colega, equipe } = await createTeamSetup();
    await createProjeto({ nome: "Testemunho", tipo: "testemunho" });
    for (let i = 0; i < 4; i += 1) {
      await createConvidado(i % 2 ? membro._id : colega._id, { nome: `G${i}`, etapa: "sistema1", conferencias: 2 });
    }
    // Kit 1 = 4, fichas = 0 → attention
    await signInAsPanel(educador);
    const equipes = await readJson<TestemunhoEquipes>(await equipesTestemunho());
    expect(equipes.totais).toMatchObject({ kit1: 4, fichas: 0, kit2: 0, jardim: 0, convidados: 4, comAtencao: 1 });
    expect(equipes.equipes[0]).toMatchObject({ nome: "Equipe 01 – HJA", indicadores: { kit1: 4, fichas: 0 }, orientacao: null, membrosComConvidado: 2 });
    expect(equipes.equipes[0].atencao?.para).toBe("fichas");

    const home = await readJson<AdminHjInicio>(await inicioAdmin(jsonRequest("/api/admin/hj/inicio")));
    expect(home.testemunho.comAtencao).toBe(1);
    expect(home.testemunho.porEquipe[0].atencao?.texto).toContain("Kit 1");

    expect((await readJson<ErrorBody>(await postOrientacao(jsonRequest("/api/admin/hj/orientacoes", { body: { modulo: "testemunho", equipeId: equipe._id.toString(), texto: "x" } })))).code).toBe("TEXT_REQUIRED");
    expect((await readJson<ErrorBody>(await postOrientacao(jsonRequest("/api/admin/hj/orientacoes", { body: { modulo: "testemunho", texto: "Sem alvo" } })))).code).toBe("TARGET_REQUIRED");
    const created = await postOrientacao(jsonRequest("/api/admin/hj/orientacoes", { body: { modulo: "testemunho", equipeId: equipe._id.toString(), texto: "Assinar a ficha logo depois do Gateway; a capitã acompanha cada um.", data: "2026-11-10" } }));
    expect(created.status).toBe(201);
    const { orientacao } = await readJson<{ orientacao: OrientacaoRow }>(created);
    expect(orientacao).toMatchObject({ modulo: "testemunho", equipe: { nome: "Equipe 01 – HJA" }, membro: null, data: "2026-11-10", autor: { nome: "Educador da Equipe" } });

    const again = await readJson<TestemunhoEquipes>(await equipesTestemunho());
    expect(again.equipes[0].orientacao?.texto).toContain("Assinar a ficha");

    // the fichas get signed: the attention moves to the next step (Kit 2 still at 0)
    await HjConvidado.updateMany({}, { $set: { "datas.fichaAssinada": hoje } });
    const signed = await readJson<TestemunhoEquipes>(await equipesTestemunho());
    expect(signed.totais).toMatchObject({ fichas: 4, comAtencao: 1 });
    expect(signed.equipes[0].atencao?.para).toBe("kit2");
    // …and goes away once they move on together, all the way to Jardim
    await HjConvidado.updateMany({}, { $set: { etapa: "sistema2", "datas.inicioSistema2": hoje } });
    expect((await readJson<TestemunhoEquipes>(await equipesTestemunho())).equipes[0].atencao?.para).toBe("jardim");
    await HjConvidado.updateMany({}, { $set: { etapa: "jardim", "datas.jardim": hoje } });
    expect((await readJson<TestemunhoEquipes>(await equipesTestemunho())).totais.comAtencao).toBe(0);

    await signInAsPanel(membro);
    const inicio = await readJson<PainelInicio>(await inicioMembro());
    expect(inicio.orientacoes.equipe?.texto).toContain("Assinar a ficha");
    expect(inicio.orientacoes.pessoal).toBeNull();
  });

  it("the RM inner goal per member reaches the member and the Metas grid; only the author or an admin deletes", async () => {
    const { educador, membro } = await createTeamSetup();
    const outro = await createEducator("Outro Educador");
    const admin = await createAdmin();

    await signInAsPanel(educador);
    const first = await readJson<{ orientacao: OrientacaoRow }>(await postOrientacao(jsonRequest("/api/admin/hj/orientacoes", { body: { modulo: "rm", membroId: membro._id.toString(), texto: "Agradecer 50 vezes por dia antes de sair", data: "2026-11-02" } })));
    const second = await readJson<{ orientacao: OrientacaoRow }>(await postOrientacao(jsonRequest("/api/admin/hj/orientacoes", { body: { modulo: "rm", membroId: membro._id.toString(), texto: "Meta da semana: encontrar Deus em cada conversa", data: "2026-11-09" } })));
    expect(second.orientacao.membro?.nome).toBe("Membro da Equipe");

    const history = await readJson<{ orientacoes: OrientacaoRow[] }>(await listOrientacoes(jsonRequest(`/api/admin/hj/orientacoes?membro=${membro._id}&modulo=rm`)));
    expect(history.orientacoes.map((row) => row.data)).toEqual(["2026-11-09", "2026-11-02"]);

    const grid = await readJson<AdminResultados>(await resultadosRm(jsonRequest("/api/admin/hj/resultados")));
    expect(grid.linhas.find((linha) => linha.membro.id === membro._id.toString())?.orientacao?.texto).toContain("Meta da semana");

    await signInAsPanel(membro);
    const inicio = await readJson<PainelInicio>(await inicioMembro());
    expect(inicio.orientacoes.pessoal?.texto).toContain("Meta da semana");

    await signInAsPanel(outro);
    expect((await readJson<ErrorBody>(await deleteOrientacao(jsonRequest(`/api/admin/hj/orientacoes/${second.orientacao.id}`, { method: "DELETE" }), params({ id: second.orientacao.id })))).code).toBe("NOT_AUTHOR");
    await signInAsPanel(admin);
    expect((await deleteOrientacao(jsonRequest(`/api/admin/hj/orientacoes/${second.orientacao.id}`, { method: "DELETE" }), params({ id: second.orientacao.id }))).status).toBe(200);
    await signInAsPanel(educador);
    expect((await deleteOrientacao(jsonRequest(`/api/admin/hj/orientacoes/${first.orientacao.id}`, { method: "DELETE" }), params({ id: first.orientacao.id }))).status).toBe(200);
    await signInAsPanel(membro);
    expect((await readJson<PainelInicio>(await inicioMembro())).orientacoes.pessoal).toBeNull();
  });
});
