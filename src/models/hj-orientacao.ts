import { Schema, model, models, type InferSchemaType } from "mongoose";

import { ORIENTACAO_MODULOS } from "@/lib/hj/types";

// What the educator told a team (testimony: after a "ponto de atenção")
// or a member (RM: the week's inner goal, the advice from the consulta),
// written down so neither side forgets it (Yeseong, 14/11/2026). The
// latest one is "the" orientation; the rest is history.
const hjOrientacaoSchema = new Schema(
  {
    modulo: { type: String, enum: ORIENTACAO_MODULOS, required: true },
    equipeId: { type: Schema.Types.ObjectId, ref: "HjEquipe", default: null, index: true },
    membroId: { type: Schema.Types.ObjectId, ref: "AcademyUser", default: null, index: true },
    texto: { type: String, required: true },
    // yyyy-mm-dd of the conversation
    data: { type: String, required: true },
    autorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true },
  },
  { timestamps: true, collection: "hj_orientacoes" },
);

export type HjOrientacaoDocument = InferSchemaType<typeof hjOrientacaoSchema>;

if (models.HjOrientacao) {
  delete models.HjOrientacao;
}

export const HjOrientacao = model("HjOrientacao", hjOrientacaoSchema, "hj_orientacoes");
