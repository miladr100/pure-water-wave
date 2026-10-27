import { Schema, model, models, type InferSchemaType } from "mongoose";

import { USER_LANGUAGES } from "@/lib/user-languages";
import { ACADEMY_ROLES } from "@/lib/academy/roles";

// The academy's own account, separate from the library's `SystemUser`
// (pastors). Collections are prefixed `academy_` so the academy can live in
// the same database as purewaterwave.org without touching its data.
const academyUserSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    login: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String },
    country: { type: String },
    city: { type: String },
    birthYear: { type: Number },
    language: { type: String, enum: USER_LANGUAGES, default: "pt" },
    role: {
      type: String,
      enum: ACADEMY_ROLES,
      default: "student",
      required: true,
    },
    // Tutor-side follow-up (the FFPUM "primer contacto" column): when a tutor
    // first reached out to this student and any note they left.
    firstContactAt: { type: Date, default: null },
    tutorNotes: { type: String, default: "" },
    assignedTutorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", default: null },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "academy_users" },
);

export type AcademyUserDocument = InferSchemaType<typeof academyUserSchema>;

if (models.AcademyUser) {
  delete models.AcademyUser;
}

export const AcademyUser = model("AcademyUser", academyUserSchema, "academy_users");
