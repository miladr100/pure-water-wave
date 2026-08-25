import { NextResponse } from "next/server";

import { getHdhMeditationDay } from "@/lib/hdh-meditation";
import { connectDB } from "@/lib/mongodb";
import { requirePastorSession } from "@/lib/require-pastor-session";
import { HdhReflection } from "@/models/hdhreflection";

const MAX_ANSWER_LENGTH = 8000;
const MAX_INSPIRATION_LENGTH = 12000;

type HdhReflectionBody = {
  dayId?: number;
  answers?: unknown;
  inspiration?: string;
};

function toPublicEntry(entry: {
  dayId: number;
  answers?: string[];
  inspiration?: string;
}) {
  return {
    dayId: entry.dayId,
    answers: entry.answers ?? [],
    inspiration: entry.inspiration ?? "",
  };
}

function normalizeAnswers(raw: unknown, questionCount: number) {
  const source = Array.isArray(raw) ? raw : [];
  const answers: string[] = [];

  for (let index = 0; index < questionCount; index += 1) {
    const value = source[index];
    const text = typeof value === "string" ? value : "";

    if (text.length > MAX_ANSWER_LENGTH) {
      return { error: "Resposta muito longa" as const };
    }

    answers.push(text.trim());
  }

  return { answers };
}

export async function GET(request: Request) {
  try {
    const session = await requirePastorSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const dayIdRaw = searchParams.get("dayId");

    if (dayIdRaw == null) {
      const saved = await HdhReflection.find({ userId: session.userId }).select(
        "dayId",
      );

      return NextResponse.json({
        savedDayIds: saved.map((item) => item.dayId),
      });
    }

    const dayId = Number(dayIdRaw);
    const day = getHdhMeditationDay(dayId, session.language);

    if (!day) {
      return NextResponse.json({ error: "Dia inválido" }, { status: 400 });
    }

    const entry = await HdhReflection.findOne({
      userId: session.userId,
      dayId,
    });

    return NextResponse.json({
      dayId,
      entry: entry ? toPublicEntry(entry) : null,
    });
  } catch (error) {
    console.error("Erro ao carregar HDH Reflection:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a reflexão" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requirePastorSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as HdhReflectionBody;
    const dayId = Number(body.dayId);
    const day = getHdhMeditationDay(dayId, session.language);

    if (!day) {
      return NextResponse.json({ error: "Dia inválido" }, { status: 400 });
    }

    const inspiration = body.inspiration?.trim() ?? "";

    if (inspiration.length > MAX_INSPIRATION_LENGTH) {
      return NextResponse.json(
        { error: "Inspiração muito longa" },
        { status: 400 },
      );
    }

    const answerCount = Math.min(
      8,
      Math.max(
        day.questions.length,
        Array.isArray(body.answers) ? body.answers.length : 0,
      ),
    );
    const normalized = normalizeAnswers(body.answers, answerCount);

    if ("error" in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    await connectDB();

    const payload = {
      userId: session.userId,
      dayId,
      answers: normalized.answers,
      inspiration,
    };

    const entry = await HdhReflection.findOneAndUpdate(
      { userId: session.userId, dayId },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({
      ok: true,
      dayId,
      entry: entry ? toPublicEntry(entry) : payload,
    });
  } catch (error) {
    console.error("Erro ao salvar HDH Reflection:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a reflexão" },
      { status: 500 },
    );
  }
}
