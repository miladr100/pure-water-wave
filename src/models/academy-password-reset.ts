import { Schema, model, models, type InferSchemaType } from "mongoose";

const passwordResetSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    attempts: { type: Number, default: 0, required: true },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "academy_password_resets" },
);

export type PasswordResetDocument = InferSchemaType<typeof passwordResetSchema>;

if (models.AcademyPasswordReset) {
  delete models.AcademyPasswordReset;
}

export const AcademyPasswordReset = model("AcademyPasswordReset", passwordResetSchema, "academy_password_resets");
