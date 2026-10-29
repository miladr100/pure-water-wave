import { NextResponse } from "next/server";

import { signVideoUrl } from "@/lib/academy/bunny";
import {
  examPassed,
  finalExam,
  lessonPlayable,
  moduleExam,
  moduleLessons,
  type StructureLesson,
  type StudentState,
} from "@/lib/academy/gating";
import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import {
  loadCourseStructure,
  loadEnrollment,
  loadStudentState,
  type CourseDoc,
  type LessonDoc,
} from "@/lib/academy/load";
import type { LessonPlayerData, VideoPlayback } from "@/lib/academy/types";
import { pick } from "@/lib/academy/localized";
import { requireAcademySession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";
import { Lesson } from "@/models/lesson";

const EMPTY_STATE: StudentState = { progress: [], attempts: [] };

// Below this the player starts from the beginning rather than offering to
// resume a few seconds in.
const RESUME_MIN_PCT = 3;

export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const { lessonId } = await params;
    if (!isObjectId(lessonId)) {
      return jsonError("Aula inválida", 400);
    }

    const language = session.language;
    const tutorView = session.role === "tutor";

    const lesson = (await Lesson.findById(lessonId).lean()) as LessonDoc | null;
    if (!lesson || (!lesson.published && !tutorView)) {
      return jsonError("Aula não disponível", 404, { code: "lesson_not_available" });
    }

    const course = (await Course.findById(lesson.courseId).lean()) as CourseDoc | null;
    if (!course || (!course.published && !tutorView)) {
      return jsonError("Curso não disponível", 404, { code: "course_not_available" });
    }

    const loaded = (await loadCourseStructure(course._id, course))!;
    const { structure, lessons } = loaded;
    const enrollment = await loadEnrollment(session.userId, course._id);
    const enrolled = enrollment?.status === "active";
    const state = tutorView ? EMPTY_STATE : await loadStudentState(session.userId, course._id);

    const lessonKey = lesson._id.toString();
    const moduleKey = lesson.moduleId.toString();
    // An unpublished lesson (tutor preview) is not in the structure, so it is
    // described from its own document.
    const structureLesson: StructureLesson = structure.lessons.find((item) => item.id === lessonKey) ?? {
      id: lessonKey,
      moduleId: moduleKey,
      number: lesson.number,
      published: lesson.published,
      durationMinutes: lesson.durationMinutes ?? 0,
    };

    if (!tutorView) {
      if (!enrolled) {
        return jsonError("Inscreva-se no curso para assistir", 403, { code: "not_enrolled" });
      }

      const gate = lessonPlayable(structure, state, structureLesson, enrolled);
      if (!gate.playable) {
        return jsonError("Aula bloqueada", 403, { code: gate.reason });
      }
    }

    const row = state.progress.find((item) => item.lessonId === lessonKey);
    const completedBefore = Boolean(row?.completed);
    const resume =
      !tutorView && row && !row.completed && row.percent >= RESUME_MIN_PCT && row.percent < 100
        ? { percent: row.percent }
        : null;
    const maxPercent = tutorView || completedBefore ? 100 : Math.max(row?.maxPercent ?? 0, row?.percent ?? 0, 0);
    const durationMinutes = lesson.durationMinutes ?? 0;

    let video: VideoPlayback;

    if (lesson.video?.provider === "bunny") {
      const signed = lesson.video.bunnyVideoId ? signVideoUrl(lesson.video.bunnyVideoId) : null;
      if (!signed) {
        return jsonError("Vídeo ainda não disponível", 409, { code: "video_not_ready" });
      }

      video = {
        provider: "bunny",
        url: signed.url,
        authQuery: signed.authQuery,
        expiresAt: signed.expiresAt,
        resume,
        completedBefore,
        maxPercent,
        durationMinutes,
      };
    } else {
      const youtubeId = lesson.video?.youtubeId ?? "";
      if (!youtubeId) {
        return jsonError("Vídeo ainda não disponível", 409, { code: "video_not_ready" });
      }

      video = { provider: "youtube", youtubeId, resume, completedBefore, maxPercent, durationMinutes };
    }

    const inModule = moduleLessons(structure, moduleKey);
    const lastOfModule = inModule.length > 0 && inModule[inModule.length - 1].id === lessonKey;
    const exam = moduleExam(structure, moduleKey);
    const following = structure.lessons.find((item) => item.number > lesson.number);
    const final = finalExam(structure);

    let next: LessonPlayerData["next"];

    if (lastOfModule && exam && !examPassed(state, exam.id)) {
      next = { kind: "module-exam", examId: exam.id };
    } else if (following) {
      const doc = lessons.find((item) => item._id.toString() === following.id);
      next = {
        kind: "lesson",
        lessonId: following.id,
        lessonNumber: following.number,
        lessonTitle: doc ? pick(doc.title, language) : "",
      };
    } else if (final && !examPassed(state, final.id)) {
      next = { kind: "final-exam", examId: final.id };
    } else if (structure.lessons.length > 0) {
      next = { kind: "course-complete" };
    } else {
      next = { kind: "none" };
    }

    const moduleDoc = course.modules.find((item) => item._id.toString() === moduleKey);

    const body: LessonPlayerData = {
      lesson: {
        id: lessonKey,
        number: lesson.number,
        title: pick(lesson.title, language),
        description: pick(lesson.description, language),
        durationMinutes,
        materials: (lesson.materials ?? []).map((item) => ({ label: item.label, url: item.url })),
        moduleId: moduleKey,
        moduleNumber: moduleDoc?.number ?? 0,
        moduleTitle: moduleDoc ? pick(moduleDoc.title, language) : "",
      },
      course: { id: course._id.toString(), slug: course.slug, title: pick(course.title, language) },
      video,
      next,
    };

    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar aula", error, "Não foi possível carregar a aula");
  }
}
