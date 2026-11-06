import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { canValidate, relatorioRow, usersById, type EquipeDoc, type RelatorioDoc } from "@/lib/hj/data";
import type { ValidacaoBody } from "@/lib/hj/types";
import { HjEquipe } from "@/models/hj-equipe";
import { HjRelatorio } from "@/models/hj-relatorio";

import { followerContext, textField } from "../../../_lib/context";

// The captain's (or the team's educator's) answer to a sent report:
// validate it, or send it back with a reason for the member to correct.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }

    const result = await followerContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;

    const relatorio = (await HjRelatorio.findById(id).lean()) as RelatorioDoc | null;
    if (!relatorio) {
      return jsonError("Não encontrado", 404);
    }
    const equipe = (await HjEquipe.findById(relatorio.equipeId).lean()) as EquipeDoc | null;
    if (!equipe || !canValidate(context, equipe)) {
      return jsonError("Não encontrado", 404);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<ValidacaoBody>;
    if (body.acao !== "validar" && body.acao !== "devolver") {
      return jsonError("Ação inválida", 400, { code: "INVALID_ACTION" });
    }
    const motivo = textField(body.motivo, 300);
    if (body.acao === "devolver" && !motivo) {
      return jsonError("Diga ao membro o que precisa corrigir", 400, { code: "REASON_REQUIRED" });
    }

    const update =
      body.acao === "validar"
        ? { estado: "validado", motivoDevolucao: "", validadoPorId: context.user._id, validadoEm: new Date() }
        : { estado: "devolvido", motivoDevolucao: motivo, validadoPorId: context.user._id, validadoEm: new Date() };

    const saved = (await HjRelatorio.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()) as RelatorioDoc;
    const users = await usersById([saved.membroId, context.user._id]);

    return NextResponse.json({ relatorio: relatorioRow(saved, users, new Map([[equipe._id.toString(), equipe]])) });
  } catch (error) {
    return serverError("Erro ao validar relatório", error, "Não foi possível validar o relatório");
  }
}
