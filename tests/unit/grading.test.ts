import { describe, expect, it } from "vitest";

import {
  correctIndexes,
  examSnapshot,
  gradeExam,
  TRUE_FALSE_INDEX,
  type ExamDocLike,
  type ExamQuestionDoc,
} from "@/lib/academy/grading";

const id = (value: string) => ({ toString: () => value });

function options(...flags: boolean[]): ExamQuestionDoc["options"] {
  return flags.map((correct, index) => ({ _id: id(`o${index}`), text: { pt: `Opção ${index}` }, correct }));
}

const single: ExamQuestionDoc = {
  _id: id("q-single"),
  qtype: "single",
  text: { pt: "Única", en: "Single" },
  options: options(false, true, false),
};

const multi: ExamQuestionDoc = {
  _id: id("q-multi"),
  qtype: "multi",
  text: { pt: "Múltipla" },
  options: options(true, false, true),
};

const trueStatement: ExamQuestionDoc = {
  _id: id("q-true"),
  qtype: "truefalse",
  text: { pt: "Verdadeira" },
  statementIsTrue: true,
  explanation: { pt: "Não deveria aparecer" },
};

const falseStatement: ExamQuestionDoc = {
  _id: id("q-false"),
  qtype: "truefalse",
  text: { pt: "Falsa" },
  statementIsTrue: false,
  explanation: { pt: "Porque sim", en: "Because" },
};

const text: ExamQuestionDoc = { _id: id("q-text"), qtype: "text", text: { pt: "Escreva", es: "Escriba" } };

const reflection: ExamQuestionDoc = {
  _id: id("q-reflection"),
  qtype: "reflection",
  text: { pt: "Reflita", en: "" },
};

function examOf(questions: ExamQuestionDoc[], passThreshold = 70): ExamDocLike {
  return { _id: id("exam"), scope: "module", passThreshold, requiredToAdvance: true, questions };
}

describe("correctIndexes", () => {
  it("lists every option flagged correct for single and multi questions", () => {
    expect(correctIndexes(single)).toEqual([1]);
    expect(correctIndexes(multi)).toEqual([0, 2]);
  });

  it("is empty for a choice question without options", () => {
    expect(correctIndexes({ _id: id("q"), qtype: "single", text: { pt: "" } })).toEqual([]);
  });

  it("maps a true statement to index 0 and a false one to index 1", () => {
    expect(TRUE_FALSE_INDEX).toEqual({ true: 0, false: 1 });
    expect(correctIndexes(trueStatement)).toEqual([0]);
    expect(correctIndexes(falseStatement)).toEqual([1]);
    expect(correctIndexes({ ...falseStatement, statementIsTrue: undefined })).toEqual([1]);
  });

  it("has no correct index for written questions", () => {
    expect(correctIndexes(text)).toEqual([]);
    expect(correctIndexes(reflection)).toEqual([]);
  });
});

describe("examSnapshot", () => {
  const snapshot = examSnapshot(examOf([single, multi, trueStatement, falseStatement, text, reflection], 80));

  it("freezes the threshold and one entry per question in order", () => {
    expect(snapshot.passThreshold).toBe(80);
    expect(snapshot.questions.map((question) => question.id)).toEqual([
      "q-single",
      "q-multi",
      "q-true",
      "q-false",
      "q-text",
      "q-reflection",
    ]);
  });

  it("keeps option texts only for single and multi questions", () => {
    const byId = Object.fromEntries(snapshot.questions.map((question) => [question.id, question]));
    expect(byId["q-single"].options).toEqual([{ pt: "Opção 0" }, { pt: "Opção 1" }, { pt: "Opção 2" }]);
    expect(byId["q-multi"].options).toHaveLength(3);
    expect(byId["q-true"].options).toEqual([]);
    expect(byId["q-text"].options).toEqual([]);
    expect(byId["q-reflection"].options).toEqual([]);
  });

  it("stores the correct indexes and the question text as is", () => {
    const byId = Object.fromEntries(snapshot.questions.map((question) => [question.id, question]));
    expect(byId["q-single"].correct).toEqual([1]);
    expect(byId["q-multi"].correct).toEqual([0, 2]);
    expect(byId["q-false"].correct).toEqual([1]);
    expect(byId["q-single"].text).toEqual({ pt: "Única", en: "Single" });
    expect(byId["q-single"].qtype).toBe("single");
  });

  it("keeps the explanation only for a false statement that has Portuguese text", () => {
    const byId = Object.fromEntries(snapshot.questions.map((question) => [question.id, question]));
    expect(byId["q-false"].explanation).toEqual({ pt: "Porque sim", en: "Because" });
    expect(byId["q-true"].explanation).toBeNull();

    const blank = examSnapshot(examOf([{ ...falseStatement, explanation: { pt: "", en: "Only English" } }]));
    expect(blank.questions[0].explanation).toBeNull();

    const withoutExplanation = examSnapshot(examOf([{ ...falseStatement, explanation: undefined }]));
    expect(withoutExplanation.questions[0].explanation).toBeNull();
  });
});

