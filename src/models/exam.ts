import { Schema, model, models, type InferSchemaType } from "mongoose";

import { localizedSchema } from "@/models/course";

export const QUESTION_TYPES = ["single", "multi", "truefalse", "text", "reflection"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const EXAM_SCOPES = ["module", "final"] as const;
export type ExamScope = (typeof EXAM_SCOPES)[number];

export const DEFAULT_PASS_THRESHOLD = 70;

const optionSchema = new Schema({
  text: { type: localizedSchema, required: true },
  correct: { type: Boolean, default: false },
});

// Question ids are the answer key: the student's answers are stored against
// them, and the attempt snapshot freezes the question text they belonged to.
const questionSchema = new Schema({
  qtype: { type: String, enum: QUESTION_TYPES, required: true },
  text: { type: localizedSchema, required: true },
  // truefalse only
  statementIsTrue: { type: Boolean, default: false },
  // Shown after grading, right or wrong (truefalse with a false statement).
  explanation: { type: localizedSchema, default: () => ({}) },
  // single and multi
  options: { type: [optionSchema], default: [] },
});

// "Atividade de revisão": the review activity of a module or of the course.
// The document holds the correct answers, so it is never sent to a student
// as is — students get the sanitized copy from `lib/academy/serialize.ts`.
const examSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    scope: { type: String, enum: EXAM_SCOPES, default: "module" },
    moduleId: { type: Schema.Types.ObjectId, default: null },
    passThreshold: { type: Number, default: DEFAULT_PASS_THRESHOLD, min: 0, max: 100 },
    // A module activity that is required locks the next module until passed.
    requiredToAdvance: { type: Boolean, default: true },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true, collection: "academy_exams" },
);

export type ExamDocument = InferSchemaType<typeof examSchema>;

if (models.Exam) {
  delete models.Exam;
}

export const Exam = model("Exam", examSchema, "academy_exams");
