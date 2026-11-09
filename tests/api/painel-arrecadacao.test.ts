import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getEquipe } from "@/app/api/painel/equipe/route";
import { GET as getInicio } from "@/app/api/painel/inicio/route";
import { GET as getRelatorios, POST as postRelatorio } from "@/app/api/painel/relatorios/route";
import { POST as postValidar } from "@/app/api/painel/relatorios/[id]/validar/route";
import { addDays } from "@/lib/hj/dates";
import type { EquipePainel, MeusRelatorios, PainelInicio, RelatorioRow } from "@/lib/hj/types";
import { HjRelatorio } from "@/models/hj-relatorio";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createMember, createProjeto, createRelatorio, createTeamSetup, hoje, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };
type SendReply = { relatorio: RelatorioRow; reenviado: boolean };

const send = (body: unknown) => postRelatorio(jsonRequest("/api/painel/relatorios", { body }));
const validar = (id: string, body: unknown) =>
  postValidar(jsonRequest(`/api/painel/relatorios/${id}/validar`, { body }), params({ id }));

describe("the member's RM report", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses a visitor without a session", async () => {
    const response = await send({ dinheiroCents: 100 });
    expect(response.status).toBe(401);
  });

  it("sends today's report, computes the líquido and lists it back", async () => {
    const { membro } = await createTeamSetup();
    await signInAsPanel(membro);

    const response = await send({ dinheiroCents: 35000, pixCents: 12000, despesasCents: 2000, itens: 4, contatos: 10, observacoes: "  Chuva  " });
    expect(response.status).toBe(201);
    const { relatorio, reenviado } = await readJson<SendReply>(response);
    expect(reenviado).toBe(false);
    expect(relatorio).toMatchObject({ data: hoje, liquidoCents: 45000, estado: "enviado", itens: 4, contatos: 10, observacoes: "Chuva" });

    const list = await readJson<MeusRelatorios>(await getRelatorios());
    expect(list.relatorios).toHaveLength(1);
    expect(list.rm?.totalCents).toBe(45000);
    expect(list.rm?.diasEnviados).toBe(1);
  });

  it("sending the same day again replaces the numbers and goes back to enviado", async () => {
    const { membro, projeto, equipe } = await createTeamSetup();
    await createRelatorio(projeto._id, equipe._id, membro._id, { estado: "devolvido", motivoDevolucao: "Confere o pix" });
    await signInAsPanel(membro);

    const response = await send({ dinheiroCents: 20000, pixCents: 0, despesasCents: 0 });
    expect(response.status).toBe(200);
    const { relatorio, reenviado } = await readJson<SendReply>(response);
    expect(reenviado).toBe(true);
    expect(relatorio).toMatchObject({ liquidoCents: 20000, estado: "enviado", motivoDevolucao: "" });
    expect(await HjRelatorio.countDocuments({ membroId: membro._id })).toBe(1);
  });

  it("refuses to touch a day the captain already validated", async () => {
    const { membro, projeto, equipe } = await createTeamSetup();
    await createRelatorio(projeto._id, equipe._id, membro._id, { estado: "validado" });
    await signInAsPanel(membro);

    const response = await send({ dinheiroCents: 1, pixCents: 0, despesasCents: 0 });
    expect(response.status).toBe(409);
    expect((await readJson<ErrorBody>(response)).code).toBe("ALREADY_VALIDATED");
  });

  it("refuses future days, days outside the project, bad amounts", async () => {
    const { membro, projeto } = await createTeamSetup();
    await signInAsPanel(membro);

    expect((await readJson<ErrorBody>(await send({ data: addDays(hoje, 1), dinheiroCents: 1, pixCents: 0, despesasCents: 0 }))).code).toBe("FUTURE_DATE");
    expect((await readJson<ErrorBody>(await send({ data: addDays(projeto.inicio, -1), dinheiroCents: 1, pixCents: 0, despesasCents: 0 }))).code).toBe("OUTSIDE_PROJECT");
    expect((await readJson<ErrorBody>(await send({ data: "2026-13-40", dinheiroCents: 1, pixCents: 0, despesasCents: 0 }))).code).toBe("INVALID_DATE");
    expect((await readJson<ErrorBody>(await send({ dinheiroCents: -5, pixCents: 0, despesasCents: 0 }))).code).toBe("INVALID_AMOUNT");
    expect((await readJson<ErrorBody>(await send({ dinheiroCents: "abc", pixCents: 0, despesasCents: 0 }))).code).toBe("INVALID_AMOUNT");
  });

  it("needs an active project and a team", async () => {
    const loner = await createMember("Sem equipe");
    await signInAsPanel(loner);
    expect((await readJson<ErrorBody>(await send({ dinheiroCents: 1, pixCents: 0, despesasCents: 0 }))).code).toBe("NO_PROJECT");

    await createProjeto();
    expect((await readJson<ErrorBody>(await send({ dinheiroCents: 1, pixCents: 0, despesasCents: 0 }))).code).toBe("NO_TEAM");
  });

  it("the home shows today's report, the returned days and the goal", async () => {
    const { membro, projeto, equipe } = await createTeamSetup();
    await createRelatorio(projeto._id, equipe._id, membro._id, { data: addDays(hoje, -2), dinheiroCents: 40000, pixCents: 0, estado: "validado" });
    await createRelatorio(projeto._id, equipe._id, membro._id, { data: addDays(hoje, -1), dinheiroCents: 10000, pixCents: 0, estado: "devolvido", motivoDevolucao: "Faltou o pix" });
    await signInAsPanel(membro);

    const home = await readJson<PainelInicio>(await getInicio());
    expect(home.membro.papeis).toEqual({ membro: true, capitao: false, educador: false, administrador: false });
    expect(home.hoje.relatorio).toBeNull();
    expect(home.devolvidos).toHaveLength(1);
    expect(home.devolvidos[0].motivoDevolucao).toBe("Faltou o pix");
    // Only the validated day counts: média 400 → nova meta 550
    expect(home.rm?.diasEnviados).toBe(1);
    expect(home.rm?.metaCents).toBe(55000);
    expect(home.equipeHoje).toBeNull();
  });
});

