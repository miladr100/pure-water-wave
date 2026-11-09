import { NextResponse } from "next/server";

import { serverError } from "@/lib/academy/http";
import { projetoResumo } from "@/lib/hj/data";
import { HJ_PROGRAMAS, type AdminResultados, type HjPrograma } from "@/lib/hj/types";

import { allProjects, buildGrid, educatorContext, metaTotal, porPrograma, projectFor } from "../_lib/shared";

// The results grid (member × day) with the spreadsheet's totals, filtered
// by program, team, educator or name. Totals follow the filter.
export async function GET(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const params = new URL(request.url).searchParams;
    const projeto = await projectFor(context, params.get("projeto"));
    const projetos = (await allProjects()).map((item) => ({ id: item._id.toString(), nome: item.nome }));

    if (!projeto) {
      const empty: AdminResultados = {
        projeto: null,
        dias: [],
        linhas: [],
        totais: { porDia: {}, dinheiroCents: 0, pixCents: 0, despesasCents: 0, liquidoCents: 0, metaCents: 0 },
        programas: [],
        filtros: { projetos, programas: [...HJ_PROGRAMAS], equipes: [], educadores: [] },
      };
      return NextResponse.json(empty);
    }

    const grid = await buildGrid(projeto);
    const programa = params.get("programa");
    const equipe = params.get("equipe");
    const educador = params.get("educador");
    const busca = params.get("busca")?.trim().toLowerCase() ?? "";

    const linhas = grid.linhas.filter(
      (linha) =>
        (!programa || linha.equipe.programa === programa) &&
        (!equipe || linha.equipe.id === equipe) &&
        (!educador || linha.educador?.id === educador) &&
        (!busca || linha.membro.nome.toLowerCase().includes(busca)),
    );
    const membros = new Set(linhas.map((linha) => linha.membro.id));
    const relatorios = grid.relatorios.filter((item) => membros.has(String(item.membroId)) && item.estado !== "devolvido");

    const porDia: Record<string, number> = {};
    for (const item of relatorios) {
      porDia[item.data] = (porDia[item.data] ?? 0) + item.liquidoCents;
    }

    const educadores = new Map<string, string>();
    for (const team of grid.equipes) {
      const doc = team.educadorId ? grid.users.get(String(team.educadorId)) : null;
      if (doc) {
        educadores.set(doc._id.toString(), doc.fullName);
      }
    }

    const body: AdminResultados = {
      projeto: projetoResumo(projeto, context.hoje),
      dias: grid.dias,
      linhas,
      totais: {
        porDia,
        dinheiroCents: relatorios.reduce((sum, item) => sum + item.dinheiroCents, 0),
        pixCents: relatorios.reduce((sum, item) => sum + item.pixCents, 0),
        despesasCents: relatorios.reduce((sum, item) => sum + item.despesasCents, 0),
        liquidoCents: relatorios.reduce((sum, item) => sum + item.liquidoCents, 0),
        metaCents: metaTotal(projeto),
      },
      programas: porPrograma(grid),
      filtros: {
        projetos,
        programas: [...new Set(grid.equipes.map((team) => team.programa))].sort() as HjPrograma[],
        equipes: grid.equipes
          .map((team) => ({ id: team._id.toString(), nome: team.nome, programa: team.programa }))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt")),
        educadores: [...educadores.entries()]
          .map(([id, nome]) => ({ id, nome }))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt")),
      },
    };
    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar resultados", error, "Não foi possível carregar os resultados");
  }
}
