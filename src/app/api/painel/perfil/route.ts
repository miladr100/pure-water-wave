import { NextResponse } from "next/server";

import { jsonError, serverError } from "@/lib/academy/http";
import { equipeResumo, ref, usersById, type PanelContext, type UserDoc } from "@/lib/hj/data";
import { anosDesde, hjSetPaths, parsePerfilProprio, perfilDe, type HjPerfil } from "@/lib/hj/perfil";
import type { EquipeResumo, PessoaRef } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";

import { panelContext } from "../_lib/context";

export type MeuPerfilHj = {
  perfil: HjPerfil;
  programaNome: string;
  anosComoMembro: number | null;
  equipe: EquipeResumo | null;
  educador: PessoaRef | null;
};

async function shape(user: UserDoc, context: PanelContext): Promise<MeuPerfilHj> {
  const perfil = perfilDe(user.hj);
  const { equipe } = context;
  const users = equipe
    ? await usersById([equipe.capitaoId, equipe.educadorId].filter((id): id is NonNullable<typeof id> => id != null))
    : new Map<string, UserDoc>();
  const educadorId = equipe?.educadorId ?? user.assignedTutorId ?? null;
  const educador = educadorId ? (users.get(String(educadorId)) ?? ((await AcademyUser.findById(educadorId).select("fullName").lean()) as UserDoc | null)) : null;
  const nomes: Record<string, string> = { HJA: "HJ Academy", HJR: "HJ Rang", PW: "Pure Water", STG: "Shin Top Gun", UPA: "UPA" };
  const programa = perfil.programa ?? equipe?.programa ?? null;
  return {
    perfil: { ...perfil, programa },
    programaNome: programa ? nomes[programa] : "",
    anosComoMembro: anosDesde(perfil.membroDesde, context.hoje),
    equipe: equipe ? equipeResumo(equipe, users) : null,
    educador: ref(educador),
  };
}

// GET: the person's own HJ Team profile — the public half only. The
// confidential half never leaves the educator's routes.
export async function GET() {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    return NextResponse.json(await shape(result.context.user, result.context));
  } catch (error) {
    return serverError("Erro ao carregar o perfil", error, "Não foi possível carregar o perfil");
  }
}

// PATCH: the fields the person keeps themself (course, formation, when
// they became a member). Program and cohort are the educator's.
export async function PATCH(request: Request) {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as Partial<HjPerfil>;
    const set = hjSetPaths({ perfil: parsePerfilProprio(body) });
    if (Object.keys(set).length === 0) {
      return jsonError("Nada para salvar", 400, { code: "EMPTY" });
    }
    const user = (await AcademyUser.findByIdAndUpdate(result.context.user._id, { $set: set }, { new: true }).select("fullName hj assignedTutorId").lean()) as UserDoc | null;
    if (!user) {
      return jsonError("Conta não encontrada", 404);
    }
    return NextResponse.json(await shape(user, result.context));
  } catch (error) {
    return serverError("Erro ao salvar o perfil", error, "Não foi possível salvar o perfil");
  }
}
