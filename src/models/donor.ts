import { Schema, model, models, type InferSchemaType } from "mongoose";

const donorSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    remarketingEmailSentAt: { type: Date },
  },
  { timestamps: true },
);

export type DonorDocument = InferSchemaType<typeof donorSchema>;

if (models.Donor) {
  delete models.Donor;
}

export const Donor = model("Donor", donorSchema);
