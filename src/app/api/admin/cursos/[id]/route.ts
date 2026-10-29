import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import type { CourseDoc } from "@/lib/academy/load";
import { normalizeLocalized } from "@/lib/academy/localized";
import { requireTutorSession } from "@/lib/academy/require-session";
import { isUserLanguage } from "@/lib/user-languages";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";
import { Exam } from "@/models/exam";
import { Lesson } from "@/models/lesson";

import { adminCourseStructure } from "../../_lib/serialize";

type Params = { params: Promise<{ id: string }> };

type PatchBody = {
  title?: unknown;
  description?: unknown;
  coverUrl?: unknown;
  speaker?: unknown;
  language?: unknown;
  published?: unknown;
  starter?: unknown;
  order?: unknown;
  prerequisites?: unknown;
  modules?: unknown;
};

type ModuleInput = { id?: unknown; number?: unknown; title?: unknown };

async function loadCourse(id: string) {
  return isObjectId(id) ? ((await Course.findById(id).lean()) as CourseDoc | null) : null;
}

// Walks up the prerequisite graph from each candidate; reaching the course
// itself would make it unreachable for every student.
async function createsCycle(courseId: string, prerequisiteIds: string[]) {
  const seen = new Set<string>();
  const queue = [...prerequisiteIds];

  while (queue.length) {
    const current = queue.shift()!;
    if (current === courseId) {
      return true;
    }
    if (seen.has(current)) {
      continue;
    }
    seen.add(current);

    const course = (await Course.findById(current).select("prerequisites").lean()) as Pick<
      CourseDoc,
      "prerequisites"
    > | null;
    for (const next of course?.prerequisites ?? []) {
      queue.push(next.toString());
    }
  }

  return false;
}

export async function GET(_request: Request, { params }: Params) {
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
    const course = await loadCourse(id);
    if (!course) {
      return jsonError("Curso não encontrado", 404);
    }

    return NextResponse.json(await adminCourseStructure(course));
  } catch (error) {
    return serverError("Erro ao carregar curso", error, "Não foi possível carregar o curso");
  }
}

