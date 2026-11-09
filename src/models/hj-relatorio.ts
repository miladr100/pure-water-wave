import { Schema, model, models, type InferSchemaType } from "mongoose";

import { RELATORIO_ESTADOS } from "@/lib/hj/types";

// One member's fundraising result for one day of a project: the fields of
// the WhatsApp report the teams send today, kept as integer cents. One
// document per member per day; sending again replaces the numbers and
// resets the state to "enviado".
const hjRelatorioSchema = new Schema(
  {
    projetoId: { type: Schema.Types.ObjectId, ref: "HjProjeto", required: true, index: true },
    equipeId: { type: Schema.Types.ObjectId, ref: "HjEquipe", required: true, index: true },
    membroId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true },
    // yyyy-mm-dd, Brazil's calendar
    data: { type: String, required: true },
    dinheiroCents: { type: Number, default: 0 },
    pixCents: { type: Number, default: 0 },
    despesasCents: { type: Number, default: 0 },
    // dinheiro + pix − despesas, stored so the grids never recompute it
    liquidoCents: { type: Number, default: 0 },
    itens: { type: Number, default: 0 },
    contatos: { type: Number, default: 0 },
    observacoes: { type: String, default: "" },
    estado: { type: String, enum: RELATORIO_ESTADOS, default: "enviado" },
    motivoDevolucao: { type: String, default: "" },
    enviadoEm: { type: Date, default: () => new Date() },
    validadoPorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", default: null },
    validadoEm: { type: Date, default: null },
  },
  { timestamps: true, collection: "hj_relatorios" },
);

hjRelatorioSchema.index({ projetoId: 1, membroId: 1, data: 1 }, { unique: true });

export type HjRelatorioDocument = InferSchemaType<typeof hjRelatorioSchema>;

if (models.HjRelatorio) {
  delete models.HjRelatorio;
}

export const HjRelatorio = model("HjRelatorio", hjRelatorioSchema, "hj_relatorios");
