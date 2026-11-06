import { NextResponse } from "next/server";

import { jsonError } from "@/lib/academy/http";
import { isIsoDay } from "@/lib/hj/dates";
import { projetoResumo, type EquipeDoc, type ProjetoDoc } from "@/lib/hj/data";
import { HJ_PROGRAMAS, PROJETO_TIPOS, type ProjetoAdmin, type ProjetoBody } from "@/lib/hj/types";
import { HjEquipe } from "@/models/hj-equipe";

import { allProjects, intField, textField } from "./shared";

export async function projetosAdmin(hoje: string): Promise<ProjetoAdmin[]> {
  const projetos = await allProjects();
  const equipes = (await HjEquipe.find().lean()) as EquipeDoc[];
  return projetos.map((projeto) => {
    const minhas = equipes.filter((equipe) => String(equipe.projetoId) === projeto._id.toString());
    return {
      ...projetoResumo(projeto, hoje),
      metaDiariaPadraoCents: projeto.metaDiariaPadraoCents,
      metaTotalCents: projeto.metaTotalCents,
      metasPrograma: projeto.metasPrograma ?? [],
      regraNovaMeta: projeto.regraNovaMeta,
      equipes: minhas.length,
      membros: new Set(minhas.flatMap((equipe) => equipe.membroIds.map(String))).size,
    };
  });
}

type Validated = { ok: true; value: Record<string, unknown> } | { ok: false; response: NextResponse };

export function validateProject(body: Partial<ProjetoBody>, current: ProjetoDoc | null): Validated {
  const set: Record<string, unknown> = {};

  if (body.nome !== undefined || !current) {
    const nome = textField(body.nome, 80);
    if (nome.length < 2) {
      return { ok: false, response: jsonError("Nome do projeto obrigatório", 400, { code: "NAME_REQUIRED" }) };
    }
    set.nome = nome;
  }
  if (body.tipo !== undefined || !current) {
    if (!PROJETO_TIPOS.includes(body.tipo as never)) {
      return { ok: false, response: jsonError("Tipo inválido", 400, { code: "INVALID_TYPE" }) };
    }
    set.tipo = body.tipo;
  }
  const inicio = body.inicio ?? current?.inicio;
  const fim = body.fim ?? current?.fim;
  if (!isIsoDay(inicio) || !isIsoDay(fim) || inicio > fim) {
    return {
      ok: false,
      response: jsonError("Período inválido: confira início e fim", 400, { code: "INVALID_PERIOD" }),
    };
  }
  set.inicio = inicio;
  set.fim = fim;

  if (body.ativo !== undefined) set.ativo = Boolean(body.ativo);
  if (body.moeda !== undefined) set.moeda = textField(body.moeda, 3).toUpperCase() || "BRL";
  if (body.diasDescanso !== undefined) {
    if (!Array.isArray(body.diasDescanso) || body.diasDescanso.some((dia) => !isIsoDay(dia))) {
      return { ok: false, response: jsonError("Dias de descanso inválidos", 400, { code: "INVALID_REST_DAYS" }) };
    }
    set.diasDescanso = [...new Set(body.diasDescanso)].sort();
  }
  if (body.metaDiariaPadraoCents !== undefined) set.metaDiariaPadraoCents = intField(body.metaDiariaPadraoCents);
  if (body.metaTotalCents !== undefined) set.metaTotalCents = intField(body.metaTotalCents);
  if (body.metasPrograma !== undefined) {
    if (
      !Array.isArray(body.metasPrograma) ||
      body.metasPrograma.some((item) => !HJ_PROGRAMAS.includes(item?.programa))
    ) {
      return { ok: false, response: jsonError("Metas por programa inválidas", 400, { code: "INVALID_PROGRAM_GOALS" }) };
    }
    set.metasPrograma = body.metasPrograma.map((item) => ({
      programa: item.programa,
      metaCents: intField(item.metaCents),
    }));
  }
  if (body.regraNovaMeta !== undefined) {
    const base = current?.regraNovaMeta ?? { fator: 1.3, arredondarCents: 5000, minimoCents: 30000 };
    const fator = Number(body.regraNovaMeta.fator ?? base.fator);
    if (!Number.isFinite(fator) || fator < 1 || fator > 3) {
      return {
        ok: false,
        response: jsonError("Fator da nova meta deve ficar entre 1 e 3", 400, { code: "INVALID_FACTOR" }),
      };
    }
    set.regraNovaMeta = {
      fator,
      arredondarCents: intField(body.regraNovaMeta.arredondarCents, base.arredondarCents) || base.arredondarCents,
      minimoCents: intField(body.regraNovaMeta.minimoCents, base.minimoCents),
    };
  }

  return { ok: true, value: set };
}
