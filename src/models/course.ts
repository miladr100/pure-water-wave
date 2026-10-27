import { Schema, model, models, type InferSchemaType } from "mongoose";

import { USER_LANGUAGES } from "@/lib/user-languages";

const localizedSchema = new Schema(
  {
    pt: { type: String, default: "" },
    en: { type: String, default: "" },
    es: { type: String, default: "" },
  },
  { _id: false },
);

// Modules live inside the course: they are only a way of grouping lessons
// and of placing a review activity, and are never addressed on their own.
const moduleSchema = new Schema({
  number: { type: Number, required: true },
  title: { type: localizedSchema, required: true },
});

const courseSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: localizedSchema, required: true },
    description: { type: localizedSchema, default: () => ({}) },
    coverUrl: { type: String, default: "" },
    speaker: { type: String, default: "" },
    // Language the videos are recorded in; the UI copy follows the account.
    language: { type: String, enum: USER_LANGUAGES, default: "pt" },
    published: { type: Boolean, default: false },
    starter: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    // The student must have completed ANY ONE of these before the course
    // exists for them (the FFPUM gate). Empty means open to everyone.
    prerequisites: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    modules: { type: [moduleSchema], default: [] },
  },
  { timestamps: true, collection: "academy_courses" },
);

export type CourseDocument = InferSchemaType<typeof courseSchema>;

if (models.Course) {
  delete models.Course;
}

export const Course = model("Course", courseSchema, "academy_courses");
export { localizedSchema };
