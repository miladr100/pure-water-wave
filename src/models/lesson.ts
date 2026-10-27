import { Schema, model, models, type InferSchemaType } from "mongoose";

import { localizedSchema } from "@/models/course";

export const VIDEO_PROVIDERS = ["youtube", "bunny"] as const;
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];

// A lesson is one video. The movement's existing material is on YouTube
// (the library's support videos), so that is the default provider; Bunny
// Stream is the private, token-signed option the FFPUM academy uses.
const videoSchema = new Schema(
  {
    provider: { type: String, enum: VIDEO_PROVIDERS, default: "youtube" },
    youtubeId: { type: String, default: "" },
    bunnyVideoId: { type: String, default: "" },
  },
  { _id: false },
);

const materialSchema = new Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const lessonSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, required: true },
    // Position across the whole course (1..N), not within the module.
    number: { type: Number, required: true },
    title: { type: localizedSchema, required: true },
    description: { type: localizedSchema, default: () => ({}) },
    durationMinutes: { type: Number, default: 0 },
    video: { type: videoSchema, default: () => ({}) },
    materials: { type: [materialSchema], default: [] },
    published: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "academy_lessons" },
);

lessonSchema.index({ courseId: 1, number: 1 });

export type LessonDocument = InferSchemaType<typeof lessonSchema>;

if (models.Lesson) {
  delete models.Lesson;
}

export const Lesson = model("Lesson", lessonSchema, "academy_lessons");
