import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import type { AreaBody } from "@/lib/hj/types";
import { HjArea } from "@/models/hj-area";
import { HjEquipe } from "@/models/hj-equipe";

import { adminContext, textField } from "../../_lib/shared";
import { listAreas } from "../route";

type Params = { params: Promise<{ id: string }> };

// PATCH: rename or (de)activate. The type and the parent never change —
// moving a local to another country is deleting it and creating it there.
export async function PATCH(request: Request, { params }: Params) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }
    const body = (await request.json().catch(() => ({}))) as Partial<AreaBody>;
    const set: Record<string, unknown> = {};
    if (body.nome !== undefined) {
      const nome = textField(body.nome, 80);
      if (nome.length < 2) {
        return jsonError("Nome obrigatório", 400, { code: "NAME_REQUIRED" });
      }
      set.nome = nome;
    }
    if (typeof body.ativo === "boolean") {
      set.ativo = body.ativo;
    }
    if (Object.keys(set).length === 0) {
      return jsonError("Nada para salvar", 400, { code: "EMPTY" });
    }
    const updated = await HjArea.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
    if (!updated) {
      return jsonError("Não encontrado", 404);
    }
    return NextResponse.json({ areas: await listAreas() });
  } catch (error) {
    return serverError("Erro ao salvar área", error, "Não foi possível salvar a área");
  }
}

// DELETE: only a leaf no team points at. Anything else is deactivated.
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }
    const area = await HjArea.findById(id).lean();
    if (!area) {
      return jsonError("Não encontrado", 404);
    }
    if (await HjArea.exists({ paiId: area._id })) {
      return jsonError("Esta área tem áreas dentro dela; desative em vez de apagar", 409, { code: "HAS_CHILDREN" });
    }
    if (await HjEquipe.exists({ areaId: area._id })) {
      return jsonError("Há equipes nesta área; desative em vez de apagar", 409, { code: "HAS_TEAMS" });
    }
    await HjArea.deleteOne({ _id: area._id });
    return NextResponse.json({ areas: await listAreas() });
  } catch (error) {
    return serverError("Erro ao apagar área", error, "Não foi possível apagar a área");
  }
}
