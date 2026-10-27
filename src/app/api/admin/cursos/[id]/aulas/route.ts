import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import type { CourseDoc, LessonDoc } from "@/lib/academy/load";
import { normalizeLocalized } from "@/lib/academy/localized";
import { requireTutorSession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";
import { Lesson } from "@/models/lesson";

import { adminLesson } from "../../../_lib/serialize";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const { id } = await params;
    const course = isObjectId(id) ? ((await Course.findById(id).lean()) as CourseDoc | null) : null;
    if (!course) {
      return jsonError("Curso não encontrado", 404);
    }

    const body = (await request.json().catch(() => ({}))) as { moduleId?: unknown; title?: unknown };
    const moduleId = typeof body.moduleId === "string" ? body.moduleId : "";
    if (!course.modules.some((mod) => mod._id.toString() === moduleId)) {
      return jsonError("Módulo não encontrado", 400, { code: "module_not_found" });
    }

    const title = normalizeLocalized(body.title);
    if (!title.pt) {
      return jsonError("Informe o título em português", 400);
    }

    const last = (await Lesson.findOne({ courseId: course._id })
      .sort({ number: -1 })
      .select("number")
      .lean()) as { number: number } | null;

    const created = await Lesson.create({
      courseId: course._id,
      moduleId,
      number: (last?.number ?? 0) + 1,
      title,
    });

    const lesson = (await Lesson.findById(created._id).lean()) as LessonDoc;
    return NextResponse.json({ lesson: adminLesson(lesson, false) }, { status: 201 });
  } catch (error) {
    return serverError("Erro ao criar aula", error, "Não foi possível criar a aula");
  }
}
