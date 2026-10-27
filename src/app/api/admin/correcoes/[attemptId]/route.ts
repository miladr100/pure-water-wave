import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";
import { ExamAttempt } from "@/models/exam-attempt";

type Params = { params: Promise<{ attemptId: string }> };

type PatchBody = { questionId?: unknown; feedback?: unknown; reviewed?: unknown };

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

    const { attemptId } = await params;
    const body = (await request.json().catch(() => ({}))) as PatchBody;
    const questionId = typeof body.questionId === "string" ? body.questionId : "";

    if (!isObjectId(attemptId) || !questionId) {
      return jsonError("Resposta não encontrada", 404);
    }
    if (typeof body.reviewed !== "boolean") {
      return jsonError("Informe se a resposta foi revisada", 400);
    }

    const set: Record<string, unknown> = {
      "textReviews.$.reviewed": body.reviewed,
      "textReviews.$.gradedBy": session.fullName,
      "textReviews.$.gradedAt": new Date(),
      // Any change is news for the student.
      "textReviews.$.feedbackSeenAt": null,
    };
    if (typeof body.feedback === "string") {
      set["textReviews.$.feedback"] = body.feedback.trim().slice(0, 5000);
    }

    const result = await ExamAttempt.updateOne(
      { _id: attemptId, "textReviews.questionId": questionId },
      { $set: set },
    );
    if (result.matchedCount === 0) {
      return jsonError("Resposta não encontrada", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("Erro ao revisar resposta", error, "Não foi possível salvar a revisão");
  }
}
