import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { isIsoDay } from "@/lib/hj/dates";
import { convidadoRow, equipeLookup, guestsOf, membersInScope, usersById, type ConvidadoDoc } from "@/lib/hj/data";
import { CONVIDADO_ETAPAS, type ConvidadoBody, type ConvidadoRow } from "@/lib/hj/types";
import { HjAcontecimento, HjConvidado } from "@/models/hj-convidado";

import { intField, panelContext, textField } from "../_lib/context";

// GET: the guests the person follows — their own, plus their team's as
// captain, their teams' as educator, everyone's as administrator.
// `?escopo=meus` keeps only their own.
export async function GET(request: Request) {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const escopo = new URL(request.url).searchParams.get("escopo");

    const { ids, equipes } = await membersInScope(context);
    const alvo = escopo === "meus" ? new Set([context.user._id.toString()]) : ids;
    const guests = await guestsOf(alvo);
    const users = await usersById(guests.map((guest) => guest.responsavelId));
    const lookup = equipeLookup(equipes);

    const convidados: ConvidadoRow[] = guests.map((guest) => convidadoRow(guest, users, lookup, context.hoje));
    return NextResponse.json({ convidados, escopo: escopo === "meus" ? "meus" : "todos" });
  } catch (error) {
    return serverError("Erro ao listar convidados", error, "Não foi possível carregar os convidados");
  }
}

// POST: a new guest, followed by the person (or by another member in the
// educator's scope when `responsavelId` says so).
export async function POST(request: Request) {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const body = (await request.json().catch(() => ({}))) as Partial<ConvidadoBody>;

    const nome = textField(body.nome, 120);
    if (nome.length < 2) {
      return jsonError("Nome obrigatório", 400, { code: "NAME_REQUIRED" });
    }

    let responsavelId = context.user._id;
    if (body.responsavelId && !isObjectId(body.responsavelId)) {
      return jsonError("Responsável inválido", 400, { code: "INVALID_OWNER" });
    }
    if (body.responsavelId && body.responsavelId !== context.user._id.toString()) {
      const { ids } = await membersInScope(context);
      if (!ids.has(body.responsavelId)) {
        return jsonError("Esse membro não está nas suas equipes", 404, { code: "OUTSIDE_SCOPE" });
      }
      responsavelId = new Types.ObjectId(body.responsavelId);
    }

    const etapa = CONVIDADO_ETAPAS.includes(body.etapa as never) ? body.etapa! : "pre_gateway";
    const primeiroContato = isIsoDay(body.datas?.primeiroContato) ? body.datas!.primeiroContato! : context.hoje;

    const created = (await HjConvidado.create({
      responsavelId,
      nome,
      telefone: textField(body.telefone, 40),
      cidade: textField(body.cidade, 80),
      origem: textField(body.origem, 120),
      etapa,
      conferencias: Math.min(16, intField(body.conferencias)),
      ultimoContato: primeiroContato,
      proximoObjetivo: textField(body.proximoObjetivo, 200),
      notas: textField(body.notas, 2000),
      datas: { primeiroContato },
    })) as unknown as { _id: Types.ObjectId; toObject: () => ConvidadoDoc };

    await HjAcontecimento.create({
      convidadoId: created._id,
      autorId: context.user._id,
      tipo: "contato",
      texto: "Primeiro contato",
      data: primeiroContato,
    });

    const doc = (await HjConvidado.findById(created._id).lean()) as ConvidadoDoc;
    const users = await usersById([responsavelId]);
    const { equipes } = await membersInScope(context);
    return NextResponse.json({ convidado: convidadoRow(doc, users, equipeLookup(equipes), context.hoje) }, { status: 201 });
  } catch (error) {
    return serverError("Erro ao criar convidado", error, "Não foi possível salvar o convidado");
  }
}
