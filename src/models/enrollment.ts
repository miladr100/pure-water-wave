import { Schema, model, models, type InferSchemaType } from "mongoose";

const enrollmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
    // Stamped once, the first time the course is found complete. Permanent:
    // a later edit to the course never takes a completion away.
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "academy_enrollments" },
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export type EnrollmentDocument = InferSchemaType<typeof enrollmentSchema>;

if (models.Enrollment) {
  delete models.Enrollment;
}

export const Enrollment = model("Enrollment", enrollmentSchema, "academy_enrollments");
