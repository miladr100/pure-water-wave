import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { AreasTree, PAI_ESPERADO } from "@/lib/hj/areas";
import { AREA_TIPOS, type AreaBody, type AreaNode } from "@/lib/hj/types";
import { HjArea } from "@/models/hj-area";
import { HjEquipe } from "@/models/hj-equipe";

import { adminContext, educatorContext, textField } from "../_lib/shared";

export async function listAreas(): Promise<AreaNode[]> {
  const tree = await AreasTree.load();
  const counts = (await HjEquipe.aggregate([{ $match: { areaId: { $ne: null } } }, { $group: { _id: "$areaId", n: { $sum: 1 } } }])) as { _id: Types.ObjectId; n: number }[];
  const porArea = new Map(counts.map((item) => [item._id.toString(), item.n]));
  // depth-first, so a flat list still reads as a tree
  const out: AreaNode[] = [];
  const walk = (paiId: string | null) => {
    for (const doc of tree.filhos(paiId)) {
      out.push(tree.node(doc, porArea.get(doc._id.toString()) ?? 0));
      walk(doc._id.toString());
    }
  };
  walk(null);
  return out;
}

// GET: the whole tree, flat and ordered, for selects and the editor.
export async function GET() {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    return NextResponse.json({ areas: await listAreas() });
  } catch (error) {
    return serverError("Erro ao listar áreas", error, "Não foi possível carregar as áreas");
  }
}

// POST: a new region, country or local under the right parent.
export async function POST(request: Request) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as Partial<AreaBody>;
    if (!body.tipo || !AREA_TIPOS.includes(body.tipo)) {
      return jsonError("Tipo inválido", 400, { code: "INVALID_TYPE" });
    }
    const nome = textField(body.nome, 80);
    if (nome.length < 2) {
      return jsonError("Nome obrigatório", 400, { code: "NAME_REQUIRED" });
    }
    const esperado = PAI_ESPERADO[body.tipo];
    let paiId: Types.ObjectId | null = null;
    if (esperado) {
      if (!isObjectId(body.paiId)) {
        return jsonError("Área superior obrigatória", 400, { code: "PARENT_REQUIRED" });
      }
      const pai = await HjArea.findById(body.paiId).lean();
      if (!pai || pai.tipo !== esperado) {
        return jsonError("Área superior inválida", 400, { code: "INVALID_PARENT" });
      }
      paiId = pai._id;
    } else if (body.paiId) {
      return jsonError("Uma região não tem área superior", 400, { code: "INVALID_PARENT" });
    }
    const existing = await HjArea.findOne({ tipo: body.tipo, paiId, nome: new RegExp(`^${nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).lean();
    if (existing) {
      return jsonError("Já existe uma área com esse nome aí", 409, { code: "DUPLICATE" });
    }
    const ordem = await HjArea.countDocuments({ tipo: body.tipo, paiId });
    const created = await HjArea.create({ tipo: body.tipo, nome, paiId, ativo: body.ativo !== false, ordem });
    return NextResponse.json({ area: { id: created._id.toString() }, areas: await listAreas() }, { status: 201 });
  } catch (error) {
    return serverError("Erro ao criar área", error, "Não foi possível criar a área");
  }
}
