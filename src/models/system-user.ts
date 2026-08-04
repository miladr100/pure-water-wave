import { Schema, model, models, type InferSchemaType } from "mongoose";

import { USER_LANGUAGES } from "@/lib/user-languages";
import { SYSTEM_USER_ROLES } from "@/lib/user-roles";

const systemUserSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    churchName: { type: String },
    country: { type: String },
    language: { type: String, enum: USER_LANGUAGES },
    login: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: SYSTEM_USER_ROLES,
      default: "pastor",
      required: true,
    },
  },
  { timestamps: true },
);

export type SystemUserDocument = InferSchemaType<typeof systemUserSchema>;

if (models.SystemUser) {
  delete models.SystemUser;
}

export const SystemUser = model("SystemUser", systemUserSchema);
