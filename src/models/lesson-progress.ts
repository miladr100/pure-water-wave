import { Schema, model, models, type InferSchemaType } from "mongoose";

const lessonProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
    // Current position, for "continue where you left off".
    percent: { type: Number, default: 0, min: 0, max: 100 },
    // High-water mark, never decreases: it is the forward-seek ceiling.
    maxPercent: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "academy_lesson_progress" },
);

lessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ userId: 1, updatedAt: -1 });

export type LessonProgressDocument = InferSchemaType<typeof lessonProgressSchema>;

if (models.LessonProgress) {
  delete models.LessonProgress;
}

export const LessonProgress = model(
  "LessonProgress",
  lessonProgressSchema,
  "academy_lesson_progress",
);
