import { Schema, model, models, type InferSchemaType } from "mongoose";

const hdhReflectionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    dayId: {
      type: Number,
      required: true,
      min: 1,
    },
    answers: {
      type: [String],
      default: [],
    },
    inspiration: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, collection: "hdhreflection" },
);

hdhReflectionSchema.index({ userId: 1, dayId: 1 }, { unique: true });

export type HdhReflectionDocument = InferSchemaType<typeof hdhReflectionSchema>;

if (models.HdhReflection) {
  delete models.HdhReflection;
}

export const HdhReflection = model(
  "HdhReflection",
  hdhReflectionSchema,
  "hdhreflection",
);
