import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import type { EquipeDoc, ProjetoDoc } from "@/lib/hj/data";
import type { EquipeBody } from "@/lib/hj/types";
import { HjEquipe } from "@/models/hj-equipe";
import { HjProjeto } from "@/models/hj-projeto";
import { HjRelatorio } from "@/models/hj-relatorio";

import { equipesAdmin, validateTeam } from "../../_lib/equipes";
import { educatorContext } from "../../_lib/shared";

async function load(id: string) {
  if (!isObjectId(id)) {
    return null;
  }
  const equipe = (await HjEquipe.findById(id).lean()) as EquipeDoc | null;
  if (!equipe) {
    return null;
  }
  const projeto = (await HjProjeto.findById(equipe.projetoId).lean()) as ProjetoDoc | null;
  return projeto ? { equipe, projeto } : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { id } = await params;
    const loaded = await load(id);
    if (!loaded) {
      return jsonError("Não encontrado", 404);
    }
    const body = (await request.json().catch(() => ({}))) as Partial<EquipeBody>;
    const validated = await validateTeam(body, loaded.projeto, loaded.equipe);
    if (!validated.ok) {
      return validated.response;
    }
    await HjEquipe.updateOne({ _id: loaded.equipe._id }, { $set: validated.value });
    const equipes = await equipesAdmin(loaded.projeto);
    return NextResponse.json({ equipe: equipes.find((item) => item.id === id) ?? null, equipes });
  } catch (error) {
    return serverError("Erro ao salvar equipe", error, "Não foi possível salvar a equipe");
  }
}

// A team with reports is history; it cannot be deleted, only emptied.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { id } = await params;
    const loaded = await load(id);
    if (!loaded) {
      return jsonError("Não encontrado", 404);
    }
    if (await HjRelatorio.exists({ equipeId: loaded.equipe._id })) {
      return jsonError("Esta equipe já tem relatórios; tire os membros em vez de apagá-la", 409, { code: "HAS_REPORTS" });
    }
    await HjEquipe.deleteOne({ _id: loaded.equipe._id });
    return NextResponse.json({ ok: true, equipes: await equipesAdmin(loaded.projeto) });
  } catch (error) {
    return serverError("Erro ao apagar equipe", error, "Não foi possível apagar a equipe");
  }
}
