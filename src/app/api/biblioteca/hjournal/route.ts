import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requirePastorSession } from "@/lib/require-pastor-session";
import { HJournal } from "@/models/hjournal";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type HJournalBody = {
  dayNumber?: number;
  date?: string;
  hoonDokWords?: string;
  aha?: string;
  goal?: string;
  actionPlan?: string;
  analysis?: string;
  rating?: number | null;
};

function toPublicEntry(entry: {
  date: string;
  dayNumber: number;
  hoonDokWords?: string;
  aha?: string;
  goal?: string;
  actionPlan?: string;
  analysis?: string;
  rating?: number | null;
}) {
  return {
    date: entry.date,
    dayNumber: entry.dayNumber,
    hoonDokWords: entry.hoonDokWords ?? "",
    aha: entry.aha ?? "",
    goal: entry.goal ?? "",
    actionPlan: entry.actionPlan ?? "",
    analysis: entry.analysis ?? "",
    rating: entry.rating ?? null,
  };
}

async function listDays(userId: string) {
  const days = await HJournal.find({ userId })
    .sort({ dayNumber: 1 })
    .select("date dayNumber");

  return days.map((item) => ({
    date: item.date,
    dayNumber: item.dayNumber,
  }));
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

    const { searchParams } = new URL(request.url);
    const dayNumberRaw = searchParams.get("dayNumber");

    await connectDB();

    const days = await listDays(session.userId);

    if (dayNumberRaw != null) {
      const dayNumber = Number(dayNumberRaw);

      if (!Number.isInteger(dayNumber) || dayNumber < 1) {
        return NextResponse.json({ error: "Dia inválido" }, { status: 400 });
      }

      const entry = await HJournal.findOne({
        userId: session.userId,
        dayNumber,
      });

      return NextResponse.json({
        dayNumber,
        entry: entry ? toPublicEntry(entry) : null,
        days,
      });
    }

    if (days.length === 0) {
      return NextResponse.json({
        dayNumber: 1,
        entry: null,
        days,
      });
    }

    const lastDay = days[days.length - 1];
    const entry = await HJournal.findOne({
      userId: session.userId,
      dayNumber: lastDay.dayNumber,
    });

    return NextResponse.json({
      dayNumber: lastDay.dayNumber,
      entry: entry ? toPublicEntry(entry) : null,
      days,
    });
  } catch (error) {
    console.error("Erro ao carregar HJ Journal:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o diário" },
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

    const body = (await request.json()) as HJournalBody;
    const date = body.date?.trim() ?? "";
    const dayNumber = Number(body.dayNumber);

    if (!DATE_PATTERN.test(date)) {
      return NextResponse.json({ error: "Informe uma data válida" }, { status: 400 });
    }

    if (!Number.isInteger(dayNumber) || dayNumber < 1) {
      return NextResponse.json({ error: "Dia inválido" }, { status: 400 });
    }

    const rating = body.rating ?? null;

    if (rating != null && (![1, 2, 3, 4, 5].includes(rating))) {
      return NextResponse.json(
        { error: "A nota deve ser um número de 1 a 5" },
        { status: 400 },
      );
    }

    await connectDB();

    const existingByDate = await HJournal.findOne({
      userId: session.userId,
      date,
    });

    if (existingByDate && existingByDate.dayNumber !== dayNumber) {
      return NextResponse.json(
        {
          error: "Já existe um dia salvo nesta data",
          code: "DATE_IN_USE",
        },
        { status: 409 },
      );
    }

    const existingByDay = await HJournal.findOne({
      userId: session.userId,
      dayNumber,
    });

    const payload = {
      userId: session.userId,
      date,
      dayNumber,
      hoonDokWords: body.hoonDokWords?.trim() ?? "",
      aha: body.aha?.trim() ?? "",
      goal: body.goal?.trim() ?? "",
      actionPlan: body.actionPlan?.trim() ?? "",
      analysis: body.analysis?.trim() ?? "",
      rating,
    };

    if (existingByDay) {
      existingByDay.set(payload);
      await existingByDay.save();

      return NextResponse.json({
        ok: true,
        dayNumber: existingByDay.dayNumber,
        entry: toPublicEntry(existingByDay),
        days: await listDays(session.userId),
      });
    }

    const latest = await HJournal.findOne({ userId: session.userId })
      .sort({ dayNumber: -1 })
      .select("dayNumber");
    const nextDayNumber = (latest?.dayNumber ?? 0) + 1;

    if (dayNumber !== nextDayNumber) {
      return NextResponse.json(
        { error: "Crie o próximo dia em sequência" },
        { status: 400 },
      );
    }

    const entry = await HJournal.create(payload);

    return NextResponse.json({
      ok: true,
      dayNumber: entry.dayNumber,
      entry: toPublicEntry(entry),
      days: await listDays(session.userId),
    });
  } catch (error) {
    console.error("Erro ao salvar HJ Journal:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o diário" },
      { status: 500 },
    );
  }
}
