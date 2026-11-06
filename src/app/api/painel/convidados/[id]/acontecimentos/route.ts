import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { isIsoDay } from "@/lib/hj/dates";
import { membersInScope, usersById, type ConvidadoDoc } from "@/lib/hj/data";
import { ACONTECIMENTO_TIPOS, CONFERENCIAS_SISTEMA1, type Acontecimento, type AcontecimentoBody } from "@/lib/hj/types";
import { HjAcontecimento, HjConvidado } from "@/models/hj-convidado";

import { panelContext, textField } from "../../../_lib/context";

// POST: something happened with the guest (a contact, a conference, the
// Gateway, a note). A contact of any kind refreshes `ultimoContato`; a
// conference adds one to the count; the Gateway sets its date and moves
// the stage when the guest was still before it.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }

    const doc = (await HjConvidado.findById(id).lean()) as ConvidadoDoc | null;
    const { ids } = await membersInScope(context);
    if (!doc || !ids.has(String(doc.responsavelId))) {
      return jsonError("Não encontrado", 404);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<AcontecimentoBody>;
    if (!ACONTECIMENTO_TIPOS.includes(body.tipo as never)) {
      return jsonError("Tipo inválido", 400, { code: "INVALID_TYPE" });
    }
    const tipo = body.tipo!;
    const data = body.data === undefined || body.data === "" ? context.hoje : body.data;
    if (!isIsoDay(data) || data > context.hoje) {
      return jsonError("Data inválida", 400, { code: "INVALID_DATE" });
    }
    let texto = textField(body.texto, 500);

    const set: Record<string, unknown> = {};
    if (!doc.ultimoContato || data > doc.ultimoContato) {
      set.ultimoContato = data;
    }
    if (tipo === "conferencia") {
      const next = Math.min(CONFERENCIAS_SISTEMA1, (doc.conferencias ?? 0) + 1);
      set.conferencias = next;
      if (doc.etapa === "pre_gateway" || doc.etapa === "gateway") {
        set.etapa = "sistema1";
        if (!doc.datas?.inicioSistema1) set["datas.inicioSistema1"] = data;
      }
      if (next === CONFERENCIAS_SISTEMA1 && !doc.datas?.fimSistema1) {
        set["datas.fimSistema1"] = data;
      }
      texto = texto || `Conferência ${next} de ${CONFERENCIAS_SISTEMA1}`;
    } else if (tipo === "gateway") {
      if (!doc.datas?.gateway) set["datas.gateway"] = data;
      if (doc.etapa === "pre_gateway") set.etapa = "gateway";
      texto = texto || "Participou do Gateway";
    } else if (tipo === "ficha") {
      if (!doc.datas?.fichaAssinada) set["datas.fichaAssinada"] = data;
      texto = texto || "Ficha assinada";
    } else if (tipo === "contato") {
      texto = texto || "Contato";
    } else if (tipo === "nota" && !texto) {
      return jsonError("Escreva a nota", 400, { code: "TEXT_REQUIRED" });
    }

    const created = await HjAcontecimento.create({ convidadoId: doc._id, autorId: context.user._id, tipo, texto, data });
    if (Object.keys(set).length > 0) {
      await HjConvidado.updateOne({ _id: doc._id }, { $set: set });
    }

    const users = await usersById([context.user._id]);
    const acontecimento: Acontecimento = {
      id: created._id.toString(),
      tipo,
      texto,
      data,
      autor: { id: context.user._id.toString(), nome: users.get(context.user._id.toString())?.fullName ?? "—" },
    };
    return NextResponse.json({ acontecimento }, { status: 201 });
  } catch (error) {
    return serverError("Erro ao registrar acontecimento", error, "Não foi possível registrar");
  }
}
