import { Schema, model, models, type InferSchemaType } from "mongoose";

import { LANCAMENTO_CATEGORIAS, LANCAMENTO_TIPOS } from "@/lib/hj/types";

// One movement of a team's cash box during the testimony drive (Yeseong's
// ask via Milad, 13/11/2026): money in (RM, donations) and money out (the
// stay fee, food, transport, material), kept as integer cents. The balance
// is the sum; nothing is stored twice. Wang Song's accounting_movements,
// without the per-day RM entries (those are the RM module's reports).
const hjLancamentoSchema = new Schema(
  {
    equipeId: { type: Schema.Types.ObjectId, ref: "HjEquipe", required: true, index: true },
    projetoId: { type: Schema.Types.ObjectId, ref: "HjProjeto", default: null },
    // yyyy-mm-dd, Brazil's calendar
    data: { type: String, required: true },
    tipo: { type: String, enum: LANCAMENTO_TIPOS, required: true },
    categoria: { type: String, enum: LANCAMENTO_CATEGORIAS, required: true },
    valorCents: { type: Number, required: true, min: 0 },
    descricao: { type: String, default: "" },
    autorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true },
    // the stay fee posted for a period, not typed in by hand
    automatico: { type: Boolean, default: false },
    periodo: {
      type: new Schema({ inicio: { type: String }, fim: { type: String } }, { _id: false }),
      default: undefined,
    },
  },
  { timestamps: true, collection: "hj_lancamentos" },
);

hjLancamentoSchema.index({ equipeId: 1, data: 1 });

export type HjLancamentoDocument = InferSchemaType<typeof hjLancamentoSchema>;

if (models.HjLancamento) {
  delete models.HjLancamento;
}

export const HjLancamento = model("HjLancamento", hjLancamentoSchema, "hj_lancamentos");
