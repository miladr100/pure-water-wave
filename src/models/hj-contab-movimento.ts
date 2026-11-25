import { Schema, model, models, type InferSchemaType } from "mongoose";

// One movement of a team's books in the Contabilidade module (Victor approved
// the flows on 25/11/2026). A book is a team of the RM project (`livroId` =
// the team's id) or the course's general book (`livroId` = "geral"). Amounts
// are integer minor units of their own currency; currencies are never
// converted or added together. What comes from a validated RM report is not
// stored here: it is read from hj_relatorios every time (see
// lib/hj/contabilidade-server.ts), so a report sent back stops counting.
const paraSchema = new Schema(
  {
    moeda: { type: String, required: true },
    meio: { type: String, enum: ["dinheiro", "conta"], required: true },
    valorMinor: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const hjContabMovimentoSchema = new Schema(
  {
    livroId: { type: String, required: true, index: true },
    tipo: { type: String, enum: ["saida", "entrada", "transferencia", "ajuste"], required: true },
    // always positive, except an adjustment, which keeps its sign
    valorMinor: { type: Number, required: true },
    moeda: { type: String, required: true },
    meio: { type: String, enum: ["dinheiro", "conta"], required: true },
    categoriaId: { type: String, default: null },
    // yyyy-mm-dd, Brazil's calendar
    data: { type: String, required: true },
    descricao: { type: String, default: "" },
    responsavel: { type: String, default: "" },
    origem: { type: String, enum: ["manual", "assistente", "mcp"], default: "manual" },
    pendente: { type: Boolean, default: false },
    comprovanteId: { type: Schema.Types.ObjectId, ref: "HjContabComprovante", default: null },
    para: { type: paraSchema, default: undefined },
    // order inside a day: the order things arrived in
    seq: { type: Number, required: true },
    autorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true },
    // deleted movements stay for the "Desfazer" of the toast and for the record
    removidoEm: { type: Date, default: null },
    removidoPorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", default: null },
  },
  { timestamps: true, collection: "hj_contab_movimentos" },
);

hjContabMovimentoSchema.index({ livroId: 1, removidoEm: 1, data: -1 });

export type HjContabMovimentoDocument = InferSchemaType<typeof hjContabMovimentoSchema>;

if (models.HjContabMovimento) {
  delete models.HjContabMovimento;
}

export const HjContabMovimento = model("HjContabMovimento", hjContabMovimentoSchema, "hj_contab_movimentos");
