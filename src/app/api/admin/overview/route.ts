import { NextResponse } from "next/server";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import type { AdminOverview } from "@/lib/academy/types";
import { requireTutorSession } from "@/lib/academy/require-session";
import { AcademyUser } from "@/models/academy-user";
import { Course } from "@/models/course";
import { ExamAttempt } from "@/models/exam-attempt";
import { Question } from "@/models/question";

import { questionRows, studentRows, USER_ROW_FIELDS, type QuestionDoc, type UserDoc } from "../_lib/serialize";

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

    const [
      students,
      tutors,
      publishedCourses,
      openQuestions,
      pendingGrading,
      recentStudentDocs,
      recentQuestionDocs,
    ] = await Promise.all([
      AcademyUser.countDocuments({ role: "student" }),
      AcademyUser.countDocuments({ role: "tutor" }),
      Course.countDocuments({ published: true }),
      Question.countDocuments({ status: "open" }),
      // Reflections are optional and never block anyone, so only real written
      // answers count as work waiting.
      ExamAttempt.countDocuments({
        textReviews: { $elemMatch: { reviewed: false, reflection: false } },
      }),
      AcademyUser.find({ role: "student" })
        .sort({ createdAt: -1 })
        .limit(8)
        .select(USER_ROW_FIELDS)
        .lean() as Promise<UserDoc[]>,
      Question.find({ status: "open" }).sort({ createdAt: -1 }).limit(8).lean() as Promise<
        QuestionDoc[]
      >,
    ]);

    const body: AdminOverview = {
      students,
      tutors,
      publishedCourses,
      openQuestions,
      pendingGrading,
      recentStudents: await studentRows(recentStudentDocs),
      recentQuestions: await questionRows(recentQuestionDocs),
    };

    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro na visão geral", error, "Não foi possível carregar a visão geral");
  }
}
