import { NextResponse } from "next/server";

import { serverError } from "@/lib/academy/http";
import { AreasTree, type AreaDoc } from "@/lib/hj/areas";
import { activeProject, convidadoRow, equipeLookup, guestsOf, projetoResumo, usersById, type EquipeDoc, type ProjetoDoc } from "@/lib/hj/data";
import { CONVIDADO_ETAPAS, type ConvidadoEtapa, type ConvidadoRow, type HjPrograma, type TestemunhoContagem, type TestemunhoNode, type TestemunhoResultados } from "@/lib/hj/types";
import { HjEquipe } from "@/models/hj-equipe";
import { HjProjeto } from "@/models/hj-projeto";

import { educatorContext } from "../../_lib/shared";

const vazio = (): TestemunhoContagem => ({
  convidados: 0,
  porEtapa: Object.fromEntries(CONVIDADO_ETAPAS.map((etapa) => [etapa, 0])) as Record<ConvidadoEtapa, number>,
  fichas: 0,
  alertas: 0,
  membros: 0,
  membrosComConvidado: 0,
});

function soma(into: TestemunhoContagem, from: TestemunhoContagem) {
  into.convidados += from.convidados;
  for (const etapa of CONVIDADO_ETAPAS) {
    into.porEtapa[etapa] += from.porEtapa[etapa];
  }
  into.fichas += from.fichas;
  into.alertas += from.alertas;
  into.membros += from.membros;
  into.membrosComConvidado += from.membrosComConvidado;
}

function contagemDaEquipe(equipe: EquipeDoc, rows: ConvidadoRow[]): TestemunhoContagem {
  const out = vazio();
  const comConvidado = new Set<string>();
  for (const row of rows) {
    out.convidados += 1;
    out.porEtapa[row.etapa] += 1;
    if (row.datas.fichaAssinada) out.fichas += 1;
    if (row.alerta) out.alertas += 1;
    comConvidado.add(row.responsavel.id);
  }
  out.membros = equipe.membroIds.length;
  out.membrosComConvidado = equipe.membroIds.filter((id) => comConvidado.has(String(id))).length;
  return out;
}

// The teams the testimony drive counts: the active testimony project's,
// or — while it has none of its own — the active RM project's, the ones
// that organise people today (same rule as the administrator's home).
export async function testemunhoTeams(projetoTestemunho: ProjetoDoc | null, projetoRm: ProjetoDoc | null) {
  if (projetoTestemunho) {
    const own = (await HjEquipe.find({ projetoId: projetoTestemunho._id }).lean()) as EquipeDoc[];
    if (own.length > 0) {
      return own;
    }
  }
  return projetoRm ? ((await HjEquipe.find({ projetoId: projetoRm._id }).lean()) as EquipeDoc[]) : [];
}

// GET: guests by mission area — região → país → local → equipe — plus
// the totals by program. "Números de cada centro de testemunho"
// (Yeseong) and the overview by area Rev. Kim asks for (Milad), 14/11.
export async function GET(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const param = new URL(request.url).searchParams.get("projeto");
    const projeto = param ? ((await HjProjeto.findById(param).lean().catch(() => null)) as ProjetoDoc | null) : await activeProject("testemunho");
    const equipes = await testemunhoTeams(projeto, context.projeto);
    const areas = await AreasTree.load();

    const memberIds = new Set(equipes.flatMap((equipe) => equipe.membroIds.map(String)));
    const guests = memberIds.size > 0 ? await guestsOf(memberIds) : [];
    const users = await usersById(guests.map((guest) => guest.responsavelId));
    const lookup = equipeLookup(equipes);
    const rows = guests.map((guest) => convidadoRow(guest, users, lookup, context.hoje));
    const porEquipe = new Map<string, ConvidadoRow[]>();
    for (const row of rows) {
      if (!row.equipe) continue;
      const list = porEquipe.get(row.equipe.id);
      if (list) list.push(row);
      else porEquipe.set(row.equipe.id, [row]);
    }

    const equipeNode = (equipe: EquipeDoc): TestemunhoNode => ({
      id: equipe._id.toString(),
      tipo: "equipe",
      nome: equipe.nome,
      programa: equipe.programa,
      filhos: [],
      ...contagemDaEquipe(equipe, porEquipe.get(equipe._id.toString()) ?? []),
    });

    const porLocal = new Map<string, EquipeDoc[]>();
    const semArea: EquipeDoc[] = [];
    for (const equipe of equipes) {
      const key = equipe.areaId ? String(equipe.areaId) : "";
      if (key && areas.byId.get(key)?.tipo === "local") {
        const list = porLocal.get(key);
        if (list) list.push(equipe);
        else porLocal.set(key, [equipe]);
      } else {
        semArea.push(equipe);
      }
    }

    // Build the tree bottom-up and drop branches with no team under them.
    const build = (doc: AreaDoc): TestemunhoNode | null => {
      const node: TestemunhoNode = { id: doc._id.toString(), tipo: doc.tipo, nome: doc.nome, filhos: [], ...vazio() };
      if (doc.tipo === "local") {
        node.filhos = (porLocal.get(doc._id.toString()) ?? []).map(equipeNode).sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
      } else {
        node.filhos = areas
          .filhos(doc._id.toString())
          .map(build)
          .filter((child): child is TestemunhoNode => child !== null);
      }
      if (node.filhos.length === 0) {
        return null;
      }
      for (const child of node.filhos) {
        soma(node, child);
      }
      return node;
    };
    const arvore = areas
      .filhos(null)
      .map(build)
      .filter((node): node is TestemunhoNode => node !== null);
    if (semArea.length > 0) {
      const node: TestemunhoNode = { id: "sem_area", tipo: "sem_area", nome: "Sem área definida", filhos: semArea.map(equipeNode).sort((a, b) => a.nome.localeCompare(b.nome, "pt")), ...vazio() };
      for (const child of node.filhos) soma(node, child);
      arvore.push(node);
    }

    const total = vazio();
    const programas = new Map<HjPrograma, TestemunhoContagem>();
    for (const equipe of equipes) {
      const contagem = contagemDaEquipe(equipe, porEquipe.get(equipe._id.toString()) ?? []);
      soma(total, contagem);
      const atual = programas.get(equipe.programa) ?? vazio();
      soma(atual, contagem);
      programas.set(equipe.programa, atual);
    }

    const body: TestemunhoResultados = {
      projeto: projeto ? projetoResumo(projeto, context.hoje) : null,
      total,
      arvore,
      porPrograma: [...programas.entries()].map(([programa, contagem]) => ({ programa, ...contagem })).sort((a, b) => a.programa.localeCompare(b.programa)),
    };
    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao calcular resultados do testemunho", error, "Não foi possível carregar os resultados");
  }
}