describe("the captain's validation", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("the captain validates a sent report", async () => {
    const { membro, capita, projeto, equipe } = await createTeamSetup();
    const report = await createRelatorio(projeto._id, equipe._id, membro._id);
    await signInAsPanel(capita);

    const response = await validar(report._id.toString(), { acao: "validar" });
    expect(response.status).toBe(200);
    const { relatorio } = await readJson<{ relatorio: RelatorioRow }>(response);
    expect(relatorio.estado).toBe("validado");
    expect(relatorio.validadoPor?.nome).toBe("Capitã da Equipe");
  });

  it("sending back needs a reason", async () => {
    const { membro, capita, projeto, equipe } = await createTeamSetup();
    const report = await createRelatorio(projeto._id, equipe._id, membro._id);
    await signInAsPanel(capita);

    expect((await readJson<ErrorBody>(await validar(report._id.toString(), { acao: "devolver", motivo: "  " }))).code).toBe("REASON_REQUIRED");
    const ok = await readJson<{ relatorio: RelatorioRow }>(await validar(report._id.toString(), { acao: "devolver", motivo: "Confere o pix" }));
    expect(ok.relatorio).toMatchObject({ estado: "devolvido", motivoDevolucao: "Confere o pix" });
  });

  it("a plain member cannot validate, and neither can another team's captain", async () => {
    const { membro, colega, projeto, equipe } = await createTeamSetup();
    const report = await createRelatorio(projeto._id, equipe._id, membro._id);

    await signInAsPanel(colega);
    expect((await validar(report._id.toString(), { acao: "validar" })).status).toBe(404);

    const otherCaptain = await createMember("Outra capitã");
    const { createEquipe } = await import("../helpers/hj");
    await createEquipe(projeto._id, { nome: "Equipe 02", capitaoId: otherCaptain._id, membroIds: [otherCaptain._id] });
    resetNextHeaders();
    await signInAsPanel(otherCaptain);
    expect((await validar(report._id.toString(), { acao: "validar" })).status).toBe(404);
  });

  it("the team's educator and an administrator may validate too", async () => {
    const { membro, educador, projeto, equipe } = await createTeamSetup();
    const report = await createRelatorio(projeto._id, equipe._id, membro._id);
    await signInAsPanel(educador);
    expect((await validar(report._id.toString(), { acao: "validar" })).status).toBe(200);

    const second = await createRelatorio(projeto._id, equipe._id, membro._id, { data: addDays(hoje, -1) });
    const { createAdmin } = await import("../helpers/hj");
    const admin = await createAdmin();
    resetNextHeaders();
    await signInAsPanel(admin);
    expect((await validar(second._id.toString(), { acao: "validar" })).status).toBe(200);
  });

  it("the team page lists who sent, what waits, and each member's goal", async () => {
    const { membro, capita, colega, projeto, equipe } = await createTeamSetup();
    await createRelatorio(projeto._id, equipe._id, membro._id, { dinheiroCents: 50000, pixCents: 0 });
    await createRelatorio(projeto._id, equipe._id, capita._id, { data: addDays(hoje, -1), estado: "validado" });
    await signInAsPanel(capita);

    const team = await readJson<EquipePainel>(await getEquipe());
    expect(team.equipe.capitao?.nome).toBe("Capitã da Equipe");
    expect(team.totalHojeCents).toBe(50000);
    expect(team.pendentes).toHaveLength(1);
    expect(team.membros.map((m) => m.nome)).toEqual(["Capitã da Equipe", "Colega da Equipe", "Membro da Equipe"]);
    const ofMember = team.membros.find((m) => m.nome === "Membro da Equipe")!;
    expect(ofMember.hoje?.liquidoCents).toBe(50000);
    expect(ofMember.metaCents).toBe(65000);
    expect(team.membros.find((m) => m.id === colega._id.toString())?.hoje).toBeNull();

    resetNextHeaders();
    await signInAsPanel(membro);
    const denied = await getEquipe();
    expect(denied.status).toBe(404);
    expect((await readJson<ErrorBody>(denied)).code).toBe("NOT_CAPTAIN");
  });
});
