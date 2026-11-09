import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import type { ProjetoDoc } from "@/lib/hj/data";
import type { EquipeBody } from "@/lib/hj/types";
import { HjEquipe } from "@/models/hj-equipe";
import { HjProjeto } from "@/models/hj-projeto";

import { equipesAdmin, validateTeam } from "../_lib/equipes";
import { educatorContext, projectFor } from "../_lib/shared";

export async function GET(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const projeto = await projectFor(result.context, new URL(request.url).searchParams.get("projeto"));
    if (!projeto) {
      return NextResponse.json({ projeto: null, equipes: [] });
    }
    return NextResponse.json({
      projeto: { id: projeto._id.toString(), nome: projeto.nome },
      equipes: await equipesAdmin(projeto),
    });
  } catch (error) {
    return serverError("Erro ao listar equipes", error, "Não foi possível carregar as equipes");
  }
}

export async function POST(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as Partial<EquipeBody>;
    if (!isObjectId(body.projetoId)) {
      return jsonError("Projeto inválido", 400, { code: "INVALID_PROJECT" });
    }
    const projeto = (await HjProjeto.findById(body.projetoId).lean()) as ProjetoDoc | null;
    if (!projeto) {
      return jsonError("Projeto não encontrado", 404);
    }
    const validated = await validateTeam(body, projeto, null);
    if (!validated.ok) {
      return validated.response;
    }
    const created = await HjEquipe.create(validated.value);
    const equipes = await equipesAdmin(projeto);
    return NextResponse.json(
      { equipe: equipes.find((item) => item.id === created._id.toString()) ?? null, equipes },
      { status: 201 },
    );
  } catch (error) {
    return serverError("Erro ao criar equipe", error, "Não foi possível criar a equipe");
  }
}
