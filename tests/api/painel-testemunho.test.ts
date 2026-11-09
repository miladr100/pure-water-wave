import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getConvidados, POST as postConvidado } from "@/app/api/painel/convidados/route";
import { GET as getConvidado, PATCH as patchConvidado } from "@/app/api/painel/convidados/[id]/route";
import { POST as postAcontecimento } from "@/app/api/painel/convidados/[id]/acontecimentos/route";
import { addDays } from "@/lib/hj/dates";
import type { Acontecimento, ConvidadoDetalhe, ConvidadoRow } from "@/lib/hj/types";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createAdmin, createConvidado, createMember, createTeamSetup, hoje, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const list = (escopo?: string) => getConvidados(jsonRequest(`/api/painel/convidados${escopo ? `?escopo=${escopo}` : ""}`));
const create = (body: unknown) => postConvidado(jsonRequest("/api/painel/convidados", { body }));
const detail = (id: string) => getConvidado(jsonRequest(`/api/painel/convidados/${id}`), params({ id }));
const patch = (id: string, body: unknown) =>
  patchConvidado(jsonRequest(`/api/painel/convidados/${id}`, { method: "PATCH", body }), params({ id }));
const event = (id: string, body: unknown) =>
  postAcontecimento(jsonRequest(`/api/painel/convidados/${id}/acontecimentos`, { body }), params({ id }));

