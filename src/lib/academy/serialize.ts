import type { ExamDocLike, ExamSnapshot } from "@/lib/academy/grading";
import type { AttemptResult, StudentExam, StudentQuestion } from "@/lib/academy/types";
import { pick, type Localized } from "@/lib/academy/localized";
import type { UserLanguage } from "@/lib/user-languages";
import { DEFAULT_PASS_THRESHOLD } from "@/models/exam";

// The two shapes an exam document takes on its way to a student: the
// activity to answer (without the answer key) and the result of an attempt
// (rendered from the attempt's own snapshot, never from the live exam).

const MC_TYPES = new Set(["single", "multi", "truefalse"]);

export type SanitizedExam = Pick<
  StudentExam,
  | "id"
  | "scope"
  | "passThreshold"
  | "requiredToAdvance"
  | "questionCount"
  | "mcCount"
  | "textCount"
  | "reflectionCount"
  | "requiredCount"
  | "questions"
>;

export function sanitizeExam(exam: ExamDocLike, language: UserLanguage): SanitizedExam {
  const questions = exam.questions;
  const reflectionCount = questions.filter((question) => question.qtype === "reflection").length;

  return {
    id: exam._id.toString(),
    scope: exam.scope,
    passThreshold: exam.passThreshold,
    requiredToAdvance: exam.requiredToAdvance,
    questionCount: questions.length,
    mcCount: questions.filter((question) => MC_TYPES.has(question.qtype)).length,
    textCount: questions.filter((question) => question.qtype === "text").length,
    reflectionCount,
    requiredCount: questions.length - reflectionCount,
    questions: questions.map((question) => ({
      id: question._id.toString(),
      qtype: question.qtype,
      text: pick(question.text, language),
      options:
        question.qtype === "single" || question.qtype === "multi"
          ? (question.options ?? []).map((option) => pick(option.text, language))
          : [],
    })),
  };
}

export type AttemptDocLike = {
  _id: { toString(): string };
  scorePct: number;
  mcCorrect: number;
  mcTotal: number;
  passed: boolean;
  answers?: Record<string, number[] | string> | null;
  detail?: Record<string, boolean | "pending"> | null;
  examSnapshot?: ExamSnapshot | null;
  textReviews?: {
    questionId: string;
    reviewed?: boolean;
    reflection?: boolean;
    feedback?: string;
    gradedBy?: string;
    gradedAt?: Date | null;
  }[];
  createdAt?: Date;
};

// Attempts created before snapshots existed render with empty question
// lists; the score and the per-question verdicts still come through.
export function attemptResult(
  attempt: AttemptDocLike,
  language: UserLanguage,
  fallbackPassThreshold = DEFAULT_PASS_THRESHOLD,
): AttemptResult {
  const snapshot = attempt.examSnapshot ?? null;
  const questions: StudentQuestion[] = [];
  const correct: Record<string, number[]> = {};
  const explanations: Record<string, string> = {};

  for (const question of snapshot?.questions ?? []) {
    questions.push({
      id: question.id,
      qtype: question.qtype,
      text: pick(question.text, language),
      options: (question.options ?? []).map((option: Localized) => pick(option, language)),
    });
    correct[question.id] = question.correct ?? [];
    if (question.explanation) {
      explanations[question.id] = pick(question.explanation, language);
    }
  }

  const reviews = (attempt.textReviews ?? []).map((review) => ({
    questionId: review.questionId,
    reviewed: Boolean(review.reviewed),
    reflection: Boolean(review.reflection),
    feedback: review.feedback ?? "",
    gradedBy: review.gradedBy ?? "",
    gradedAt: review.gradedAt ? review.gradedAt.toISOString() : null,
  }));

  return {
    id: attempt._id.toString(),
    scorePct: attempt.scorePct,
    mcCorrect: attempt.mcCorrect,
    mcTotal: attempt.mcTotal,
    passed: attempt.passed,
    passThreshold: snapshot?.passThreshold ?? fallbackPassThreshold,
    submittedAt: (attempt.createdAt ?? new Date()).toISOString(),
    answers: attempt.answers ?? {},
    detail: attempt.detail ?? {},
    questions,
    correct,
    explanations,
    reviews,
    pendingReviewCount: reviews.filter((review) => !review.reflection && !review.reviewed).length,
  };
}
