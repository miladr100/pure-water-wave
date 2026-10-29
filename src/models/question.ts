import { Schema, model, models, type InferSchemaType } from "mongoose";

// A student's question under a lesson, answered by a tutor from the panel.
// Course and lesson labels are snapshotted so the inbox still reads well if
// the lesson is renamed or removed.
const questionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    courseTitle: { type: String, default: "" },
    lessonLabel: { type: String, default: "" },
    lessonNumber: { type: Number, default: 0 },
    text: { type: String, required: true, maxlength: 500 },
    answer: { type: String, default: "" },
    answeredBy: { type: String, default: "" },
    answeredAt: { type: Date, default: null },
    answerSeenAt: { type: Date, default: null },
    status: { type: String, enum: ["open", "answered", "archived"], default: "open" },
  },
  { timestamps: true, collection: "academy_questions" },
);

export type QuestionDocument = InferSchemaType<typeof questionSchema>;

if (models.Question) {
  delete models.Question;
}

export const Question = model("Question", questionSchema, "academy_questions");
