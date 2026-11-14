import type { Types } from "mongoose";

import type { AreaDaEquipe, AreaNode, AreaRef, AreaTipo } from "@/lib/hj/types";
import { areasCatalogo } from "@/models/hj-area";

export type AreaDoc = {
  _id: Types.ObjectId;
  tipo: AreaTipo;
  nome: string;
  paiId: Types.ObjectId | null;
  ativo: boolean;
  ordem?: number;
};

// The areas tree loaded once, with the lookups the routes need: a node's
// ancestors, its children, and where a team sits.
export class AreasTree {
  readonly byId: Map<string, AreaDoc>;
  readonly children: Map<string, AreaDoc[]>;

  constructor(readonly docs: AreaDoc[]) {
    this.byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));
    this.children = new Map();
    for (const doc of docs) {
      const key = doc.paiId ? doc.paiId.toString() : "";
      const list = this.children.get(key);
      if (list) {
        list.push(doc);
      } else {
        this.children.set(key, [doc]);
      }
    }
  }

  static async load() {
    return new AreasTree((await areasCatalogo()) as unknown as AreaDoc[]);
  }

  filhos(paiId: string | null) {
    return this.children.get(paiId ?? "") ?? [];
  }

  // The team's local, país and região, or null when the local is gone.
  daEquipe(areaId: Types.ObjectId | string | null | undefined): AreaDaEquipe {
    if (!areaId) {
      return null;
    }
    const local = this.byId.get(String(areaId));
    if (!local || local.tipo !== "local") {
      return null;
    }
    const pais = local.paiId ? this.byId.get(local.paiId.toString()) : undefined;
    const regiao = pais?.paiId ? this.byId.get(pais.paiId.toString()) : undefined;
    const ref = (doc: AreaDoc | undefined): AreaRef | null => (doc ? { id: doc._id.toString(), nome: doc.nome } : null);
    return { local: { id: local._id.toString(), nome: local.nome }, pais: ref(pais), regiao: ref(regiao) };
  }

  node(doc: AreaDoc, equipes: number): AreaNode {
    return { id: doc._id.toString(), tipo: doc.tipo, nome: doc.nome, paiId: doc.paiId ? doc.paiId.toString() : null, ativo: doc.ativo !== false, equipes };
  }
}

// A local's name with its country, for selects and chips: "Campinas · Brasil".
export function areaLabel(area: AreaDaEquipe) {
  if (!area) {
    return "";
  }
  return area.pais ? `${area.local.nome} · ${area.pais.nome}` : area.local.nome;
}

// The parent a new node needs: regions have none, countries a region,
// locals a country.
export const PAI_ESPERADO: Record<AreaTipo, AreaTipo | null> = { regiao: null, pais: "regiao", local: "pais" };
