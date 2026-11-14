import { Types } from "mongoose";

import { activeProject, equipeResumo, projetoResumo, ref, sameId, usersById, type EquipeDoc, type PanelContext, type ProjetoDoc, type UserDoc } from "@/lib/hj/data";
import { daysBetween } from "@/lib/hj/dates";
import type { CaixaEquipe, CaixaResumoEquipe, LancamentoCategoria, LancamentoRow, LancamentoTipo } from "@/lib/hj/types";
import { HjEquipe } from "@/models/hj-equipe";
import { HjLancamento } from "@/models/hj-lancamento";

// The team's cash box during the testimony drive (docs/painel/P4,
// "Caixa da equipe"): who may see and post, the balance, the stay fee.

export type LancamentoDoc = {
  _id: Types.ObjectId;
  equipeId: Types.ObjectId;
  projetoId: Types.ObjectId | null;
  data: string;
  tipo: LancamentoTipo;
  categoria: LancamentoCategoria;
  valorCents: number;
  descricao: string;
  autorId: Types.ObjectId;
  automatico: boolean;
  periodo?: { inicio: string; fim: string } | null;
  createdAt?: Date;
};

// The teams the drive counts: the active testimony project's, or — while
// it has none — the active RM project's (the ones that organise people).
export async function testemunhoTeamsOf(projetoTestemunho: ProjetoDoc | null, projetoRm: ProjetoDoc | null) {
  if (projetoTestemunho) {
    const own = (await HjEquipe.find({ projetoId: projetoTestemunho._id }).lean()) as EquipeDoc[];
    if (own.length > 0) {
      return own;
    }
  }
  return projetoRm ? ((await HjEquipe.find({ projetoId: projetoRm._id }).lean()) as EquipeDoc[]) : [];
}

// The person's own team in the drive: their team in the testimony
// project, or their RM team while the drive borrows those.
export async function minhaEquipeTestemunho(context: PanelContext) {
  const projeto = await activeProject("testemunho");
  const equipes = await testemunhoTeamsOf(projeto, context.projeto);
  const equipe = equipes.find((item) => item.membroIds.some((id) => sameId(id, context.user._id))) ?? null;
  return { projeto, equipes, equipe };
}

export function podeLancar(context: PanelContext, equipe: EquipeDoc) {
  if (context.papeis.administrador) return true;
  if (context.papeis.educador && sameId(equipe.educadorId, context.user._id)) return true;
  return sameId(equipe.capitaoId, context.user._id);
}

export function podeVer(context: PanelContext, equipe: EquipeDoc) {
  return context.papeis.educador || context.papeis.administrador || equipe.membroIds.some((id) => sameId(id, context.user._id));
}

export const sinal = (doc: Pick<LancamentoDoc, "tipo" | "valorCents">) => (doc.tipo === "entrada" ? doc.valorCents : -doc.valorCents);

export function lancamentoRow(doc: LancamentoDoc, users: Map<string, UserDoc>): LancamentoRow {
  return {
    id: doc._id.toString(),
    data: doc.data,
    tipo: doc.tipo,
    categoria: doc.categoria,
    valorCents: doc.valorCents,
    descricao: doc.descricao ?? "",
    autor: ref(users.get(String(doc.autorId))) ?? { id: String(doc.autorId), nome: "—" },
    automatico: doc.automatico === true,
    periodo: doc.periodo?.inicio && doc.periodo.fim ? { inicio: doc.periodo.inicio, fim: doc.periodo.fim } : null,
    criadoEm: (doc.createdAt ?? new Date()).toISOString(),
  };
}

