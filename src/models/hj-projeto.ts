import { Schema, model, models, type InferSchemaType } from "mongoose";

import { HJ_PROGRAMAS, PROJETO_TIPOS } from "@/lib/hj/types";

// An HJ Team project: a fundraising period ("RM 30 dias – novembro 2026")
// or a testimony drive. Teams belong to a project; everything the panel
// counts is counted inside one. Collections are prefixed `hj_` so the panel
// shares purewaterwave.org's database without touching its data.
const hjProjetoSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    tipo: { type: String, enum: PROJETO_TIPOS, required: true },
    // yyyy-mm-dd, Brazil's calendar
    inicio: { type: String, required: true },
    fim: { type: String, required: true },
    ativo: { type: Boolean, default: true },
    diasDescanso: { type: [String], default: [] },
    moeda: { type: String, default: "BRL" },
    metaDiariaPadraoCents: { type: Number, default: 30000 },
    metaTotalCents: { type: Number, default: 0 },
    metasPrograma: {
      type: [
        new Schema(
          {
            programa: { type: String, enum: HJ_PROGRAMAS, required: true },
            metaCents: { type: Number, default: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    // "Nova meta" = max(minimo, ceil(média × fator) to the nearest `arredondar`)
    regraNovaMeta: {
      type: new Schema(
        {
          fator: { type: Number, default: 1.3 },
          arredondarCents: { type: Number, default: 5000 },
          minimoCents: { type: Number, default: 30000 },
        },
        { _id: false },
      ),
      default: () => ({ fator: 1.3, arredondarCents: 5000, minimoCents: 30000 }),
    },
  },
  { timestamps: true, collection: "hj_projetos" },
);

export type HjProjetoDocument = InferSchemaType<typeof hjProjetoSchema>;

if (models.HjProjeto) {
  delete models.HjProjeto;
}

export const HjProjeto = model("HjProjeto", hjProjetoSchema, "hj_projetos");
