import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import type { CourseDoc, LessonDoc } from "@/lib/academy/load";
import { parseYoutubeId } from "@/lib/academy/youtube";
import { normalizeLocalized } from "@/lib/academy/localized";
import { requireTutorSession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";
import { Lesson, VIDEO_PROVIDERS, type VideoProvider } from "@/models/lesson";
import { LessonProgress } from "@/models/lesson-progress";
import { Question } from "@/models/question";

import { adminLesson, lessonHasProgress, renumberLessons } from "../../_lib/serialize";

type Params = { params: Promise<{ id: string }> };

type PatchBody = {
  title?: unknown;
  description?: unknown;
  durationMinutes?: unknown;
  video?: { provider?: unknown; youtubeId?: unknown; bunnyVideoId?: unknown };
  materials?: unknown;
  published?: unknown;
  moduleId?: unknown;
  number?: unknown;
};

const isProvider = (value: unknown): value is VideoProvider =>
  typeof value === "string" && (VIDEO_PROVIDERS as readonly string[]).includes(value);

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
    const lesson = isObjectId(id) ? ((await Lesson.findById(id).lean()) as LessonDoc | null) : null;
    if (!lesson) {
      return jsonError("Aula não encontrada", 404);
    }

    const body = (await request.json().catch(() => ({}))) as PatchBody;
    const update: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = normalizeLocalized(body.title);
      if (!title.pt) {
        return jsonError("Informe o título em português", 400);
      }
      update.title = title;
    }

    if (body.description !== undefined) {
      update.description = normalizeLocalized(body.description);
    }

    if (body.durationMinutes !== undefined) {
      const minutes = Number(body.durationMinutes);
      if (!Number.isFinite(minutes) || minutes < 0) {
        return jsonError("Duração inválida", 400);
      }
      update.durationMinutes = Math.round(minutes);
    }

    const video = { ...lesson.video };
    if (body.video && typeof body.video === "object") {
      if (body.video.provider !== undefined) {
        if (!isProvider(body.video.provider)) {
          return jsonError("Provedor de vídeo inválido", 400);
        }
        video.provider = body.video.provider;
      }
      if (typeof body.video.youtubeId === "string") {
        const raw = body.video.youtubeId.trim();
        const parsed = raw ? parseYoutubeId(raw) : "";
        if (parsed === null) {
          return jsonError("Link ou ID do YouTube inválido", 400, { code: "invalid_youtube_id" });
        }
        video.youtubeId = parsed;
      }
      if (typeof body.video.bunnyVideoId === "string") {
        video.bunnyVideoId = body.video.bunnyVideoId.trim();
      }
      update.video = video;
    }

    if (body.materials !== undefined) {
      if (!Array.isArray(body.materials)) {
        return jsonError("Materiais inválidos", 400);
      }
      update.materials = (body.materials as { label?: unknown; url?: unknown }[])
        .map((item) => ({
          label: typeof item?.label === "string" ? item.label.trim() : "",
          url: typeof item?.url === "string" ? item.url.trim() : "",
        }))
        .filter((item) => item.label && item.url);
    }

    if (body.moduleId !== undefined) {
      const course = (await Course.findById(lesson.courseId).select("modules").lean()) as Pick<
        CourseDoc,
        "modules"
      > | null;
      if (!course?.modules.some((mod) => mod._id.toString() === body.moduleId)) {
        return jsonError("Módulo não encontrado", 400, { code: "module_not_found" });
      }
      update.moduleId = body.moduleId;
    }

    if (typeof body.published === "boolean") {
      const hasVideo = video.provider === "bunny" ? Boolean(video.bunnyVideoId) : Boolean(video.youtubeId);
      if (body.published && !hasVideo) {
        return jsonError("A aula precisa de um vídeo antes de ser publicada", 409, {
          code: "no_video",
        });
      }
      update.published = body.published;
    }

    let moveTo: number | null = null;
    if (body.number !== undefined) {
      const number = Number(body.number);
      if (!Number.isInteger(number) || number < 1) {
        return jsonError("Número inválido", 400);
      }
      if (number !== lesson.number) {
        moveTo = number;
      }
    }

    await Lesson.updateOne({ _id: lesson._id }, { $set: update });
    if (moveTo !== null) {
      await renumberLessons(lesson.courseId, { id: lesson._id, toNumber: moveTo });
    }

    const saved = (await Lesson.findById(lesson._id).lean()) as LessonDoc;
    return NextResponse.json({ lesson: adminLesson(saved, await lessonHasProgress(saved._id)) });
  } catch (error) {
    return serverError("Erro ao atualizar aula", error, "Não foi possível atualizar a aula");
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
    const lesson = isObjectId(id) ? ((await Lesson.findById(id).lean()) as LessonDoc | null) : null;
    if (!lesson) {
      return jsonError("Aula não encontrada", 404);
    }

    const [progress, question] = await Promise.all([
      LessonProgress.exists({ lessonId: lesson._id }),
      Question.exists({ lessonId: lesson._id }),
    ]);
    if (progress || question) {
      return jsonError("Há alunos com progresso nesta aula. Despublique em vez de excluir.", 409, {
        code: "has_progress",
      });
    }

    await Lesson.deleteOne({ _id: lesson._id });
    await renumberLessons(lesson.courseId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("Erro ao excluir aula", error, "Não foi possível excluir a aula");
  }
}
