import fs from "node:fs";
import path from "node:path";
import { Types } from "mongoose";

import { activeProject } from "@/lib/hj/data";
import { todayInBrazil } from "@/lib/hj/dates";
import { GERAL_ID, GERAL_NOME, proximoSeq } from "@/lib/hj/contabilidade-server";
import { equipesAdmin } from "@/app/api/admin/hj/_lib/equipes";
import type { ProjetoContabil } from "@/lib/hj/contabilidade";
import { AcademyUser } from "@/models/academy-user";
import { HjContabMovimento } from "@/models/hj-contab-movimento";

import { gerarMovimentos } from "./lib/contabilidade-demo";

// `npm run seed:contabilidade`: fills the books of the active RM project's
// teams (and the general book) with what a captain and an educator would
// have typed in since June. It only writes books that are still empty, so
// it never touches what people entered; `--reset` empties the demo books
// first. seed-painel calls it after building the teams.

function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) {
    return;
  }
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

export async function seedContabilidade(options: { reset?: boolean; log?: (text: string) => void } = {}) {
  const log = options.log ?? (() => undefined);
  const projeto = await activeProject("arrecadacao");
  if (!projeto) {
    log("Contabilidade: no RM project, nothing to seed.");
    return 0;
  }
  const hoje = todayInBrazil();
  const equipes = await equipesAdmin(projeto);
  const livros: ProjetoContabil[] = [
    ...equipes.map((equipe) => ({
      id: equipe.id,
      nome: equipe.nome,
      tipo: "equipe" as const,
      programa: equipe.programa,
      area: equipe.area?.local.nome ?? null,
      educador: equipe.educador?.nome ?? null,
      capitao: equipe.capitao?.nome ?? null,
      membros: equipe.membros.map((membro) => membro.nome),
    })),
    { id: GERAL_ID, nome: GERAL_NOME, tipo: "geral", programa: null, area: null, educador: null, capitao: null, membros: [] },
  ];
  const autor =
    (await AcademyUser.findOne({ role: "tutor", isAdmin: true }).select("_id").lean()) ?? (await AcademyUser.findOne({ role: "tutor" }).select("_id").lean());
  const autorId = autor?._id ?? new Types.ObjectId();
  if (options.reset) {
    await HjContabMovimento.deleteMany({ livroId: { $in: livros.map((livro) => livro.id) } });
  }
  let total = 0;
  for (const livro of livros) {
    if (await HjContabMovimento.exists({ livroId: livro.id })) {
      log(`Contabilidade: ${livro.nome} already has movements, kept.`);
      continue;
    }
    const movimentos = gerarMovimentos(livro, hoje, projeto.inicio);
    const base = proximoSeq();
    await HjContabMovimento.insertMany(
      movimentos.map((mov, index) => ({
        livroId: livro.id,
        tipo: mov.tipo,
        valorMinor: mov.valorMinor,
        moeda: mov.moeda,
        meio: mov.meio,
        categoriaId: mov.categoriaId,
        data: mov.data,
        descricao: mov.descricao,
        responsavel: mov.responsavel,
        origem: "manual",
        pendente: mov.pendente,
        comprovanteId: null,
        ...(mov.para ? { para: mov.para } : {}),
        seq: base + index,
        autorId,
      })),
    );
    total += movimentos.length;
    log(`Contabilidade: ${livro.nome} — ${movimentos.length} movements.`);
  }
  return total;
}

async function main() {
  loadEnvLocal();
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();
  const total = await seedContabilidade({ reset: process.argv.includes("--reset"), log: console.log });
  console.log(`Done: ${total} movements.`);
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith("seed-contabilidade.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
