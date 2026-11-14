import { Schema, model, models, type InferSchemaType } from "mongoose";

import { MODULO_TESTEMUNHO_MODOS } from "@/lib/hj/types";

// The panel's one settings document (docs/painel/decisoes-pendentes.md).
// Today it holds the testimony module's switch: shown to members only
// while a testimony drive runs (Milad's feature flag, 13/11/2026), or
// forced on or off by the administrator.
const hjConfiguracaoSchema = new Schema(
  {
    chave: { type: String, default: "painel", unique: true },
    modulos: {
      type: new Schema({ testemunho: { type: String, enum: MODULO_TESTEMUNHO_MODOS, default: "auto" } }, { _id: false }),
      default: () => ({ testemunho: "auto" }),
    },
  },
  { timestamps: true, collection: "hj_configuracoes" },
);

export type HjConfiguracaoDocument = InferSchemaType<typeof hjConfiguracaoSchema>;

if (models.HjConfiguracao) {
  delete models.HjConfiguracao;
}

export const HjConfiguracao = model("HjConfiguracao", hjConfiguracaoSchema, "hj_configuracoes");

export async function hjConfiguracao() {
  const doc = await HjConfiguracao.findOneAndUpdate({ chave: "painel" }, { $setOnInsert: { chave: "painel" } }, { upsert: true, new: true }).lean();
  return { modulos: { testemunho: doc?.modulos?.testemunho ?? "auto" } } as { modulos: { testemunho: (typeof MODULO_TESTEMUNHO_MODOS)[number] } };
}
