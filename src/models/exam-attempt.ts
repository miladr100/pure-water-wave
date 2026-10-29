import { Schema, model, models, type InferSchemaType } from "mongoose";

const textReviewSchema = new Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, default: "" },
    reflection: { type: Boolean, default: false },
    answer: { type: String, default: "" },
    reviewed: { type: Boolean, default: false },
    feedback: { type: String, default: "" },
    gradedBy: { type: String, default: "" },
    gradedAt: { type: Date, default: null },
    feedbackSeenAt: { type: Date, default: null },
  },
  { _id: false },
);

// One row per submission. `examSnapshot` freezes the activity as it was at
// submit time, so results still render correctly after a tutor edits or
// reorders the questions (the lesson FFPUM learned the hard way).
const examAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    scorePct: { type: Number, required: true },
    mcCorrect: { type: Number, required: true },
    mcTotal: { type: Number, required: true },
    passed: { type: Boolean, default: false },
    answers: { type: Schema.Types.Mixed, default: () => ({}) },
    detail: { type: Schema.Types.Mixed, default: () => ({}) },
    examSnapshot: { type: Schema.Types.Mixed, default: null },
    textReviews: { type: [textReviewSchema], default: [] },
  },
  { timestamps: true, collection: "academy_exam_attempts" },
);

examAttemptSchema.index({ userId: 1, examId: 1, createdAt: -1 });

export type ExamAttemptDocument = InferSchemaType<typeof examAttemptSchema>;

if (models.ExamAttempt) {
  delete models.ExamAttempt;
}

export const ExamAttempt = model("ExamAttempt", examAttemptSchema, "academy_exam_attempts");
