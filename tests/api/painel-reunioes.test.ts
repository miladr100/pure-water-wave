import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getMe } from "@/app/api/academia/me/route";
import { GET as listReunioes, POST as pedir } from "@/app/api/painel/reunioes/route";
import { PATCH as responder, POST as vista } from "@/app/api/painel/reunioes/[id]/route";
import type { MeResponse } from "@/lib/academy/types";
import type { ReuniaoRow, ReunioesLista } from "@/lib/hj/types";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createEducator, createTeamSetup, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const ask = (body: unknown) => pedir(jsonRequest("/api/painel/reunioes", { body }));
const list = () => listReunioes(jsonRequest("/api/painel/reunioes"));
const answer = (id: string, body: unknown) => responder(jsonRequest(`/api/painel/reunioes/${id}`, { method: "PATCH", body }), params({ id }));
const seen = (id: string) => vista(jsonRequest(`/api/painel/reunioes/${id}`, { method: "POST" }), params({ id }));
const bell = async () => (await readJson<MeResponse>(await getMe())).notifications.filter((item) => item.kind === "reuniao");

describe("Reuniões com o educador", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("a member asks their team's educator; the educator confirms; each side's bell follows", async () => {
    const { educador, membro } = await createTeamSetup();

    await signInAsPanel(membro);
    expect((await readJson<ErrorBody>(await ask({ motivo: "x" }))).code).toBe("REASON_REQUIRED");
    const created = await ask({ motivo: "Quero conversar sobre o RM", disponibilidade: "depois das 19h" });
    expect(created.status).toBe(201);
    const { reuniao } = await readJson<{ reuniao: ReuniaoRow }>(created);
    expect(reuniao.educador.id).toBe(educador._id.toString());
    expect(reuniao.estado).toBe("solicitada");
    // one open request per educator at a time
    expect((await readJson<ErrorBody>(await ask({ motivo: "Outra coisa" }))).code).toBe("ALREADY_OPEN");
    // nothing new for the member yet: the receipt is not a reply
    expect(await bell()).toEqual([]);

    await signInAsPanel(educador);
    const inbox = await readJson<ReunioesLista>(await list());
    expect(inbox.pendentes).toBe(1);
    expect(inbox.reunioes[0]).toMatchObject({ nova: true, membro: { nome: "Membro da Equipe", equipe: "Equipe 01 – HJA" } });
    const educatorBell = await bell();
    expect(educatorBell).toHaveLength(1);
    expect(educatorBell[0]).toMatchObject({ seen: false, href: "/admin/reunioes", lessonLabel: "Pedido de reunião" });

    expect((await readJson<ErrorBody>(await answer(reuniao.id, { acao: "confirmar" }))).code).toBe("DATETIME_REQUIRED");
    const confirmed = await readJson<{ reuniao: ReuniaoRow }>(await answer(reuniao.id, { acao: "confirmar", dataHora: "2026-11-16T22:00:00.000Z", local: "Centro", resposta: "Te espero" }));
    expect(confirmed.reuniao).toMatchObject({ estado: "confirmada", local: "Centro", dataHora: "2026-11-16T22:00:00.000Z" });
    // an answered request leaves the educator's bell
    expect(await bell()).toEqual([]);

    await signInAsPanel(membro);
    const memberBell = await bell();
    expect(memberBell).toHaveLength(1);
    expect(memberBell[0]).toMatchObject({ seen: false, href: "/painel/reunioes", lessonLabel: "Reunião confirmada" });
    expect((await seen(reuniao.id)).status).toBe(200);
    expect((await bell())[0].seen).toBe(true);

    await signInAsPanel(educador);
    expect((await readJson<{ reuniao: ReuniaoRow }>(await answer(reuniao.id, { acao: "realizada" }))).reuniao.estado).toBe("realizada");
  });

  it("only the asked educator (or an administrator) answers; the member may cancel", async () => {
    const { educador, membro } = await createTeamSetup();
    const outro = await createEducator("Outro Educador");

    await signInAsPanel(membro);
    const { reuniao } = await readJson<{ reuniao: ReuniaoRow }>(await ask({ motivo: "Preciso de orientação" }));

    await signInAsPanel(outro);
    expect((await readJson<ReunioesLista>(await list())).reunioes).toEqual([]);
    expect((await answer(reuniao.id, { acao: "recusar" })).status).toBe(404);

    await signInAsPanel(educador);
    expect((await readJson<ErrorBody>(await answer(reuniao.id, { acao: "remarcar" }))).code).toBe("REPLY_REQUIRED");
    expect((await readJson<{ reuniao: ReuniaoRow }>(await answer(reuniao.id, { acao: "remarcar", resposta: "Quarta às 20h?" }))).reuniao.estado).toBe("remarcar");

    await signInAsPanel(membro);
    expect((await readJson<ErrorBody>(await answer(reuniao.id, { acao: "recusar" }))).code).toBe("NOT_EDUCATOR");
    expect((await readJson<{ reuniao: ReuniaoRow }>(await answer(reuniao.id, { acao: "cancelar" }))).reuniao.estado).toBe("cancelada");
    expect((await readJson<ErrorBody>(await answer(reuniao.id, { acao: "cancelar" }))).code).toBe("CLOSED");
  });

  it("a member may pick another educator, never themself or a non-educator", async () => {
    const { educador, membro, colega } = await createTeamSetup();
    const outro = await createEducator("Outro Educador");
    await signInAsPanel(membro);
    expect((await readJson<ErrorBody>(await ask({ motivo: "Conversa", educadorId: colega._id.toString() }))).code).toBe("NOT_EDUCATOR");
    const created = await readJson<{ reuniao: ReuniaoRow }>(await ask({ motivo: "Conversa", educadorId: outro._id.toString() }));
    expect(created.reuniao.educador.id).toBe(outro._id.toString());
    const lista = await readJson<ReunioesLista>(await list());
    expect(lista.educadores.find((item) => item.minha)?.id).toBe(educador._id.toString());
  });
});
