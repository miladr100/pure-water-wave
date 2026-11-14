import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { sameId } from "@/lib/hj/data";
import { HjOrientacao } from "@/models/hj-orientacao";

import { educatorContext } from "../../_lib/shared";

// DELETE: the author (or an administrator) removes a wrong note.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }
    const doc = await HjOrientacao.findById(id).lean();
    if (!doc) {
      return jsonError("Não encontrado", 404);
    }
    if (!context.papeis.administrador && !sameId(doc.autorId, context.user._id)) {
      return jsonError("Só quem escreveu (ou um administrador) apaga", 403, { code: "NOT_AUTHOR" });
    }
    await HjOrientacao.deleteOne({ _id: doc._id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("Erro ao apagar orientação", error, "Não foi possível apagar a orientação");
  }
}