export async function caixaDaEquipe(context: PanelContext, equipe: EquipeDoc, projeto: ProjetoDoc | null): Promise<CaixaEquipe> {
  const docs = (await HjLancamento.find({ equipeId: equipe._id }).sort({ data: -1, createdAt: -1 }).lean()) as LancamentoDoc[];
  const users = await usersById([
    ...docs.map((doc) => doc.autorId),
    ...[equipe.capitaoId, equipe.educadorId].filter((id): id is Types.ObjectId => id != null),
  ]);
  let entradasCents = 0;
  let saidasCents = 0;
  const porCategoria = new Map<string, { categoria: LancamentoCategoria; tipo: LancamentoTipo; valorCents: number }>();
  for (const doc of docs) {
    if (doc.tipo === "entrada") entradasCents += doc.valorCents;
    else saidasCents += doc.valorCents;
    const key = `${doc.tipo}:${doc.categoria}`;
    const current = porCategoria.get(key) ?? { categoria: doc.categoria, tipo: doc.tipo, valorCents: 0 };
    current.valorCents += doc.valorCents;
    porCategoria.set(key, current);
  }
  return {
    equipe: { ...equipeResumo(equipe, users), membros: equipe.membroIds.length, taxaEstadiaCents: equipe.taxaEstadiaCents ?? 0 },
    projeto: projeto ? projetoResumo(projeto, context.hoje) : null,
    saldoCents: entradasCents - saidasCents,
    entradasCents,
    saidasCents,
    porCategoria: [...porCategoria.values()].sort((a, b) => b.valorCents - a.valorCents),
    lancamentos: docs.map((doc) => lancamentoRow(doc, users)),
    podeLancar: podeLancar(context, equipe),
    podeConfigurar: context.papeis.educador || context.papeis.administrador,
  };
}

export async function resumoDasEquipes(equipes: EquipeDoc[]): Promise<CaixaResumoEquipe[]> {
  const docs = (await HjLancamento.find({ equipeId: { $in: equipes.map((equipe) => equipe._id) } })
    .select("equipeId tipo valorCents data")
    .lean()) as Pick<LancamentoDoc, "_id" | "equipeId" | "tipo" | "valorCents" | "data">[];
  const users = await usersById(equipes.flatMap((equipe) => [equipe.capitaoId, equipe.educadorId].filter((id): id is Types.ObjectId => id != null)));
  return equipes
    .map((equipe) => {
      const meus = docs.filter((doc) => sameId(doc.equipeId, equipe._id));
      const entradasCents = meus.filter((doc) => doc.tipo === "entrada").reduce((sum, doc) => sum + doc.valorCents, 0);
      const saidasCents = meus.filter((doc) => doc.tipo === "saida").reduce((sum, doc) => sum + doc.valorCents, 0);
      return {
        equipe: { id: equipe._id.toString(), nome: equipe.nome, programa: equipe.programa },
        capitao: ref(equipe.capitaoId ? users.get(String(equipe.capitaoId)) : null),
        educador: ref(equipe.educadorId ? users.get(String(equipe.educadorId)) : null),
        membros: equipe.membroIds.length,
        taxaEstadiaCents: equipe.taxaEstadiaCents ?? 0,
        saldoCents: entradasCents - saidasCents,
        entradasCents,
        saidasCents,
        lancamentos: meus.length,
        ultimoLancamento: meus.reduce<string | null>((latest, doc) => (latest === null || doc.data > latest ? doc.data : latest), null),
      };
    })
    .sort((a, b) => a.equipe.nome.localeCompare(b.equipe.nome, "pt"));
}

// The stay fee for a period: members × days × the team's daily rate, as
// one outgoing movement marked automatic. Overlapping a posted period is
// refused; the captain deletes the old one first.
export async function lancarEstadia(context: PanelContext, equipe: EquipeDoc, projeto: ProjetoDoc | null, inicio: string, fim: string) {
  const dias = daysBetween(inicio, fim);
  const taxa = equipe.taxaEstadiaCents ?? 0;
  if (dias.length === 0 || taxa <= 0 || equipe.membroIds.length === 0) {
    return { ok: false as const, code: "NOTHING_TO_POST" };
  }
  const overlap = await HjLancamento.exists({
    equipeId: equipe._id,
    automatico: true,
    "periodo.inicio": { $lte: fim },
    "periodo.fim": { $gte: inicio },
  });
  if (overlap) {
    return { ok: false as const, code: "PERIOD_POSTED" };
  }
  const valorCents = equipe.membroIds.length * dias.length * taxa;
  const created = await HjLancamento.create({
    equipeId: equipe._id,
    projetoId: projeto?._id ?? null,
    data: fim,
    tipo: "saida",
    categoria: "estadia",
    valorCents,
    descricao: `Estadia · ${equipe.membroIds.length} membros × ${dias.length} dias`,
    autorId: context.user._id,
    automatico: true,
    periodo: { inicio, fim },
  });
  return { ok: true as const, id: created._id.toString(), valorCents };
}