export async function PATCH(request: Request, { params }: Params) {
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
    const course = await loadCourse(id);
    if (!course) {
      return jsonError("Curso não encontrado", 404);
    }

    const body = (await request.json().catch(() => ({}))) as PatchBody;
    const update: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = normalizeLocalized(body.title);
      if (!title.pt) {
        return jsonError("Informe o título em português", 400);
      }
      update.title = title;
    }

    if (body.description !== undefined) {
      update.description = normalizeLocalized(body.description);
    }

    if (typeof body.coverUrl === "string") {
      update.coverUrl = body.coverUrl.trim();
    }

    if (typeof body.speaker === "string") {
      update.speaker = body.speaker.trim();
    }

    if (body.language !== undefined) {
      if (!isUserLanguage(body.language)) {
        return jsonError("Idioma inválido", 400);
      }
      update.language = body.language;
    }

    if (body.order !== undefined) {
      const order = Number(body.order);
      if (!Number.isFinite(order)) {
        return jsonError("Ordem inválida", 400);
      }
      update.order = Math.round(order);
    }

    const starter = typeof body.starter === "boolean" ? body.starter : Boolean(course.starter);
    if (typeof body.starter === "boolean") {
      update.starter = body.starter;
    }

    if (body.prerequisites !== undefined) {
      if (!Array.isArray(body.prerequisites) || !body.prerequisites.every(isObjectId)) {
        return jsonError("Pré-requisitos inválidos", 400);
      }
      const prerequisites = [...new Set(body.prerequisites as string[])];

      if (prerequisites.includes(id)) {
        return jsonError("Um curso não pode ser pré-requisito de si mesmo", 400, {
          code: "self_prerequisite",
        });
      }

      const found = await Course.countDocuments({ _id: { $in: prerequisites } });
      if (found !== prerequisites.length) {
        return jsonError("Pré-requisito não encontrado", 400, { code: "prerequisite_not_found" });
      }

      if (await createsCycle(id, prerequisites)) {
        return jsonError("Esses pré-requisitos formam um ciclo", 400, {
          code: "prerequisite_cycle",
        });
      }

      update.prerequisites = prerequisites.map((item) => new Types.ObjectId(item));
    }

    const prerequisiteCount = Array.isArray(update.prerequisites)
      ? update.prerequisites.length
      : course.prerequisites.length;
    if (starter && prerequisiteCount > 0) {
      return jsonError("Um curso inicial não pode ter pré-requisitos", 400, {
        code: "starter_has_prerequisites",
      });
    }

    if (typeof body.published === "boolean") {
      if (body.published && !(await Lesson.exists({ courseId: course._id, published: true }))) {
        return jsonError("Publique pelo menos uma aula antes de publicar o curso", 409, {
          code: "no_published_lessons",
        });
      }
      update.published = body.published;
    }

    if (body.modules !== undefined) {
      if (!Array.isArray(body.modules) || body.modules.length === 0) {
        return jsonError("Módulos inválidos", 400);
      }

      const existing = new Map(course.modules.map((mod) => [mod._id.toString(), mod]));
      const keptIds = new Set<string>();
      const modules: { _id: Types.ObjectId; number: number; title: unknown }[] = [];

      for (const raw of body.modules as ModuleInput[]) {
        const number = Number(raw?.number);
        const title = normalizeLocalized(raw?.title);
        if (!Number.isInteger(number) || number < 1 || !title.pt) {
          return jsonError("Módulos inválidos", 400);
        }

        const known = typeof raw.id === "string" && existing.has(raw.id) ? raw.id : null;
        if (known) {
          keptIds.add(known);
        }
        modules.push({ _id: known ? new Types.ObjectId(known) : new Types.ObjectId(), number, title });
      }

      const removed = course.modules.filter((mod) => !keptIds.has(mod._id.toString()));
      if (removed.length) {
        const stillUsed = await Lesson.exists({
          courseId: course._id,
          moduleId: { $in: removed.map((mod) => mod._id) },
        });
        if (stillUsed) {
          return jsonError("Mova ou exclua as aulas do módulo antes de removê-lo", 409, {
            code: "module_has_lessons",
          });
        }
        // Activities of a removed module would otherwise dangle forever.
        await Exam.deleteMany({
          courseId: course._id,
          scope: "module",
          moduleId: { $in: removed.map((mod) => mod._id) },
        });
      }

      update.modules = modules.sort((a, b) => a.number - b.number);
    }

    const language = isUserLanguage(update.language) ? update.language : course.language;
    if (update.starter === true) {
      // Each language points newcomers at a single course.
      await Course.updateMany(
        { _id: { $ne: course._id }, language, starter: true },
        { $set: { starter: false } },
      );
    }

    const saved = (await Course.findByIdAndUpdate(course._id, { $set: update }, { new: true })
      .lean()) as CourseDoc | null;
    if (!saved) {
      return jsonError("Curso não encontrado", 404);
    }

    return NextResponse.json(await adminCourseStructure(saved));
  } catch (error) {
    return serverError("Erro ao atualizar curso", error, "Não foi possível atualizar o curso");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
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
    const course = await loadCourse(id);
    if (!course) {
      return jsonError("Curso não encontrado", 404);
    }

    if (await Enrollment.exists({ courseId: course._id })) {
      return jsonError("Há alunos inscritos neste curso. Despublique em vez de excluir.", 409, {
        code: "has_enrollments",
      });
    }

    await Promise.all([
      Lesson.deleteMany({ courseId: course._id }),
      Exam.deleteMany({ courseId: course._id }),
      Course.updateMany({ prerequisites: course._id }, { $pull: { prerequisites: course._id } }),
    ]);
    await Course.deleteOne({ _id: course._id });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("Erro ao excluir curso", error, "Não foi possível excluir o curso");
  }
}
