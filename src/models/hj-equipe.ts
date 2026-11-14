import { Schema, model, models, type InferSchemaType } from "mongoose";

import { HJ_PROGRAMAS } from "@/lib/hj/types";

// A team inside a project. The captain is one of its members; being captain
// is derived from this document, never stored on the person. The educator
// is the account that follows the team (an AcademyUser with role tutor).
const hjEquipeSchema = new Schema(
  {
    projetoId: { type: Schema.Types.ObjectId, ref: "HjProjeto", required: true, index: true },
    nome: { type: String, required: true, trim: true },
    programa: { type: String, enum: HJ_PROGRAMAS, required: true },
    educadorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", default: null },
    capitaoId: { type: Schema.Types.ObjectId, ref: "AcademyUser", default: null },
    membroIds: { type: [Schema.Types.ObjectId], ref: "AcademyUser", default: [] },
    // the local (centro de testemunho) the team works from; país and
    // região follow from the areas tree
    areaId: { type: Schema.Types.ObjectId, ref: "HjArea", default: null },
    // stay fee per member per day, charged to the team's cash box
    taxaEstadiaCents: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "hj_equipes" },
);

hjEquipeSchema.index({ projetoId: 1, membroIds: 1 });

export type HjEquipeDocument = InferSchemaType<typeof hjEquipeSchema>;

if (models.HjEquipe) {
  delete models.HjEquipe;
}

export const HjEquipe = model("HjEquipe", hjEquipeSchema, "hj_equipes");
