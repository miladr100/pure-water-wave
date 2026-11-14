import { Schema, model, models, type InferSchemaType } from "mongoose";

import { HJ_PROGRAMAS } from "@/lib/hj/types";

// The programs of the HJ Team and their cohorts ("turmas"), as Wang
// Song's system seeded them (docs/painel/P2 US-P2-01). The initials are
// fixed in `HJ_PROGRAMAS` (teams and goals key on them); the names and
// the cohorts are the administrator's to keep.
const hjProgramaSchema = new Schema(
  {
    sigla: { type: String, enum: HJ_PROGRAMAS, required: true, unique: true },
    nome: { type: String, required: true, trim: true },
    ativo: { type: Boolean, default: true },
    turmas: {
      type: [new Schema({ nome: { type: String, required: true, trim: true }, ativa: { type: Boolean, default: true } }, { _id: false })],
      default: [],
    },
  },
  { timestamps: true, collection: "hj_programas" },
);

export type HjProgramaDocument = InferSchemaType<typeof hjProgramaSchema>;

if (models.HjPrograma) {
  delete models.HjPrograma;
}

export const HjPrograma = model("HjPrograma", hjProgramaSchema, "hj_programas");

export const PROGRAMAS_PADRAO: { sigla: (typeof HJ_PROGRAMAS)[number]; nome: string; turmas: string[] }[] = [
  { sigla: "HJA", nome: "HJ Academy", turmas: ["1ª Turma", "2ª Turma", "3ª Turma"] },
  { sigla: "HJR", nome: "HJ Rang", turmas: ["16ª Turma"] },
  { sigla: "PW", nome: "Pure Water", turmas: ["Turma 2026"] },
  { sigla: "STG", nome: "Shin Top Gun", turmas: ["3ª Turma"] },
  { sigla: "UPA", nome: "UPA", turmas: ["11ª Turma"] },
];

// The catalogue, created with the defaults the first time it is read.
export async function programasCatalogo() {
  const existing = await HjPrograma.find().sort({ sigla: 1 }).lean();
  if (existing.length > 0) {
    return existing as unknown as { sigla: (typeof HJ_PROGRAMAS)[number]; nome: string; ativo: boolean; turmas: { nome: string; ativa: boolean }[] }[];
  }
  await HjPrograma.insertMany(PROGRAMAS_PADRAO.map((item) => ({ ...item, ativo: true, turmas: item.turmas.map((nome) => ({ nome, ativa: true })) })));
  return programasCatalogo();
}
