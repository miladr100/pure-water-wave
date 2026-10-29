import { NextResponse } from "next/server";
import { Types } from "mongoose";

import {
  examUnlocked,
  nextAfterPass,
  type CourseStructure,
  type LockReason,
  type StructureExam,
  type StudentState,
} from "@/lib/academy/gating";
import { examSnapshot, gradeExam, type AnswerMap, type ExamDocLike } from "@/lib/academy/grading";
import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import {
  loadCourseStructure,
  loadEnrollment,
  loadStudentState,
  recordCourseCompletion,
  type CourseDoc,
} from "@/lib/academy/load";
import { attemptResult, sanitizeExam, type AttemptDocLike } from "@/lib/academy/serialize";
import type { ExamResponse, StudentExam } from "@/lib/academy/types";
import { pick } from "@/lib/academy/localized";
import type { SessionPayload } from "@/lib/academy/auth";
import { requireAcademySession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";
import { Exam } from "@/models/exam";
import { ExamAttempt } from "@/models/exam-attempt";

type ExamRow = ExamDocLike & {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId | null;
};

type AttemptRow = AttemptDocLike & { passed: boolean; scorePct: number };

const EMPTY_STATE: StudentState = { progress: [], attempts: [] };

type Gate = { unlocked: true } | { unlocked: false; reason: LockReason };

// `error?: never` on the success branch is what lets `"error" in context`
// narrow; without it both handlers are typed as possibly answering nothing.
type ExamContext =
  | { error: NextResponse }
  | {
      error?: never;
      exam: ExamRow;
      course: CourseDoc;
      structure: CourseStructure;
      state: StudentState;
      gate: Gate;
      structureExam: StructureExam;
      studentExam: StudentExam;
      tutorView: boolean;
    };

// Everything both verbs need: the exam with its answer key (server side
// only), the course, the gating verdict and the student's state.
async function loadExamContext(session: SessionPayload, examId: string): Promise<ExamContext> {
  const tutorView = session.role === "tutor";

  const exam = (await Exam.findById(examId).lean()) as ExamRow | null;
  if (!exam) {
    return { error: jsonError("Atividade não encontrada", 404, { code: "exam_not_found" }) };
  }

  const course = (await Course.findById(exam.courseId).lean()) as CourseDoc | null;
  if (!course || (!course.published && !tutorView)) {
    return { error: jsonError("Curso não disponível", 404, { code: "course_not_available" }) };
  }

  const enrollment = await loadEnrollment(session.userId, course._id);
  const enrolled = enrollment?.status === "active";
  if (!enrolled && !tutorView) {
    return { error: jsonError("Inscreva-se no curso para responder", 403, { code: "not_enrolled" }) };
  }

  const loaded = (await loadCourseStructure(course._id, course))!;
  const state = tutorView ? EMPTY_STATE : await loadStudentState(session.userId, course._id);
  const examKey = exam._id.toString();
  const structureExam = loaded.structure.exams.find((item) => item.id === examKey)!;

  let gate: Gate = examUnlocked(loaded.structure, state, structureExam, enrolled || tutorView);
  // Tutors skip every gate except a dangling module reference, which is a
  // data problem they need to see.
  if (tutorView && !(gate.unlocked === false && gate.reason === "module_missing")) {
    gate = { unlocked: true };
  }

  const moduleDoc = exam.moduleId
    ? course.modules.find((item) => item._id.toString() === exam.moduleId!.toString())
    : null;

  const studentExam: StudentExam = {
    ...sanitizeExam(exam, session.language),
    courseSlug: course.slug,
    courseTitle: pick(course.title, session.language),
    moduleNumber: moduleDoc?.number ?? null,
    moduleTitle: moduleDoc ? pick(moduleDoc.title, session.language) : null,
    unlocked: gate.unlocked,
    lockReason: gate.unlocked ? null : gate.reason,
  };

  return { exam, course, structure: loaded.structure, state, gate, structureExam, studentExam, tutorView };
}

// Same preference as `bestAttempt()` in gating.ts; rows arrive newest first,
// so a tie keeps the most recent one.
function pickBestAttempt(attempts: AttemptRow[]) {
  let best: AttemptRow | null = null;

  for (const attempt of attempts) {
    if (
      !best ||
      (attempt.passed && !best.passed) ||
      (attempt.passed === best.passed && attempt.scorePct > best.scorePct)
    ) {
      best = attempt;
    }
  }

  return best;
}

function normalizeAnswers(input: unknown): AnswerMap | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const answers: AnswerMap = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === "string") {
      answers[key] = value;
    } else if (Array.isArray(value)) {
      answers[key] = value.filter((item): item is number => Number.isInteger(item));
    }
  }

  return answers;
}

export async function GET(_request: Request, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const { examId } = await params;
    if (!isObjectId(examId)) {
      return jsonError("Atividade inválida", 400);
    }

    const context = await loadExamContext(session, examId);
    if ("error" in context) {
      return context.error;
    }

    const { exam, structure, state, structureExam, studentExam, tutorView } = context;

    const attempts = tutorView
      ? []
      : ((await ExamAttempt.find({ userId: session.userId, examId: exam._id })
          .sort({ createdAt: -1 })
          .lean()) as AttemptRow[]);
    const best = pickBestAttempt(attempts);

    const body: ExamResponse = {
      exam: studentExam,
      result: best ? attemptResult(best, session.language, exam.passThreshold) : null,
      next: best?.passed ? nextAfterPass(structure, state, structureExam) : {},
    };

    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar atividade", error, "Não foi possível carregar a atividade");
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const { examId } = await params;
    if (!isObjectId(examId)) {
      return jsonError("Atividade inválida", 400);
    }

    const context = await loadExamContext(session, examId);
    if ("error" in context) {
      return context.error;
    }

    const { exam, course, structure, state, gate, structureExam, tutorView } = context;

    if (!gate.unlocked) {
      return jsonError("Atividade bloqueada", 403, { code: "exam_locked", reason: gate.reason });
    }

    const body = (await request.json().catch(() => null)) as { answers?: unknown } | null;
    const answers = normalizeAnswers(body?.answers);
    if (!answers) {
      return jsonError("Respostas inválidas", 400);
    }

    const graded = gradeExam(exam, answers, session.language);
    if (!graded.ok) {
      return jsonError("Responda todas as perguntas", 400, {
        code: "unanswered_questions",
        missing: graded.missing,
      });
    }

    const snapshot = examSnapshot(exam);
    const stored = {
      scorePct: graded.scorePct,
      mcCorrect: graded.mcCorrect,
      mcTotal: graded.mcTotal,
      passed: graded.passed,
      answers,
      detail: graded.detail,
      examSnapshot: snapshot,
      textReviews: graded.textReviews,
    };

    if (tutorView) {
      // A tutor's test run is graded like a student's but never written: it
      // would otherwise show up in the grading inbox and in their own gating.
      const preview = attemptResult(
        { _id: new Types.ObjectId(), createdAt: new Date(), ...stored },
        session.language,
        exam.passThreshold,
      );

      return NextResponse.json({ result: preview, next: {}, stored: false });
    }

    const attempt = await ExamAttempt.create({
      userId: session.userId,
      courseId: course._id,
      examId: exam._id,
      ...stored,
    });

    if (graded.passed) {
      await recordCourseCompletion(session.userId, course._id);
    }

    return NextResponse.json(
      {
        result: attemptResult(attempt.toObject() as AttemptDocLike, session.language, exam.passThreshold),
        next: graded.passed ? nextAfterPass(structure, state, structureExam) : {},
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError("Erro ao corrigir atividade", error, "Não foi possível enviar as respostas");
  }
}
