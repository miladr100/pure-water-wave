import { Schema, model, models, type InferSchemaType } from "mongoose";

// The photo or PDF of a receipt, attached to a movement. Kept in Mongo: the
// browser shrinks photos before sending, so a receipt is a few hundred KB.
const hjContabComprovanteSchema = new Schema(
  {
    livroId: { type: String, required: true, index: true },
    nome: { type: String, default: "comprovante" },
    mime: { type: String, required: true },
    tamanho: { type: Number, required: true },
    dados: { type: Buffer, required: true },
    autorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true },
  },
  { timestamps: true, collection: "hj_contab_comprovantes" },
);

export type HjContabComprovanteDocument = InferSchemaType<typeof hjContabComprovanteSchema>;

if (models.HjContabComprovante) {
  delete models.HjContabComprovante;
}

export const HjContabComprovante = model("HjContabComprovante", hjContabComprovanteSchema, "hj_contab_comprovantes");
