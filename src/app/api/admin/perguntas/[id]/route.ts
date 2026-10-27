import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";
import { Question } from "@/models/question";

import { questionRows, type QuestionDoc } from "../../_lib/serialize";

type Params = { params: Promise<{ id: string }> };

const STATUSES = ["open", "answered", "archived"] as const;

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const { id } = await params;
    if (!isObjectId(id) || !(await Question.exists({ _id: id }))) {
      return jsonError("Pergunta não encontrada", 404);
    }

    const body = (await request.json().catch(() => ({}))) as { answer?: unknown; status?: unknown };
    const update: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!(STATUSES as readonly unknown[]).includes(body.status)) {
        return jsonError("Status inválido", 400);
      }
      update.status = body.status;
    }

    if (typeof body.answer === "string") {
      const answer = body.answer.trim().slice(0, 5000);
      update.answer = answer;
      if (answer) {
        // A fresh answer is unread by definition: the student's bell lights
        // up again even if they had seen an earlier version.
        update.status = "answered";
        update.answeredAt = new Date();
        update.answeredBy = session.fullName;
        update.answerSeenAt = null;
      }
    }

    const saved = (await Question.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()) as
      | QuestionDoc
      | null;
    if (!saved) {
      return jsonError("Pergunta não encontrada", 404);
    }

    const [question] = await questionRows([saved]);
    return NextResponse.json({ question });
  } catch (error) {
    return serverError("Erro ao responder pergunta", error, "Não foi possível salvar a resposta");
  }
}
