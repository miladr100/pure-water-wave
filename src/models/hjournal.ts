import { Schema, model, models, type InferSchemaType } from "mongoose";

const hjournalSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    hoonDokWords: { type: String, default: "" },
    aha: { type: String, default: "" },
    goal: { type: String, default: "" },
    actionPlan: { type: String, default: "" },
    analysis: { type: String, default: "" },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: true, collection: "hjournal" },
);

hjournalSchema.index({ userId: 1, date: 1 }, { unique: true });
hjournalSchema.index({ userId: 1, dayNumber: 1 }, { unique: true });

export type HJournalDocument = InferSchemaType<typeof hjournalSchema>;

if (models.HJournal) {
  delete models.HJournal;
}

export const HJournal = model("HJournal", hjournalSchema, "hjournal");
