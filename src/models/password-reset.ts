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
  },
  { timestamps: true },
);

export type PasswordResetDocument = InferSchemaType<typeof passwordResetSchema>;

if (models.PasswordReset) {
  delete models.PasswordReset;
}

export const PasswordReset = model("PasswordReset", passwordResetSchema);
