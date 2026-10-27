import { Schema, model, models, type InferSchemaType } from "mongoose";

import { USER_LANGUAGES } from "@/lib/user-languages";
import { ACADEMY_ROLES } from "@/lib/academy/roles";
import { THEME_PREFERENCES } from "@/lib/theme";

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
    birthday: { type: Date, default: null },
    language: { type: String, enum: USER_LANGUAGES, default: "pt" },
    // Light / dark / follow the device, adopted by the browser at sign-in and
    // whenever the student changes it in the profile (FFPUM F10).
    theme: { type: String, enum: THEME_PREFERENCES, default: "system" },
    // Courses are recorded in one language; a student sees the catalogue of
    // their own language unless they ask for the others too (FFPUM F26).
    showOtherLanguage: { type: Boolean, default: false },
    // The profile photo lives in the document itself (a 512 px JPEG is a few
    // dozen KB) so the academy needs no file storage account.
    photo: {
      type: new Schema({ data: Buffer, contentType: String }, { _id: false }),
      select: false,
      default: undefined,
    },
    photoUpdatedAt: { type: Date, default: null },
    role: {
      type: String,
      enum: ACADEMY_ROLES,
      default: "student",
      required: true,
    },
    // Tutor-side follow-up: any note the tutor left about this student.
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
