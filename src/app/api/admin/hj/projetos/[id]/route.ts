import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import type { ProjetoDoc } from "@/lib/hj/data";
import type { ProjetoBody } from "@/lib/hj/types";
import { HjProjeto } from "@/models/hj-projeto";

import { projetosAdmin, validateProject } from "../../_lib/projetos";
import { adminContext } from "../../_lib/shared";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }
    const current = (await HjProjeto.findById(id).lean()) as ProjetoDoc | null;
    if (!current) {
      return jsonError("Não encontrado", 404);
    }
    const body = (await request.json().catch(() => ({}))) as Partial<ProjetoBody>;
    const validated = validateProject(body, current);
    if (!validated.ok) {
      return validated.response;
    }
    await HjProjeto.updateOne({ _id: current._id }, { $set: validated.value });
    const projetos = await projetosAdmin(result.context.hoje);
    return NextResponse.json({ projeto: projetos.find((item) => item.id === id) ?? null, projetos });
  } catch (error) {
    return serverError("Erro ao salvar projeto", error, "Não foi possível salvar o projeto");
  }
}
