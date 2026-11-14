import { Schema, model, models, type InferSchemaType } from "mongoose";

import { REUNIAO_ESTADOS } from "@/lib/hj/types";

// A member asking their educator for a one-to-one (Dir. Henrique's
// suggestion via Yeseong, 14/11/2026): the young people say they write on
// WhatsApp and never get the conversation. The request carries the
// reason and when they can; the educator confirms a time and place,
// suggests another, or declines. Each side has its own "seen" mark so
// the bell knows what is new for whom.
const hjReuniaoSchema = new Schema(
  {
    membroId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true, index: true },
    educadorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true, index: true },
    motivo: { type: String, required: true },
    // free text: "qualquer dia depois das 19h", "sábado de manhã"
    disponibilidade: { type: String, default: "" },
    estado: { type: String, enum: REUNIAO_ESTADOS, default: "solicitada" },
    // set when confirmed
    dataHora: { type: Date, default: null },
    local: { type: String, default: "" },
    resposta: { type: String, default: "" },
    respondidaEm: { type: Date, default: null },
    vistaPeloMembroEm: { type: Date, default: null },
    vistaPeloEducadorEm: { type: Date, default: null },
    // which channels carried each notice, for the record
    avisos: {
      type: [
        new Schema(
          {
            para: { type: String, enum: ["membro", "educador"], required: true },
            canal: { type: String, enum: ["email", "whatsapp"], required: true },
            ok: { type: Boolean, default: false },
            detalhe: { type: String, default: "" },
            em: { type: Date, default: () => new Date() },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true, collection: "hj_reunioes" },
);

export type HjReuniaoDocument = InferSchemaType<typeof hjReuniaoSchema>;

if (models.HjReuniao) {
  delete models.HjReuniao;
}

export const HjReuniao = model("HjReuniao", hjReuniaoSchema, "hj_reunioes");
