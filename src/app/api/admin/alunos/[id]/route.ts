import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";
import { isAcademyRole } from "@/lib/academy/roles";
import { AcademyUser } from "@/models/academy-user";

import { studentDetail, USER_ROW_FIELDS, type UserDoc } from "../../_lib/serialize";

type Params = { params: Promise<{ id: string }> };

type PatchBody = {
  tutorNotes?: string;
  assignedTutorId?: string | null;
  role?: string;
};

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
    if (!isObjectId(id)) {
      return jsonError("Aluno não encontrado", 404);
    }

    const user = (await AcademyUser.findById(id).select(USER_ROW_FIELDS).lean()) as UserDoc | null;
    if (!user) {
      return jsonError("Aluno não encontrado", 404);
    }

    return NextResponse.json({ student: await studentDetail(user) });
  } catch (error) {
    return serverError("Erro ao carregar aluno", error, "Não foi possível carregar o aluno");
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
    if (!isObjectId(id)) {
      return jsonError("Aluno não encontrado", 404);
    }

    const body = (await request.json().catch(() => ({}))) as PatchBody;
    const update: Record<string, unknown> = {};

    if (typeof body.tutorNotes === "string") {
      update.tutorNotes = body.tutorNotes.trim().slice(0, 5000);
    }

    if (body.assignedTutorId !== undefined) {
      if (body.assignedTutorId === null || body.assignedTutorId === "") {
        update.assignedTutorId = null;
      } else {
        const tutor = isObjectId(body.assignedTutorId)
          ? await AcademyUser.exists({ _id: body.assignedTutorId, role: "tutor" })
          : null;
        if (!tutor) {
          return jsonError("Tutor não encontrado", 400, { code: "tutor_not_found" });
        }
        update.assignedTutorId = body.assignedTutorId;
      }
    }

    if (body.role !== undefined) {
      if (!isAcademyRole(body.role)) {
        return jsonError("Papel inválido", 400);
      }
      // Locking yourself out of the panel is never what was meant.
      if (id === session.userId && body.role !== "tutor") {
        return jsonError("Você não pode alterar o seu próprio papel", 400, {
          code: "cannot_change_own_role",
        });
      }
      update.role = body.role;
    }

    const user = (await AcademyUser.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select(USER_ROW_FIELDS)
      .lean()) as UserDoc | null;
    if (!user) {
      return jsonError("Aluno não encontrado", 404);
    }

    return NextResponse.json({ student: await studentDetail(user) });
  } catch (error) {
    return serverError("Erro ao atualizar aluno", error, "Não foi possível atualizar o aluno");
  }
}
