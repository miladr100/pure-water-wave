import { Schema, model, models, type InferSchemaType } from "mongoose";

// The Contabilidade's settings, one document (`_id: "contabilidade"`): the
// categories teams added to the fixed list, the currencies each book switched
// on by hand, and the educators the administrator lets see every book.
const categoriaSchema = new Schema(
  {
    id: { type: String, required: true },
    nome: { type: String, required: true },
    tipo: { type: String, enum: ["saida", "entrada"], required: true },
    icone: { type: String, default: "etiqueta" },
    cor: { type: Number, default: 0 },
    criadaPorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", default: null },
  },
  { _id: false },
);

const hjContabConfigSchema = new Schema(
  {
    _id: { type: String, default: "contabilidade" },
    categorias: { type: [categoriaSchema], default: [] },
    // livroId → currencies switched on (BRL is always on)
    moedas: { type: Map, of: [String], default: {} },
    veTodas: { type: [Schema.Types.ObjectId], ref: "AcademyUser", default: [] },
  },
  { timestamps: true, collection: "hj_contab_config" },
);

export type HjContabConfigDocument = InferSchemaType<typeof hjContabConfigSchema>;

if (models.HjContabConfig) {
  delete models.HjContabConfig;
}

export const HjContabConfig = model("HjContabConfig", hjContabConfigSchema, "hj_contab_config");
