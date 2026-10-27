import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireAcademySession } from "@/lib/academy/require-session";
import { Question } from "@/models/question";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Pergunta inválida", 400);
    }

    const question = await Question.findOne({ _id: id, userId: session.userId });
    if (!question) {
      return jsonError("Pergunta não encontrada", 404, { code: "question_not_found" });
    }

    // First sight wins: the badge counts answers never opened, not visits.
    if (!question.answerSeenAt) {
      question.answerSeenAt = new Date();
      await question.save();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("Erro ao marcar resposta como vista", error, "Não foi possível atualizar a pergunta");
  }
}
