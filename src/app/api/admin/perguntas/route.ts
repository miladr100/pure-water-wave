import { NextResponse } from "next/server";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";
import { Question } from "@/models/question";

import { questionRows, type QuestionDoc } from "../_lib/serialize";

const STATUSES = ["open", "answered", "archived"] as const;

export async function GET(request: Request) {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const status = new URL(request.url).searchParams.get("status") ?? "open";
    const filter =
      status === "all"
        ? {}
        : { status: (STATUSES as readonly string[]).includes(status) ? status : "open" };

    const questions = (await Question.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()) as QuestionDoc[];

    return NextResponse.json({ questions: await questionRows(questions) });
  } catch (error) {
    return serverError("Erro ao listar perguntas", error, "Não foi possível carregar as perguntas");
  }
}
