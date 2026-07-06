import { Schema, model, models, type InferSchemaType } from "mongoose";

import { USER_LANGUAGES } from "@/lib/user-languages";
import { USER_ROLES } from "@/lib/user-roles";

export type { UserRole } from "@/lib/user-roles";
export { USER_ROLES } from "@/lib/user-roles";
export type { UserLanguage } from "@/lib/user-languages";
export { USER_LANGUAGES } from "@/lib/user-languages";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    churchName: { type: String },
    country: { type: String },
    language: { type: String, enum: USER_LANGUAGES },
    login: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "doador",
      required: true,
    },
    remarketingEmailSentAt: { type: Date },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

if (models.User) {
  delete models.User;
}

export const User = model("User", userSchema);
