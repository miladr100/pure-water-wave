import { Schema, model, models, type InferSchemaType } from "mongoose";

import { AREA_TIPOS } from "@/lib/hj/types";

// The mission areas the testimony drive reports by — a tree of regions,
// countries and locals ("centros de testemunho"), as Wang Song's system
// had regions → countries → cities. A team points at a local; its country
// and region follow from the tree, never from the team.
const hjAreaSchema = new Schema(
  {
    tipo: { type: String, enum: AREA_TIPOS, required: true },
    nome: { type: String, required: true, trim: true },
    paiId: { type: Schema.Types.ObjectId, ref: "HjArea", default: null, index: true },
    ativo: { type: Boolean, default: true },
    ordem: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "hj_areas" },
);

hjAreaSchema.index({ tipo: 1, paiId: 1, nome: 1 }, { unique: true });

export type HjAreaDocument = InferSchemaType<typeof hjAreaSchema>;

if (models.HjArea) {
  delete models.HjArea;
}

export const HjArea = model("HjArea", hjAreaSchema, "hj_areas");

// Wang Song's seed: five regions and the countries under each.
export const AREAS_PADRAO: { regiao: string; paises: string[] }[] = [
  { regiao: "Região 1", paises: ["Brasil"] },
  { regiao: "Região 2", paises: ["Paraguai", "Uruguai", "Argentina", "Chile"] },
  { regiao: "Região 3", paises: ["Bolívia", "Peru", "Equador", "Colômbia", "Venezuela", "Suriname"] },
  { regiao: "Região 4", paises: ["Santa Lúcia", "República Dominicana", "Cuba"] },
  { regiao: "Região 5", paises: ["Panamá", "Costa Rica", "Nicarágua", "Honduras", "El Salvador", "Guatemala", "México"] },
];

// The tree, created with the defaults the first time it is read.
export async function areasCatalogo() {
  const count = await HjArea.countDocuments();
  if (count === 0) {
    let ordem = 0;
    for (const item of AREAS_PADRAO) {
      const regiao = await HjArea.create({ tipo: "regiao", nome: item.regiao, paiId: null, ordem: ordem++ });
      let sub = 0;
      for (const pais of item.paises) {
        await HjArea.create({ tipo: "pais", nome: pais, paiId: regiao._id, ordem: sub++ });
      }
    }
  }
  return HjArea.find().sort({ ordem: 1, nome: 1 }).lean();
}
