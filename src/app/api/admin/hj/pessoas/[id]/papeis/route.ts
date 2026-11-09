import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { sameId, type UserDoc } from "@/lib/hj/data";
import type { PapeisBody } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjEquipe } from "@/models/hj-equipe";

import { adminContext } from "../../../_lib/shared";

// Only an administrator grants or removes the educator and administrator
// roles. Taking the educator role away also unhooks the teams the person
// followed; an administrator cannot demote themself.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }
    const user = (await AcademyUser.findById(id).select("fullName role isAdmin").lean()) as UserDoc | null;
    if (!user) {
      return jsonError("Não encontrado", 404);
    }

    const body = (await request.json().catch(() => ({}))) as Partial<PapeisBody>;
    const educador = body.educador === undefined ? user.role === "tutor" : Boolean(body.educador);
    const administrador = body.administrador === undefined ? user.isAdmin === true : Boolean(body.administrador);

    if (sameId(user._id, context.user._id) && (!educador || !administrador)) {
      return jsonError("Você não pode tirar o seu próprio papel", 400, { code: "SELF_DEMOTE" });
    }
    if (administrador && !educador) {
      return jsonError("Um administrador é sempre educador também", 400, { code: "ADMIN_NEEDS_EDUCATOR" });
    }

    await AcademyUser.updateOne({ _id: user._id }, { $set: { role: educador ? "tutor" : "student", isAdmin: administrador } });
    let equipesLiberadas = 0;
    if (!educador) {
      const updated = await HjEquipe.updateMany({ educadorId: user._id }, { $set: { educadorId: null } });
      equipesLiberadas = updated.modifiedCount;
    }

    return NextResponse.json({
      id,
      papeis: { membro: true, educador, administrador },
      equipesLiberadas,
    });
  } catch (error) {
    return serverError("Erro ao alterar papéis", error, "Não foi possível alterar os papéis");
  }
}
