import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import type { CourseDoc } from "@/lib/academy/load";
import { requireTutorSession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";
import { Exam } from "@/models/exam";

import { adminExam, type ExamFullDoc } from "../../../_lib/serialize";

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

    const body = (await request.json().catch(() => ({}))) as { scope?: unknown; moduleId?: unknown };
    const scope = body.scope === "final" ? "final" : body.scope === "module" ? "module" : null;
    if (!scope) {
      return jsonError("Tipo de atividade inválido", 400);
    }

    let moduleId: string | null = null;
    if (scope === "module") {
      moduleId = typeof body.moduleId === "string" ? body.moduleId : "";
      if (!course.modules.some((mod) => mod._id.toString() === moduleId)) {
        return jsonError("Módulo não encontrado", 400, { code: "module_not_found" });
      }
    }

    // One activity per module and one final per course: gating assumes it.
    const duplicate = await Exam.exists(
      scope === "final" ? { courseId: course._id, scope } : { courseId: course._id, scope, moduleId },
    );
    if (duplicate) {
      return jsonError("Já existe uma atividade aqui", 409, { code: "exam_exists" });
    }

    const created = await Exam.create({ courseId: course._id, scope, moduleId, questions: [] });
    const exam = (await Exam.findById(created._id).lean()) as ExamFullDoc;

    return NextResponse.json({ exam: adminExam(exam, 0) }, { status: 201 });
  } catch (error) {
    return serverError("Erro ao criar atividade", error, "Não foi possível criar a atividade");
  }
}
