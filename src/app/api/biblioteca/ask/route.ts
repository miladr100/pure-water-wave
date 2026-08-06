import { NextResponse } from "next/server";

import { askLibraryAi } from "@/lib/library-ask";
import { requirePastorSession } from "@/lib/require-pastor-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type AskBody = {
  question?: string;
};

export async function POST(request: Request) {
  try {
    const session = await requirePastorSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as AskBody;
    const question = body.question?.trim() ?? "";

    if (!question) {
      return NextResponse.json(
        { error: "Informe uma pergunta" },
        { status: 400 },
      );
    }

    if (question.length < 5) {
      return NextResponse.json(
        { error: "A pergunta deve ter pelo menos 5 caracteres" },
        { status: 400 },
      );
    }

    const result = await askLibraryAi(question, session.language);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro no chat da biblioteca:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível responder à pergunta";

    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
