import { NextResponse } from "next/server";

import { jsonError, serverError } from "@/lib/academy/http";
import { isIsoDay } from "@/lib/hj/dates";
import {
  computeLiquido,
  projetoResumo,
  relatorioRow,
  reportsOf,
  rmResumo,
  usersById,
  type RelatorioDoc,
} from "@/lib/hj/data";
import type { MeusRelatorios, RelatorioBody, RelatorioRow } from "@/lib/hj/types";
import { HjRelatorio } from "@/models/hj-relatorio";

import { intField, panelContext, textField } from "../_lib/context";

const MAX_CENTS = 100_000_000; // R$ 1.000.000,00 in one day is a typo

// GET: my reports in the active project, newest first, with the goal.
export async function GET() {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { user, hoje, projeto, equipe } = result.context;

    if (!projeto) {
      const empty: MeusRelatorios = { projeto: null, rm: null, relatorios: [] };
      return NextResponse.json(empty);
    }

    const meus = await reportsOf(projeto._id, { membroId: user._id });
    const users = await usersById([user._id, ...meus.map((item) => item.validadoPorId).filter((id): id is NonNullable<typeof id> => id != null)]);
    const equipes = new Map(equipe ? [[equipe._id.toString(), equipe]] : []);

    const body: MeusRelatorios = {
      projeto: projetoResumo(projeto, hoje),
      rm: rmResumo(projeto, meus, hoje),
      relatorios: [...meus].reverse().map((item) => relatorioRow(item, users, equipes)),
    };
    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao listar relatórios", error, "Não foi possível carregar os relatórios");
  }
}

// POST: send (or re-send) the report of one day. One document per member
// per day: sending again replaces the numbers and puts it back to
// "enviado" for the captain to look at.
export async function POST(request: Request) {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { user, hoje, projeto, equipe } = result.context;

    if (!projeto) {
      return jsonError("Não há um projeto de arrecadação ativo", 409, { code: "NO_PROJECT" });
    }
    if (!equipe) {
      return jsonError("Você ainda não está em uma equipe deste projeto", 409, { code: "NO_TEAM" });
    }

    const body = (await request.json().catch(() => ({}))) as Partial<RelatorioBody>;
    const data = typeof body.data === "string" ? body.data : hoje;
    if (!isIsoDay(data)) {
      return jsonError("Data inválida", 400, { code: "INVALID_DATE" });
    }
    if (data > hoje) {
      return jsonError("Não dá para enviar um dia que ainda não chegou", 400, { code: "FUTURE_DATE" });
    }
    if (data < projeto.inicio || data > projeto.fim) {
      return jsonError("Este dia está fora do projeto", 400, { code: "OUTSIDE_PROJECT" });
    }

    const dinheiroCents = intField(body.dinheiroCents, -1);
    const pixCents = intField(body.pixCents, -1);
    const despesasCents = intField(body.despesasCents, -1);
    if ([dinheiroCents, pixCents, despesasCents].some((value) => value < 0 || value > MAX_CENTS)) {
      return jsonError("Confira os valores: use números sem sinal", 400, { code: "INVALID_AMOUNT" });
    }

    const existing = (await HjRelatorio.findOne({ projetoId: projeto._id, membroId: user._id, data }).lean()) as RelatorioDoc | null;
    if (existing && existing.estado === "validado") {
      return jsonError("Este dia já foi validado; fale com o capitão para alterar", 409, { code: "ALREADY_VALIDATED" });
    }

    const values = {
      projetoId: projeto._id,
      equipeId: equipe._id,
      membroId: user._id,
      data,
      dinheiroCents,
      pixCents,
      despesasCents,
      liquidoCents: computeLiquido({ dinheiroCents, pixCents, despesasCents }),
      itens: intField(body.itens),
      contatos: intField(body.contatos),
      observacoes: textField(body.observacoes),
      estado: "enviado" as const,
      motivoDevolucao: "",
      enviadoEm: new Date(),
      validadoPorId: null,
      validadoEm: null,
    };

    const saved = (await HjRelatorio.findOneAndUpdate(
      { projetoId: projeto._id, membroId: user._id, data },
      { $set: values },
      { upsert: true, new: true },
    ).lean()) as RelatorioDoc;

    const users = await usersById([user._id]);
    const row: RelatorioRow = relatorioRow(saved, users, new Map([[equipe._id.toString(), equipe]]));
    const meus = await reportsOf(projeto._id, { membroId: user._id });

    return NextResponse.json({ relatorio: row, rm: rmResumo(projeto, meus, hoje), reenviado: Boolean(existing) }, { status: existing ? 200 : 201 });
  } catch (error) {
    return serverError("Erro ao enviar relatório", error, "Não foi possível enviar o relatório");
  }
}
