import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { isObjectId, jsonError } from "@/lib/academy/http";
import { ref, reportsOf, usersById, type EquipeDoc, type ProjetoDoc, type UserDoc } from "@/lib/hj/data";
import { HJ_PROGRAMAS, type EquipeAdmin, type EquipeBody } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjEquipe } from "@/models/hj-equipe";

import { textField } from "./shared";

export async function equipesAdmin(projeto: ProjetoDoc): Promise<EquipeAdmin[]> {
  const equipes = (await HjEquipe.find({ projetoId: projeto._id }).sort({ nome: 1 }).lean()) as EquipeDoc[];
  const relatorios = await reportsOf(projeto._id, { estado: { $ne: "devolvido" } });
  const users = await usersById(
    equipes.flatMap((equipe) =>
      [...equipe.membroIds, equipe.educadorId, equipe.capitaoId].filter((id): id is Types.ObjectId => id != null),
    ),
  );
  return equipes.map((equipe) => {
    const membros = new Set(equipe.membroIds.map(String));
    return {
      id: equipe._id.toString(),
      nome: equipe.nome,
      programa: equipe.programa,
      projeto: { id: projeto._id.toString(), nome: projeto.nome },
      educador: ref(equipe.educadorId ? users.get(String(equipe.educadorId)) : null),
      capitao: ref(equipe.capitaoId ? users.get(String(equipe.capitaoId)) : null),
      membros: equipe.membroIds.map((id) => ({ id: String(id), nome: users.get(String(id))?.fullName ?? "—" })),
      liquidoCents: relatorios
        .filter((item) => membros.has(String(item.membroId)))
        .reduce((sum, item) => sum + item.liquidoCents, 0),
    };
  });
}

// Team membership rules shared by POST and PATCH: real accounts, a member
// in one team per project at most, captain among the members, educator an
// educator.
export async function validateTeam(
  body: Partial<EquipeBody>,
  projeto: ProjetoDoc,
  current: EquipeDoc | null,
): Promise<{ ok: true; value: Omit<EquipeDoc, "_id"> } | { ok: false; response: NextResponse }> {
  const nome = body.nome === undefined ? (current?.nome ?? "") : textField(body.nome, 60);
  if (nome.length < 2) {
    return { ok: false, response: jsonError("Nome da equipe obrigatório", 400, { code: "NAME_REQUIRED" }) };
  }
  const programa = body.programa ?? current?.programa;
  if (!programa || !HJ_PROGRAMAS.includes(programa)) {
    return { ok: false, response: jsonError("Programa inválido", 400, { code: "INVALID_PROGRAM" }) };
  }

  const membroIds = body.membroIds === undefined ? (current?.membroIds.map(String) ?? []) : body.membroIds;
  if (!Array.isArray(membroIds) || membroIds.some((id) => !isObjectId(id))) {
    return { ok: false, response: jsonError("Membros inválidos", 400, { code: "INVALID_MEMBERS" }) };
  }
  const unique = [...new Set(membroIds)];
  const found = (await AcademyUser.find({ _id: { $in: unique.map((id) => new Types.ObjectId(id)) } })
    .select("fullName role")
    .lean()) as UserDoc[];
  if (found.length !== unique.length) {
    return { ok: false, response: jsonError("Algum membro não existe", 400, { code: "UNKNOWN_MEMBER" }) };
  }

  const elsewhere = (await HjEquipe.find({
    projetoId: projeto._id,
    ...(current ? { _id: { $ne: current._id } } : {}),
    membroIds: { $in: unique.map((id) => new Types.ObjectId(id)) },
  }).lean()) as EquipeDoc[];
  if (elsewhere.length > 0) {
    const taken = new Set(elsewhere.flatMap((equipe) => equipe.membroIds.map(String)));
    const names = found
      .filter((user) => unique.includes(user._id.toString()) && taken.has(user._id.toString()))
      .map((user) => user.fullName);
    return {
      ok: false,
      response: jsonError(`Já em outra equipe deste projeto: ${names.join(", ")}`, 409, {
        code: "MEMBER_ELSEWHERE",
        membros: names,
      }),
    };
  }

  const capitaoId =
    body.capitaoId === undefined ? (current?.capitaoId ? String(current.capitaoId) : null) : body.capitaoId;
  if (capitaoId && (!isObjectId(capitaoId) || !unique.includes(capitaoId))) {
    return {
      ok: false,
      response: jsonError("O capitão precisa ser um membro da equipe", 400, { code: "CAPTAIN_NOT_MEMBER" }),
    };
  }

  const educadorId =
    body.educadorId === undefined ? (current?.educadorId ? String(current.educadorId) : null) : body.educadorId;
  if (educadorId) {
    if (!isObjectId(educadorId)) {
      return { ok: false, response: jsonError("Educador inválido", 400, { code: "INVALID_EDUCATOR" }) };
    }
    const educador = (await AcademyUser.findById(educadorId).select("role").lean()) as { role: string } | null;
    if (!educador || educador.role !== "tutor") {
      return { ok: false, response: jsonError("Essa conta não é de educador", 400, { code: "NOT_EDUCATOR" }) };
    }
  }

  return {
    ok: true,
    value: {
      projetoId: projeto._id,
      nome,
      programa,
      educadorId: educadorId ? new Types.ObjectId(educadorId) : null,
      capitaoId: capitaoId ? new Types.ObjectId(capitaoId) : null,
      membroIds: unique.map((id) => new Types.ObjectId(id)),
    },
  };
}
