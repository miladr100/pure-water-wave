import { NextResponse } from "next/server";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { courseDetail, prerequisiteMet, type CourseDoc } from "@/lib/academy/load";
import type { CourseLocked } from "@/lib/academy/types";
import { pick } from "@/lib/academy/localized";
import { requireAcademySession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const { slug } = await params;
    const user = { id: session.userId, role: session.role };
    const language = session.language;
    const tutorView = session.role === "tutor";

    const course = (await Course.findOne({ slug: slug.trim().toLowerCase() }).lean()) as CourseDoc | null;

    if (!course || (!course.published && !tutorView)) {
      return jsonError("Curso não disponível", 404, { code: "course_not_available" });
    }

    if (!(await prerequisiteMet(course, user))) {
      // The locked screen names only the prerequisites the student can
      // actually go and do; a prerequisite that is itself gated stays hidden.
      const candidates = (await Course.find({
        _id: { $in: course.prerequisites },
        published: true,
      }).lean()) as CourseDoc[];

      const prerequisites: CourseLocked["prerequisites"] = [];
      for (const candidate of candidates) {
        if (await prerequisiteMet(candidate, user)) {
          prerequisites.push({ slug: candidate.slug, title: pick(candidate.title, language) });
        }
      }

      const locked: CourseLocked = {
        error: "course_locked",
        course: {
          slug: course.slug,
          title: pick(course.title, language),
          coverUrl: course.coverUrl ?? "",
        },
        prerequisites,
      };

      return NextResponse.json(locked, { status: 403 });
    }

    return NextResponse.json({ course: await courseDetail(course, language, user) });
  } catch (error) {
    return serverError("Erro ao carregar curso", error, "Não foi possível carregar o curso");
  }
}
