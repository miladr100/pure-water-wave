import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import type { AdminExam } from "@/lib/academy/types";
import { normalizeLocalized } from "@/lib/academy/localized";
import { requireTutorSession } from "@/lib/academy/require-session";
import { Exam, QUESTION_TYPES, type QuestionType } from "@/models/exam";
import { ExamAttempt } from "@/models/exam-attempt";

import { adminExam, type ExamFullDoc } from "../../_lib/serialize";

type Params = { params: Promise<{ id: string }> };

type QuestionInput = Partial<AdminExam["questions"][number]> & {
  options?: Partial<AdminExam["questions"][number]["options"][number]>[];
};

type PatchBody = {
  passThreshold?: unknown;
  requiredToAdvance?: unknown;
  questions?: unknown;
};

const isQuestionType = (value: unknown): value is QuestionType =>
  typeof value === "string" && (QUESTION_TYPES as readonly string[]).includes(value);

// Rebuilds the question list, keeping the `_id` of every question and option
// the exam already had so earlier attempts (and their answers keyed by id)
// still line up. Returns the human message of the first problem found.
function buildQuestions(
  input: unknown,
  existing: ExamFullDoc["questions"],
): { error: string; questions?: undefined } | { error?: undefined; questions: unknown[] } {
  if (!Array.isArray(input)) {
    return { error: "Perguntas inválidas" };
  }

  const knownQuestions = new Map(existing.map((question) => [question._id.toString(), question]));
  const questions = [];

  for (const [index, raw] of (input as QuestionInput[]).entries()) {
    const position = index + 1;
    if (!raw || !isQuestionType(raw.qtype)) {
      return { error: `Pergunta ${position}: tipo inválido` };
    }

    const text = normalizeLocalized(raw.text);
    if (!text.pt) {
      return { error: `Pergunta ${position}: informe o enunciado em português` };
    }

    const known = typeof raw.id === "string" ? knownQuestions.get(raw.id) : undefined;
    const knownOptions = new Map((known?.options ?? []).map((option) => [option._id.toString(), option]));
    const isChoice = raw.qtype === "single" || raw.qtype === "multi";
    const rawOptions = Array.isArray(raw.options) ? raw.options : [];

    if (!isChoice && rawOptions.length > 0) {
      return { error: `Pergunta ${position}: este tipo não tem alternativas` };
    }

    const options = [];
    for (const option of rawOptions) {
      const optionText = normalizeLocalized(option?.text);
      if (!optionText.pt) {
        return { error: `Pergunta ${position}: alternativa sem texto em português` };
      }
      const keep = typeof option.id === "string" && knownOptions.has(option.id);
      options.push({
        _id: keep ? new Types.ObjectId(option.id) : new Types.ObjectId(),
        text: optionText,
        correct: Boolean(option.correct),
      });
    }

    if (isChoice) {
      const correct = options.filter((option) => option.correct).length;
      if (options.length < 2) {
        return { error: `Pergunta ${position}: informe pelo menos duas alternativas` };
      }
      if (raw.qtype === "single" && correct !== 1) {
        return { error: `Pergunta ${position}: marque exatamente uma alternativa correta` };
      }
      if (raw.qtype === "multi" && correct < 1) {
        return { error: `Pergunta ${position}: marque pelo menos uma alternativa correta` };
      }
    }

    questions.push({
      _id: known ? known._id : new Types.ObjectId(),
      qtype: raw.qtype,
      text,
      statementIsTrue: raw.qtype === "truefalse" ? Boolean(raw.statementIsTrue) : false,
      explanation: normalizeLocalized(raw.explanation),
      options,
    });
  }

  return { questions };
}

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
    const exam = isObjectId(id) ? ((await Exam.findById(id).lean()) as ExamFullDoc | null) : null;
    if (!exam) {
      return jsonError("Atividade não encontrada", 404);
    }

    const body = (await request.json().catch(() => ({}))) as PatchBody;
    const update: Record<string, unknown> = {};

    if (body.passThreshold !== undefined) {
      const threshold = Number(body.passThreshold);
      if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
        return jsonError("Nota mínima inválida", 400);
      }
      update.passThreshold = Math.round(threshold);
    }

    if (typeof body.requiredToAdvance === "boolean") {
      update.requiredToAdvance = body.requiredToAdvance;
    }

    if (body.questions !== undefined) {
      const built = buildQuestions(body.questions, exam.questions);
      if (built.error !== undefined) {
        return jsonError(built.error, 400, { code: "invalid_questions" });
      }
      update.questions = built.questions;
    }

    await Exam.updateOne({ _id: exam._id }, { $set: update });

    const [saved, attemptCount] = await Promise.all([
      Exam.findById(exam._id).lean() as Promise<ExamFullDoc>,
      ExamAttempt.countDocuments({ examId: exam._id }),
    ]);

    return NextResponse.json({ exam: adminExam(saved, attemptCount) });
  } catch (error) {
    return serverError("Erro ao atualizar atividade", error, "Não foi possível atualizar a atividade");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
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
    const exam = isObjectId(id) ? await Exam.findById(id).select("_id").lean() : null;
    if (!exam) {
      return jsonError("Atividade não encontrada", 404);
    }

    if (await ExamAttempt.exists({ examId: exam._id })) {
      return jsonError("Há alunos que já responderam esta atividade.", 409, { code: "has_attempts" });
    }

    await Exam.deleteOne({ _id: exam._id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("Erro ao excluir atividade", error, "Não foi possível excluir a atividade");
  }
}
