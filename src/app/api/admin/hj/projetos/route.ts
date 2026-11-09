import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import type { EquipeDoc } from "@/lib/hj/data";
import type { ProjetoBody } from "@/lib/hj/types";
import { HjEquipe } from "@/models/hj-equipe";
import { HjProjeto } from "@/models/hj-projeto";

import { projetosAdmin, validateProject } from "../_lib/projetos";
import { adminContext, educatorContext } from "../_lib/shared";

export async function GET() {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    return NextResponse.json({ projetos: await projetosAdmin(result.context.hoje) });
  } catch (error) {
    return serverError("Erro ao listar projetos", error, "Não foi possível carregar os projetos");
  }
}

// A new project, optionally with the teams (and members) of a previous one
// copied over — the way each RM period starts from the last.
export async function POST(request: Request) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as Partial<ProjetoBody>;
    const validated = validateProject(body, null);
    if (!validated.ok) {
      return validated.response;
    }
    if (body.copiarEquipesDe && !isObjectId(body.copiarEquipesDe)) {
      return jsonError("Projeto de origem inválido", 400, { code: "INVALID_SOURCE" });
    }

    const created = await HjProjeto.create(validated.value);

    let equipesCopiadas = 0;
    if (body.copiarEquipesDe) {
      const origem = (await HjEquipe.find({ projetoId: new Types.ObjectId(body.copiarEquipesDe) }).lean()) as EquipeDoc[];
      if (origem.length > 0) {
        await HjEquipe.insertMany(
          origem.map((equipe) => ({
            projetoId: created._id,
            nome: equipe.nome,
            programa: equipe.programa,
            educadorId: equipe.educadorId,
            capitaoId: equipe.capitaoId,
            membroIds: equipe.membroIds,
          })),
        );
        equipesCopiadas = origem.length;
      }
    }

    const projetos = await projetosAdmin(result.context.hoje);
    return NextResponse.json(
      { projeto: projetos.find((item) => item.id === created._id.toString()) ?? null, projetos, equipesCopiadas },
      { status: 201 },
    );
  } catch (error) {
    return serverError("Erro ao criar projeto", error, "Não foi possível criar o projeto");
  }
}
