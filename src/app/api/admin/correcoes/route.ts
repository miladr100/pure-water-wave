import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import type { CourseDoc } from "@/lib/academy/load";
import type { AdminGradingRow } from "@/lib/academy/types";
import { pick } from "@/lib/academy/localized";
import { requireTutorSession } from "@/lib/academy/require-session";
import { AcademyUser } from "@/models/academy-user";
import { Course } from "@/models/course";
import { Exam } from "@/models/exam";
import { ExamAttempt } from "@/models/exam-attempt";

import { examLabel } from "../_lib/serialize";

type AttemptDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  examId: Types.ObjectId;
  createdAt: Date;
  textReviews: {
    questionId: string;
    questionText: string;
    reflection: boolean;
    answer: string;
    reviewed: boolean;
    feedback: string;
    gradedBy: string;
    gradedAt: Date | null;
  }[];
};

export async function GET() {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const attempts = (await ExamAttempt.find({ textReviews: { $elemMatch: { reviewed: false } } })
      .sort({ createdAt: -1 })
      .limit(200)
      .select("userId courseId examId createdAt textReviews")
      .lean()) as AttemptDoc[];

    const unique = <T>(values: T[]) => [...new Set(values)];
    const [users, courses, exams] = await Promise.all([
      AcademyUser.find({ _id: { $in: unique(attempts.map((a) => a.userId.toString())) } })
        .select("fullName")
        .lean() as Promise<{ _id: Types.ObjectId; fullName: string }[]>,
      Course.find({ _id: { $in: unique(attempts.map((a) => a.courseId.toString())) } })
        .select("title modules")
        .lean() as Promise<Pick<CourseDoc, "_id" | "title" | "modules">[]>,
      Exam.find({ _id: { $in: unique(attempts.map((a) => a.examId.toString())) } })
        .select("scope moduleId")
        .lean() as Promise<{ _id: Types.ObjectId; scope: "module" | "final"; moduleId: Types.ObjectId | null }[]>,
    ]);

    const userById = new Map(users.map((user) => [user._id.toString(), user]));
    const courseById = new Map(courses.map((course) => [course._id.toString(), course]));
    const examById = new Map(exams.map((exam) => [exam._id.toString(), exam]));

    const rows: AdminGradingRow[] = attempts.map((attempt) => {
      const course = courseById.get(attempt.courseId.toString()) ?? null;
      const exam = examById.get(attempt.examId.toString());

      return {
        attemptId: attempt._id.toString(),
        studentId: attempt.userId.toString(),
        studentName: userById.get(attempt.userId.toString())?.fullName ?? "",
        courseTitle: course ? pick(course.title, "pt") : "",
        examLabel: exam ? examLabel(exam, course) : "",
        submittedAt: attempt.createdAt.toISOString(),
        reviews: attempt.textReviews.map((review) => ({
          questionId: review.questionId,
          questionText: review.questionText ?? "",
          reflection: Boolean(review.reflection),
          answer: review.answer ?? "",
          reviewed: Boolean(review.reviewed),
          feedback: review.feedback ?? "",
          gradedBy: review.gradedBy ?? "",
          gradedAt: review.gradedAt ? review.gradedAt.toISOString() : null,
        })),
      };
    });

    return NextResponse.json({ rows });
  } catch (error) {
    return serverError("Erro ao listar correções", error, "Não foi possível carregar as correções");
  }
}
