import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import { prerequisiteMet, type CourseDoc } from "@/lib/academy/load";
import { requireAcademySession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";
import { Lesson } from "@/models/lesson";

type EnrollBody = {
  courseId?: string;
  courseSlug?: string;
};

const DUPLICATE_KEY = 11000;

export async function POST(request: Request) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const body = ((await request.json().catch(() => null)) ?? {}) as EnrollBody;
    const user = { id: session.userId, role: session.role };

    let course: CourseDoc | null = null;

    if (body.courseId !== undefined) {
      if (!isObjectId(body.courseId)) {
        return jsonError("Curso inválido", 400);
      }

      course = (await Course.findOne({ _id: body.courseId, published: true }).lean()) as CourseDoc | null;
    } else if (typeof body.courseSlug === "string" && body.courseSlug.trim()) {
      course = (await Course.findOne({
        slug: body.courseSlug.trim().toLowerCase(),
        published: true,
      }).lean()) as CourseDoc | null;
    } else {
      return jsonError("Informe o curso", 400);
    }

    if (!course) {
      return jsonError("Curso não disponível", 404, { code: "course_not_available" });
    }

    if (!(await prerequisiteMet(course, user))) {
      return jsonError("Conclua o curso anterior primeiro", 403, { code: "prerequisite_required" });
    }

    const publishedLessons = await Lesson.countDocuments({ courseId: course._id, published: true });
    if (publishedLessons === 0) {
      return jsonError("Este curso ainda não tem aulas", 409, { code: "course_coming_soon" });
    }

    const existing = await Enrollment.findOne({ userId: session.userId, courseId: course._id });

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json({
          enrolled: true,
          alreadyEnrolled: true,
          enrollmentId: existing._id.toString(),
        });
      }

      // A cancelled enrollment keeps its progress rows, so coming back means
      // reactivating rather than starting over.
      existing.status = "active";
      await existing.save();

      return NextResponse.json({ enrolled: true, enrollmentId: existing._id.toString() });
    }

    try {
      const created = await Enrollment.create({ userId: session.userId, courseId: course._id });
      return NextResponse.json({ enrolled: true, enrollmentId: created._id.toString() }, { status: 201 });
    } catch (error) {
      // Two clicks in a row race on the unique (user, course) index; the
      // second one simply learns it is already enrolled.
      if ((error as { code?: number }).code !== DUPLICATE_KEY) {
        throw error;
      }

      const raced = await Enrollment.findOne({ userId: session.userId, courseId: course._id });
      if (!raced) {
        throw error;
      }

      return NextResponse.json({
        enrolled: true,
        alreadyEnrolled: true,
        enrollmentId: raced._id.toString(),
      });
    }
  } catch (error) {
    return serverError("Erro ao inscrever no curso", error, "Não foi possível fazer a inscrição");
  }
}