describe("guests", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("a member creates a guest and gets the first contact on the timeline", async () => {
    const { membro } = await createTeamSetup();
    await signInAsPanel(membro);

    const response = await create({ nome: "  João Martins ", telefone: "11 99999-0000", cidade: "São Paulo" });
    expect(response.status).toBe(201);
    const { convidado } = await readJson<{ convidado: ConvidadoRow }>(response);
    expect(convidado).toMatchObject({ nome: "João Martins", etapa: "pre_gateway", ultimoContato: hoje, equipe: { nome: "Equipe 01 – HJA" } });

    const full = await readJson<{ convidado: ConvidadoDetalhe }>(await detail(convidado.id));
    expect(full.convidado.acontecimentos.map((a) => a.tipo)).toEqual(["contato"]);
    expect(full.convidado.sugestoes[0]).toBe("Combinar a data do Gateway");
  });

  it("refuses a nameless guest", async () => {
    const { membro } = await createTeamSetup();
    await signInAsPanel(membro);
    expect((await readJson<ErrorBody>(await create({ nome: "J" }))).code).toBe("NAME_REQUIRED");
  });

  it("scope: a member sees only their own, the captain the team's, the admin everyone's", async () => {
    const { membro, capita, colega } = await createTeamSetup();
    const stranger = await createMember("De outra equipe");
    await createConvidado(membro._id, { nome: "Do membro" });
    await createConvidado(colega._id, { nome: "Do colega" });
    await createConvidado(stranger._id, { nome: "De fora" });

    await signInAsPanel(membro);
    expect((await readJson<{ convidados: ConvidadoRow[] }>(await list())).convidados.map((c) => c.nome)).toEqual(["Do membro"]);

    resetNextHeaders();
    await signInAsPanel(capita);
    expect((await readJson<{ convidados: ConvidadoRow[] }>(await list("todos"))).convidados.map((c) => c.nome).sort()).toEqual(["Do colega", "Do membro"]);
    expect((await readJson<{ convidados: ConvidadoRow[] }>(await list("meus"))).convidados).toEqual([]);

    resetNextHeaders();
    const admin = await createAdmin();
    await signInAsPanel(admin);
    expect((await readJson<{ convidados: ConvidadoRow[] }>(await list())).convidados).toHaveLength(3);
  });

  it("a member cannot open or edit another member's guest", async () => {
    const { membro, colega } = await createTeamSetup();
    const guest = await createConvidado(colega._id);
    await signInAsPanel(membro);
    expect((await detail(guest._id.toString())).status).toBe(404);
    expect((await patch(guest._id.toString(), { nome: "Hackeado" })).status).toBe(404);
    expect((await event(guest._id.toString(), { tipo: "contato" })).status).toBe(404);
  });

  it("a conference moves the guest into Sistema 1 and counts up to 16", async () => {
    const { membro } = await createTeamSetup();
    const guest = await createConvidado(membro._id, { etapa: "gateway", ultimoContato: addDays(hoje, -3) });
    await signInAsPanel(membro);
    const id = guest._id.toString();

    const first = await event(id, { tipo: "conferencia" });
    expect(first.status).toBe(201);
    expect((await readJson<{ acontecimento: Acontecimento }>(first)).acontecimento.texto).toBe("Conferência 1 de 16");

    let full = (await readJson<{ convidado: ConvidadoDetalhe }>(await detail(id))).convidado;
    expect(full).toMatchObject({ etapa: "sistema1", conferencias: 1, ultimoContato: hoje });
    expect(full.datas.inicioSistema1).toBe(hoje);

    for (let n = 2; n <= 17; n += 1) {
      await event(id, { tipo: "conferencia" });
    }
    full = (await readJson<{ convidado: ConvidadoDetalhe }>(await detail(id))).convidado;
    expect(full.conferencias).toBe(16);
    expect(full.datas.fimSistema1).toBe(hoje);
    expect(full.sugestoes).toEqual(["Concluir o Sistema 1 e combinar o Sistema 2"]);
  });

  it("the Gateway and the form set their dates; a note needs text; no future dates", async () => {
    const { membro } = await createTeamSetup();
    const guest = await createConvidado(membro._id);
    await signInAsPanel(membro);
    const id = guest._id.toString();

    await event(id, { tipo: "gateway", data: addDays(hoje, -2) });
    await event(id, { tipo: "ficha", data: addDays(hoje, -1) });
    const full = (await readJson<{ convidado: ConvidadoDetalhe }>(await detail(id))).convidado;
    expect(full.etapa).toBe("gateway");
    expect(full.datas.gateway).toBe(addDays(hoje, -2));
    expect(full.datas.fichaAssinada).toBe(addDays(hoje, -1));
    expect(full.alerta).toBeNull();

    expect((await readJson<ErrorBody>(await event(id, { tipo: "nota", texto: " " }))).code).toBe("TEXT_REQUIRED");
    expect((await readJson<ErrorBody>(await event(id, { tipo: "contato", data: addDays(hoje, 1) }))).code).toBe("INVALID_DATE");
    expect((await readJson<ErrorBody>(await event(id, { tipo: "festa" }))).code).toBe("INVALID_TYPE");
  });

  it("moving the stage by PATCH writes the milestone and a timeline entry", async () => {
    const { membro } = await createTeamSetup();
    const guest = await createConvidado(membro._id, { etapa: "sistema1", conferencias: 16 });
    await signInAsPanel(membro);
    const id = guest._id.toString();

    const response = await patch(id, { etapa: "sistema2", proximoObjetivo: "Primeiro encontro do Sistema 2" });
    expect(response.status).toBe(200);
    const { convidado } = await readJson<{ convidado: ConvidadoDetalhe }>(response);
    expect(convidado.etapa).toBe("sistema2");
    expect(convidado.datas.inicioSistema2).toBe(hoje);
    expect(convidado.acontecimentos[0]).toMatchObject({ tipo: "etapa", texto: "Passou para Sistema 2" });
    expect(convidado.proximoObjetivo).toBe("Primeiro encontro do Sistema 2");

    expect((await readJson<ErrorBody>(await patch(id, { etapa: "ceu" }))).code).toBe("INVALID_STAGE");
    expect((await readJson<ErrorBody>(await patch(id, { datas: { gateway: "ontem" } }))).code).toBe("INVALID_DATE");
    expect((await readJson<ErrorBody>(await patch(id, {}))).code).toBe("EMPTY");
  });

  it("an educator may file a guest under a member of their teams, not under a stranger", async () => {
    const { membro, educador } = await createTeamSetup();
    const stranger = await createMember("De fora");
    await signInAsPanel(educador);

    const ok = await create({ nome: "Convidada da Ana", responsavelId: membro._id.toString() });
    expect(ok.status).toBe(201);
    expect((await readJson<{ convidado: ConvidadoRow }>(ok)).convidado.responsavel.id).toBe(membro._id.toString());

    expect((await readJson<ErrorBody>(await create({ nome: "Intruso", responsavelId: stranger._id.toString() }))).code).toBe("OUTSIDE_SCOPE");
  });
});
