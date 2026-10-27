import { NextResponse } from "next/server";

import { lessonPlayable, lessonReachedEnd, type StructureLesson } from "@/lib/academy/gating";
import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import {
  loadCourseStructure,
  loadEnrollment,
  loadStudentState,
  recordCourseCompletion,
  type CourseDoc,
  type LessonDoc,
} from "@/lib/academy/load";
import type { ProgressBody } from "@/lib/academy/types";
import { requireAcademySession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";
import { Lesson } from "@/models/lesson";
import { LessonProgress } from "@/models/lesson-progress";

const DUPLICATE_KEY = 11000;

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function POST(request: Request) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    // Tutors watch without a ceiling and without leaving a trace: a tutor
    // checking a lesson must never look like a student who completed it.
    if (session.role === "tutor") {
      return NextResponse.json({ saved: false, skipped: "tutor_view" });
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const body = (await request.json().catch(() => null)) as Partial<ProgressBody> | null;
    if (!body || !isObjectId(body.lessonId)) {
      return jsonError("Aula inválida", 400);
    }

    const rawPercent = Number(body.percent);
    if (!Number.isFinite(rawPercent)) {
      return jsonError("Progresso inválido", 400);
    }

    const lesson = (await Lesson.findById(body.lessonId).lean()) as LessonDoc | null;
    if (!lesson?.published) {
      return jsonError("Aula não disponível", 404, { code: "lesson_not_available" });
    }

    const course = (await Course.findById(lesson.courseId).lean()) as CourseDoc | null;
    if (!course?.published) {
      return jsonError("Curso não disponível", 404, { code: "course_not_available" });
    }

    const enrollment = await loadEnrollment(session.userId, course._id);
    if (enrollment?.status !== "active") {
      return jsonError("Inscreva-se no curso para assistir", 403, { code: "not_enrolled" });
    }

    const loaded = (await loadCourseStructure(course._id, course))!;
    const state = await loadStudentState(session.userId, course._id);
    const lessonKey = lesson._id.toString();
    const structureLesson: StructureLesson = loaded.structure.lessons.find((item) => item.id === lessonKey) ?? {
      id: lessonKey,
      moduleId: lesson.moduleId.toString(),
      number: lesson.number,
      published: lesson.published,
      durationMinutes: lesson.durationMinutes ?? 0,
    };

    const gate = lessonPlayable(loaded.structure, state, structureLesson, true);
    if (!gate.playable) {
      return jsonError("Aula bloqueada", 403, { code: gate.reason });
    }

    const ended = body.ended === true;
    const maxSeconds = optionalNumber(body.maxSeconds);
    const durationSeconds = optionalNumber(body.durationSeconds);

    const save = async (): Promise<{ completed: boolean; justCompleted: boolean }> => {
      const existing = await LessonProgress.findOne({ userId: session.userId, lessonId: lesson._id });

      const percent = ended ? 100 : clampPercent(rawPercent);
      // The high-water mark only ever rises: it is the forward-seek ceiling.
      const maxPercent = ended
        ? 100
        : clampPercent(
            Math.max(percent, optionalNumber(body.maxPercent) ?? 0, existing?.maxPercent ?? 0, existing?.percent ?? 0),
          );
      const wasCompleted = existing?.completed ?? false;
      const completed = wasCompleted || lessonReachedEnd({ ended, maxPercent, maxSeconds, durationSeconds });
      const justCompleted = completed && !wasCompleted;
      const now = new Date();

      if (existing) {
        existing.percent = percent;
        existing.maxPercent = maxPercent;
        existing.completed = completed;
        if (justCompleted) {
          existing.completedAt = now;
        }
        await existing.save();
      } else {
        await LessonProgress.create({
          userId: session.userId,
          courseId: course._id,
          lessonId: lesson._id,
          percent,
          maxPercent,
          completed,
          completedAt: completed ? now : null,
        });
      }

      return { completed, justCompleted };
    };

    let outcome: { completed: boolean; justCompleted: boolean };
    try {
      outcome = await save();
    } catch (error) {
      // Two players of the same lesson (two tabs) can race on the unique
      // (user, lesson) index the first time; the loser merges on retry.
      if ((error as { code?: number }).code !== DUPLICATE_KEY) {
        throw error;
      }
      outcome = await save();
    }

    const courseCompleted = outcome.justCompleted
      ? await recordCourseCompletion(session.userId, course._id)
      : false;

    return NextResponse.json({ saved: true, completed: outcome.completed, courseCompleted });
  } catch (error) {
    return serverError("Erro ao salvar progresso", error, "Não foi possível salvar o progresso");
  }
}
