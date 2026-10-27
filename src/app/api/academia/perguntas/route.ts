import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { lessonPlayable, type StructureLesson } from "@/lib/academy/gating";
import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import {
  loadCourseStructure,
  loadEnrollment,
  loadStudentState,
  type CourseDoc,
  type LessonDoc,
} from "@/lib/academy/load";
import type { LessonQuestion } from "@/lib/academy/types";
import { requireAcademySession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";
import { Lesson } from "@/models/lesson";
import { Question } from "@/models/question";

type QuestionRow = {
  _id: Types.ObjectId;
  // Populated with the slug on reads; a bare id right after a create.
  courseId: Types.ObjectId | { _id: Types.ObjectId; slug: string };
  lessonId: Types.ObjectId;
  courseTitle: string;
  lessonLabel: string;
  lessonNumber: number;
  text: string;
  answer: string;
  answeredBy: string;
  answeredAt: Date | null;
  answerSeenAt: Date | null;
  status: "open" | "answered" | "archived";
  createdAt: Date;
};

type AskBody = {
  lessonId?: string;
  text?: string;
};

const LIST_LIMIT = 200;
const MAX_TEXT_LENGTH = 500;
// Caps the inbox per course so one student cannot flood the tutors before
// a single answer comes back.
const MAX_OPEN_PER_COURSE = 5;

// An archived question was closed by a tutor without a reply; to the
// student it simply looks unanswered.
function toLessonQuestion(row: QuestionRow, courseSlug?: string): LessonQuestion {
  const answered = row.status === "answered";
  const course = row.courseId;

  return {
    id: row._id.toString(),
    text: row.text,
    status: answered ? "answered" : "pending",
    createdAt: row.createdAt.toISOString(),
    courseId: ("slug" in course ? course._id : course).toString(),
    courseSlug: courseSlug ?? ("slug" in course ? course.slug : ""),
    lessonId: row.lessonId.toString(),
    lessonNumber: row.lessonNumber ?? 0,
    courseTitle: row.courseTitle ?? "",
    lessonLabel: row.lessonLabel ?? "",
    answer: answered
      ? {
          text: row.answer ?? "",
          by: row.answeredBy ?? "",
          at: row.answeredAt ? row.answeredAt.toISOString() : "",
          seen: Boolean(row.answerSeenAt),
        }
      : null,
  };
}

export async function GET(request: Request) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const lessonId = new URL(request.url).searchParams.get("lessonId");
    if (lessonId != null && !isObjectId(lessonId)) {
      return jsonError("Aula inválida", 400);
    }

    const rows = (await Question.find({
      userId: session.userId,
      ...(lessonId ? { lessonId } : {}),
    })
      .sort({ createdAt: -1 })
      .limit(LIST_LIMIT)
      .populate("courseId", "slug")
      .lean()) as unknown as QuestionRow[];

    return NextResponse.json({ questions: rows.map((row) => toLessonQuestion(row)) });
  } catch (error) {
    return serverError("Erro ao listar perguntas", error, "Não foi possível carregar as perguntas");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const body = ((await request.json().catch(() => null)) ?? {}) as AskBody;
    const text = body.text?.trim() ?? "";

    if (!isObjectId(body.lessonId)) {
      return jsonError("Aula inválida", 400);
    }

    if (!text) {
      return jsonError("Escreva a sua pergunta", 400);
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return jsonError(`A pergunta deve ter no máximo ${MAX_TEXT_LENGTH} caracteres`, 400);
    }

    const tutorView = session.role === "tutor";

    const lesson = (await Lesson.findById(body.lessonId).lean()) as LessonDoc | null;
    if (!lesson || (!lesson.published && !tutorView)) {
      return jsonError("Aula não disponível", 404, { code: "lesson_not_available" });
    }

    const course = (await Course.findById(lesson.courseId).lean()) as CourseDoc | null;
    if (!course || (!course.published && !tutorView)) {
      return jsonError("Curso não disponível", 404, { code: "course_not_available" });
    }

    if (!tutorView) {
      const enrollment = await loadEnrollment(session.userId, course._id);
      const enrolled = enrollment?.status === "active";
      if (!enrolled) {
        return jsonError("Inscreva-se no curso para perguntar", 403, { code: "not_enrolled" });
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

      const gate = lessonPlayable(loaded.structure, state, structureLesson, enrolled);
      if (!gate.playable) {
        return jsonError("Aula bloqueada", 403, { code: gate.reason });
      }
    }

    const openCount = await Question.countDocuments({
      userId: session.userId,
      courseId: course._id,
      status: "open",
    });
    if (openCount >= MAX_OPEN_PER_COURSE) {
      return jsonError("Aguarde a resposta das suas perguntas anteriores", 429, {
        code: "too_many_open_questions",
      });
    }

    const created = await Question.create({
      userId: session.userId,
      courseId: course._id,
      lessonId: lesson._id,
      courseTitle: course.title.pt,
      lessonLabel: `Aula ${lesson.number}: ${lesson.title.pt}`,
      lessonNumber: lesson.number,
      text,
    });

    return NextResponse.json(
      { question: toLessonQuestion(created.toObject() as QuestionRow, course.slug) },
      { status: 201 },
    );
  } catch (error) {
    return serverError("Erro ao enviar pergunta", error, "Não foi possível enviar a pergunta");
  }
}
