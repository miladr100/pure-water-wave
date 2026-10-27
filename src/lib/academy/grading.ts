import type { UserLanguage } from "@/lib/user-languages";
import { pick, type Localized } from "@/lib/academy/localized";
import type { QuestionType } from "@/models/exam";

// Index 0 = Verdadeiro, index 1 = Falso. The player renders the two options
// in that order, so the two sides must agree.
export const TRUE_FALSE_INDEX = { true: 0, false: 1 } as const;

export type ExamQuestionDoc = {
  _id: { toString(): string };
  qtype: QuestionType;
  text: Localized;
  statementIsTrue?: boolean;
  explanation?: Localized;
  options?: { _id: { toString(): string }; text: Localized; correct?: boolean }[];
};

export type ExamDocLike = {
  _id: { toString(): string };
  scope: "module" | "final";
  passThreshold: number;
  requiredToAdvance: boolean;
  questions: ExamQuestionDoc[];
};

export type AnswerMap = Record<string, number[] | string>;

export type SnapshotQuestion = {
  id: string;
  qtype: QuestionType;
  text: Localized;
  options: Localized[];
  correct: number[];
  explanation: Localized | null;
};

export type ExamSnapshot = {
  passThreshold: number;
  questions: SnapshotQuestion[];
};

export function correctIndexes(question: ExamQuestionDoc): number[] {
  if (question.qtype === "truefalse") {
    return [question.statementIsTrue ? TRUE_FALSE_INDEX.true : TRUE_FALSE_INDEX.false];
  }

  if (question.qtype === "single" || question.qtype === "multi") {
    return (question.options ?? [])
      .map((option, index) => (option.correct ? index : -1))
      .filter((index) => index >= 0);
  }

  return [];
}

// Everything the result screen needs, frozen at submit time.
export function examSnapshot(exam: ExamDocLike): ExamSnapshot {
  return {
    passThreshold: exam.passThreshold,
    questions: exam.questions.map((question) => ({
      id: question._id.toString(),
      qtype: question.qtype,
      text: question.text,
      options:
        question.qtype === "single" || question.qtype === "multi"
          ? (question.options ?? []).map((option) => option.text)
          : [],
      correct: correctIndexes(question),
      explanation:
        question.qtype === "truefalse" && !question.statementIsTrue && question.explanation?.pt
          ? question.explanation
          : null,
    })),
  };
}

export type GradeResult =
  | { ok: false; missing: string[] }
  | {
      ok: true;
      scorePct: number;
      mcCorrect: number;
      mcTotal: number;
      passed: boolean;
      detail: Record<string, boolean | "pending">;
      textReviews: {
        questionId: string;
        questionText: string;
        reflection: boolean;
        answer: string;
      }[];
    };

function sameSet(a: number[], b: number[]) {
  if (a.length !== b.length) {
    return false;
  }

  const sorted = [...a].sort((x, y) => x - y);
  const other = [...b].sort((x, y) => x - y);
  return sorted.every((value, index) => value === other[index]);
}

// Every question must be answered except a blank reflection. Multiple-choice
// questions are graded exactly (the selected set must equal the correct set);
// written answers are "pending" until a tutor reviews them and never affect
// the score.
export function gradeExam(
  exam: ExamDocLike,
  answers: AnswerMap,
  language: UserLanguage = "pt",
): GradeResult {
  const missing: string[] = [];
  const detail: Record<string, boolean | "pending"> = {};
  const textReviews: { questionId: string; questionText: string; reflection: boolean; answer: string }[] = [];
  let mcCorrect = 0;
  let mcTotal = 0;

  for (const question of exam.questions) {
    const id = question._id.toString();
    const answer = answers[id];

    if (question.qtype === "text" || question.qtype === "reflection") {
      const text = typeof answer === "string" ? answer.trim() : "";

      if (!text) {
        if (question.qtype === "text") {
          missing.push(id);
        }
        continue;
      }

      detail[id] = "pending";
      textReviews.push({
        questionId: id,
        questionText: pick(question.text, language),
        reflection: question.qtype === "reflection",
        answer: text.slice(0, 2000),
      });
      continue;
    }

    const selected = Array.isArray(answer)
      ? answer.filter((value) => Number.isInteger(value) && value >= 0)
      : [];

    if (selected.length === 0) {
      missing.push(id);
      continue;
    }

    mcTotal += 1;
    const correct = sameSet(selected, correctIndexes(question));
    detail[id] = correct;
    if (correct) {
      mcCorrect += 1;
    }
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  const scorePct = mcTotal === 0 ? 100 : Math.round((mcCorrect / mcTotal) * 100);

  return {
    ok: true,
    scorePct,
    mcCorrect,
    mcTotal,
    passed: scorePct >= exam.passThreshold,
    detail,
    textReviews,
  };
}
