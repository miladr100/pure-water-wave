import { NextResponse } from "next/server";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { courseCard, prerequisiteMet, type CourseDoc } from "@/lib/academy/load";
import type { CourseCard } from "@/lib/academy/types";
import { requireAcademySession } from "@/lib/academy/require-session";
import { AcademyUser } from "@/models/academy-user";
import { Course } from "@/models/course";

export async function GET() {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const user = { id: session.userId, role: session.role };
    const language = session.language;

    const [published, me] = await Promise.all([
      Course.find({ published: true }).sort({ order: 1 }).lean() as Promise<CourseDoc[]>,
      AcademyUser.findById(session.userId).select("showOtherLanguage").lean() as Promise<{
        showOtherLanguage?: boolean;
      } | null>,
    ]);

    // Courses are recorded in one language; the catalogue shows the student
    // their own language's courses unless they asked for the others too
    // (FFPUM F26). Tutors see everything. Enrolled courses are untouched by
    // this (they are listed by /me) and so is the course page itself, so a
    // shared link keeps working.
    const seesEveryLanguage = user.role === "tutor" || Boolean(me?.showOtherLanguage);

    // A gated course does not exist for the student until a prerequisite is
    // done — it is not shown locked, it is simply absent (the FFPUM rule).
    const open: CourseDoc[] = [];
    for (const course of published) {
      if (!seesEveryLanguage && course.language !== language) {
        continue;
      }
      if (await prerequisiteMet(course, user)) {
        open.push(course);
      }
    }

    open.sort((a, b) => {
      const ownA = a.language === language ? 0 : 1;
      const ownB = b.language === language ? 0 : 1;
      return ownA - ownB || (a.order ?? 0) - (b.order ?? 0);
    });

    const courses: CourseCard[] = [];
    for (const course of open) {
      courses.push(await courseCard(course, language, user));
    }

    return NextResponse.json({ courses });
  } catch (error) {
    return serverError("Erro ao listar cursos", error, "Não foi possível carregar os cursos");
  }
}
