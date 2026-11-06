import { Schema, model, models, type InferSchemaType } from "mongoose";

import { ACONTECIMENTO_TIPOS, CONVIDADO_ETAPAS } from "@/lib/hj/types";

// A guest on the testimony journey (Pré-Gateway → Gateway → Sistema 1 with
// its 16 conferences → Sistema 2 → Jardim), followed by one member. The
// dates of each milestone live here; what happened along the way is the
// timeline in `hj_acontecimentos`.
const datasSchema = new Schema(
  {
    primeiroContato: { type: String, default: null },
    gateway: { type: String, default: null },
    fichaAssinada: { type: String, default: null },
    inicioSistema1: { type: String, default: null },
    fimSistema1: { type: String, default: null },
    inicioSistema2: { type: String, default: null },
    jardim: { type: String, default: null },
  },
  { _id: false },
);

const hjConvidadoSchema = new Schema(
  {
    responsavelId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true, index: true },
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, default: "" },
    cidade: { type: String, default: "" },
    origem: { type: String, default: "" },
    etapa: { type: String, enum: CONVIDADO_ETAPAS, default: "pre_gateway" },
    conferencias: { type: Number, default: 0 },
    // yyyy-mm-dd of the last contact of any kind
    ultimoContato: { type: String, default: null },
    proximoObjetivo: { type: String, default: "" },
    notas: { type: String, default: "" },
    datas: { type: datasSchema, default: () => ({}) },
  },
  { timestamps: true, collection: "hj_convidados" },
);

export type HjConvidadoDocument = InferSchemaType<typeof hjConvidadoSchema>;

if (models.HjConvidado) {
  delete models.HjConvidado;
}

export const HjConvidado = model("HjConvidado", hjConvidadoSchema, "hj_convidados");

const hjAcontecimentoSchema = new Schema(
  {
    convidadoId: { type: Schema.Types.ObjectId, ref: "HjConvidado", required: true, index: true },
    autorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true },
    tipo: { type: String, enum: ACONTECIMENTO_TIPOS, required: true },
    texto: { type: String, default: "" },
    data: { type: String, required: true },
  },
  { timestamps: true, collection: "hj_acontecimentos" },
);

export type HjAcontecimentoDocument = InferSchemaType<typeof hjAcontecimentoSchema>;

if (models.HjAcontecimento) {
  delete models.HjAcontecimento;
}

export const HjAcontecimento = model("HjAcontecimento", hjAcontecimentoSchema, "hj_acontecimentos");
