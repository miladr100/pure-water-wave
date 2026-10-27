import { NextResponse } from "next/server";

import { bunnyUploadConfigured, createVideo, tusAuth } from "@/lib/academy/bunny";
import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import type { LessonDoc } from "@/lib/academy/load";
import { requireTutorSession } from "@/lib/academy/require-session";
import { Lesson } from "@/models/lesson";

type Params = { params: Promise<{ id: string }> };

// Creates the Bunny video for the lesson and hands the browser a presigned
// TUS authorisation, so the file goes straight to Bunny without the API key.
export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    if (!bunnyUploadConfigured()) {
      return jsonError("Bunny Stream não está configurado", 503, { code: "bunny_not_configured" });
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const { id } = await params;
    const lesson = isObjectId(id) ? ((await Lesson.findById(id).lean()) as LessonDoc | null) : null;
    if (!lesson) {
      return jsonError("Aula não encontrada", 404);
    }

    const { guid } = await createVideo(lesson.title.pt || "Aula");
    await Lesson.updateOne(
      { _id: lesson._id },
      { $set: { "video.provider": "bunny", "video.bunnyVideoId": guid } },
    );

    return NextResponse.json({ guid, upload: tusAuth(guid) });
  } catch (error) {
    return serverError("Erro ao preparar envio", error, "Não foi possível preparar o envio do vídeo");
  }
}
