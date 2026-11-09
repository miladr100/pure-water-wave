import { Types } from "mongoose";

import { daysBetween } from "@/lib/hj/dates";
import { media, novaMeta, recorde } from "@/lib/hj/rm";
import {
  countsAsResult,
  ref,
  reportsOf,
  usersById,
  type EquipeDoc,
  type PanelContext,
  type ProjetoDoc,
  type RelatorioDoc,
  type UserDoc,
} from "@/lib/hj/data";
import type { HjPrograma, ResultadoLinha } from "@/lib/hj/types";
import { HjEquipe } from "@/models/hj-equipe";
import { HjProjeto } from "@/models/hj-projeto";

export { adminContext, educatorContext, intField, textField } from "../../../painel/_lib/context";

// The project an admin screen talks about: `?projeto=<id>` or the active one.
export async function projectFor(context: PanelContext, projetoParam: string | null) {
  if (projetoParam && Types.ObjectId.isValid(projetoParam)) {
    const chosen = (await HjProjeto.findById(projetoParam).lean()) as ProjetoDoc | null;
    if (chosen) {
      return chosen;
    }
  }
  return context.projeto;
}

export async function allProjects() {
  return (await HjProjeto.find().sort({ inicio: -1 }).lean()) as ProjetoDoc[];
}

export type Grid = {
  projeto: ProjetoDoc;
  equipes: EquipeDoc[];
  relatorios: RelatorioDoc[];
  users: Map<string, UserDoc>;
  dias: { data: string; descanso: boolean }[];
  linhas: ResultadoLinha[];
};

// Every member of every team of the project with their numbers per day —
// the spreadsheet, computed once and sliced by the screens.
export async function buildGrid(projeto: ProjetoDoc): Promise<Grid> {
  const equipes = (await HjEquipe.find({ projetoId: projeto._id }).lean()) as EquipeDoc[];
  const relatorios = await reportsOf(projeto._id);
  const users = await usersById([
    ...equipes.flatMap((equipe) => [...equipe.membroIds, equipe.educadorId, equipe.capitaoId].filter((id): id is Types.ObjectId => id != null)),
    ...relatorios.map((item) => item.membroId),
  ]);
  const descanso = new Set(projeto.diasDescanso ?? []);
  const dias = daysBetween(projeto.inicio, projeto.fim).map((data) => ({ data, descanso: descanso.has(data) }));

  const porMembro = new Map<string, RelatorioDoc[]>();
  for (const item of relatorios) {
    const key = String(item.membroId);
    const list = porMembro.get(key);
    if (list) {
      list.push(item);
    } else {
      porMembro.set(key, [item]);
    }
  }

  const linhas: ResultadoLinha[] = [];
  for (const equipe of equipes) {
    for (const membroId of equipe.membroIds) {
      const key = String(membroId);
      const meus = porMembro.get(key) ?? [];
      const validos = meus.filter((item) => countsAsResult(item.estado));
      const valores = validos.map((item) => item.liquidoCents);
      const mediaCents = media(valores);
      linhas.push({
        membro: { id: key, nome: users.get(key)?.fullName ?? "—" },
        equipe: { id: equipe._id.toString(), nome: equipe.nome, programa: equipe.programa },
        educador: ref(equipe.educadorId ? users.get(String(equipe.educadorId)) : null),
        porDia: Object.fromEntries(meus.map((item) => [item.data, { liquidoCents: item.liquidoCents, estado: item.estado }])),
        totalCents: valores.reduce((sum, value) => sum + value, 0),
        mediaCents,
        recordeCents: recorde(valores),
        metaCents: novaMeta(mediaCents, projeto.regraNovaMeta, projeto.metaDiariaPadraoCents, valores.length),
        diasEnviados: valores.length,
      });
    }
  }
  linhas.sort((a, b) => a.equipe.nome.localeCompare(b.equipe.nome, "pt") || a.membro.nome.localeCompare(b.membro.nome, "pt"));

  return { projeto, equipes, relatorios, users, dias, linhas };
}

export function metaDoPrograma(projeto: ProjetoDoc, programa: HjPrograma) {
  return projeto.metasPrograma?.find((item) => item.programa === programa)?.metaCents ?? 0;
}

export function porPrograma(grid: Grid) {
  const programas = new Map<HjPrograma, { liquidoCents: number; membros: number }>();
  for (const linha of grid.linhas) {
    const current = programas.get(linha.equipe.programa) ?? { liquidoCents: 0, membros: 0 };
    current.liquidoCents += linha.totalCents;
    current.membros += 1;
    programas.set(linha.equipe.programa, current);
  }
  for (const item of grid.projeto.metasPrograma ?? []) {
    if (!programas.has(item.programa)) {
      programas.set(item.programa, { liquidoCents: 0, membros: 0 });
    }
  }
  return [...programas.entries()]
    .map(([programa, value]) => ({ programa, ...value, metaCents: metaDoPrograma(grid.projeto, programa) }))
    .sort((a, b) => a.programa.localeCompare(b.programa));
}

export function metaTotal(projeto: ProjetoDoc) {
  if (projeto.metaTotalCents > 0) {
    return projeto.metaTotalCents;
  }
  return (projeto.metasPrograma ?? []).reduce((sum, item) => sum + item.metaCents, 0);
}