describe("gradeExam", () => {
  it("reports every unanswered question instead of a score", () => {
    const result = gradeExam(examOf([single, multi, trueStatement]), { "q-single": [1] });
    expect(result).toEqual({ ok: false, missing: ["q-multi", "q-true"] });
  });

  it("treats an empty selection, a non-array or negative indexes as unanswered", () => {
    const exam = examOf([single]);
    expect(gradeExam(exam, { "q-single": [] })).toEqual({ ok: false, missing: ["q-single"] });
    expect(gradeExam(exam, { "q-single": "1" })).toEqual({ ok: false, missing: ["q-single"] });
    expect(gradeExam(exam, { "q-single": [-1, 1.5] })).toEqual({ ok: false, missing: ["q-single"] });
  });

  it("counts a blank text answer as missing but not a blank reflection", () => {
    expect(gradeExam(examOf([text]), { "q-text": "   " })).toEqual({ ok: false, missing: ["q-text"] });
    expect(gradeExam(examOf([text]), {})).toEqual({ ok: false, missing: ["q-text"] });

    const result = gradeExam(examOf([reflection]), { "q-reflection": "" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.textReviews).toEqual([]);
      expect(result.detail).toEqual({});
    }
  });

  it("grades a single-choice question by its one correct option", () => {
    const right = gradeExam(examOf([single]), { "q-single": [1] });
    const wrong = gradeExam(examOf([single]), { "q-single": [0] });
    expect(right.ok && right.detail["q-single"]).toBe(true);
    expect(wrong.ok && wrong.detail["q-single"]).toBe(false);
  });

  it("grades a multiple-choice question only when the selected set equals the correct set", () => {
    const exam = examOf([multi]);
    const exact = gradeExam(exam, { "q-multi": [2, 0] });
    const subset = gradeExam(exam, { "q-multi": [0] });
    const superset = gradeExam(exam, { "q-multi": [0, 1, 2] });
    expect(exact.ok && exact.detail["q-multi"]).toBe(true);
    expect(subset.ok && subset.detail["q-multi"]).toBe(false);
    expect(superset.ok && superset.detail["q-multi"]).toBe(false);
  });

  it("grades true/false against the statement's truth", () => {
    const exam = examOf([trueStatement, falseStatement]);
    const result = gradeExam(exam, { "q-true": [0], "q-false": [0] });
    expect(result.ok && result.detail).toEqual({ "q-true": true, "q-false": false });
  });

  it("scores the rounded share of correct multiple-choice answers", () => {
    const exam = examOf([single, multi, trueStatement]);
    const result = gradeExam(exam, { "q-single": [1], "q-multi": [0], "q-true": [0] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mcCorrect).toBe(2);
      expect(result.mcTotal).toBe(3);
      expect(result.scorePct).toBe(67);
    }
  });

  it("scores 100 when there is no multiple-choice question", () => {
    const result = gradeExam(examOf([text, reflection]), { "q-text": "Resposta" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.scorePct).toBe(100);
      expect(result.mcTotal).toBe(0);
      expect(result.passed).toBe(true);
    }
  });

  it("passes exactly at the threshold and fails just below it", () => {
    const exam = examOf([single, multi, trueStatement, falseStatement], 75);
    const threeOfFour = gradeExam(exam, { "q-single": [1], "q-multi": [0, 2], "q-true": [0], "q-false": [0] });
    expect(threeOfFour.ok && threeOfFour.scorePct).toBe(75);
    expect(threeOfFour.ok && threeOfFour.passed).toBe(true);

    const twoOfFour = gradeExam(exam, { "q-single": [1], "q-multi": [0, 2], "q-true": [1], "q-false": [0] });
    expect(twoOfFour.ok && twoOfFour.scorePct).toBe(50);
    expect(twoOfFour.ok && twoOfFour.passed).toBe(false);
  });

  it("marks written answers pending and never counts them in the score", () => {
    const exam = examOf([single, text, reflection]);
    const result = gradeExam(exam, { "q-single": [0], "q-text": "a", "q-reflection": "b" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.detail).toEqual({ "q-single": false, "q-text": "pending", "q-reflection": "pending" });
      expect(result.mcTotal).toBe(1);
      expect(result.scorePct).toBe(0);
      expect(result.textReviews.map((row) => [row.questionId, row.reflection])).toEqual([
        ["q-text", false],
        ["q-reflection", true],
      ]);
    }
  });

  it("trims and caps written answers at 2000 characters", () => {
    const long = `  ${"x".repeat(2500)}  `;
    const result = gradeExam(examOf([text]), { "q-text": long });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.textReviews[0].answer).toBe("x".repeat(2000));
    }
  });

  it("records the question text in the requested language with a Portuguese fallback", () => {
    const exam = examOf([text, reflection]);
    const answers = { "q-text": "a", "q-reflection": "b" };

    const es = gradeExam(exam, answers, "es");
    expect(es.ok && es.textReviews.map((row) => row.questionText)).toEqual(["Escriba", "Reflita"]);

    const en = gradeExam(exam, answers, "en");
    expect(en.ok && en.textReviews.map((row) => row.questionText)).toEqual(["Escreva", "Reflita"]);

    const defaultLanguage = gradeExam(exam, answers);
    expect(defaultLanguage.ok && defaultLanguage.textReviews.map((row) => row.questionText)).toEqual([
      "Escreva",
      "Reflita",
    ]);
  });
});
