import { NextResponse } from "next/server";

import { serverError } from "@/lib/academy/http";
import { convidadoRow, equipeLookup, guestsOf, projetoResumo, ref, sameId } from "@/lib/hj/data";
import { CONVIDADO_ETAPAS, type AdminHjInicio, type ConvidadoEtapa } from "@/lib/hj/types";

import { buildGrid, educatorContext, metaTotal, porPrograma, projectFor } from "../_lib/shared";

// The educator's and administrator's home: the project today, by program,
// by team, and the testimony picture across the teams in scope.
export async function GET(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const projeto = await projectFor(context, new URL(request.url).searchParams.get("projeto"));

    const porEtapa = Object.fromEntries(CONVIDADO_ETAPAS.map((etapa) => [etapa, 0])) as Record<ConvidadoEtapa, number>;
    const empty: AdminHjInicio = {
      projeto: null,
      totais: { liquidoCents: 0, metaCents: 0, membros: 0, equipes: 0, enviadosHoje: 0, pendentesValidacao: 0, devolvidos: 0 },
      programas: [],
      equipes: [],
      testemunho: { convidados: 0, porEtapa, alertas: 0 },
    };

    if (!projeto) {
      return NextResponse.json(empty);
    }

    const grid = await buildGrid(projeto);
    const hoje = context.hoje;
    const deHoje = grid.relatorios.filter((item) => item.data === hoje);

    const equipes = grid.equipes.map((equipe) => {
      const linhas = grid.linhas.filter((linha) => linha.equipe.id === equipe._id.toString());
      const hojeDaEquipe = deHoje.filter((item) => sameId(item.equipeId, equipe._id) && item.estado !== "devolvido");
      return {
        id: equipe._id.toString(),
        nome: equipe.nome,
        programa: equipe.programa,
        educador: ref(equipe.educadorId ? grid.users.get(String(equipe.educadorId)) : null),
        capitao: ref(equipe.capitaoId ? grid.users.get(String(equipe.capitaoId)) : null),
        membros: equipe.membroIds.length,
        enviadosHoje: hojeDaEquipe.length,
        liquidoHojeCents: hojeDaEquipe.reduce((sum, item) => sum + item.liquidoCents, 0),
        liquidoCents: linhas.reduce((sum, linha) => sum + linha.totalCents, 0),
      };
    });
    equipes.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));

    const memberIds = new Set(grid.equipes.flatMap((equipe) => equipe.membroIds.map(String)));
    const guests = await guestsOf(memberIds);
    const rows = guests.map((guest) => convidadoRow(guest, grid.users, equipeLookup(grid.equipes), hoje));
    for (const row of rows) {
      porEtapa[row.etapa] += 1;
    }

    const body: AdminHjInicio = {
      projeto: projetoResumo(projeto, hoje),
      totais: {
        liquidoCents: grid.linhas.reduce((sum, linha) => sum + linha.totalCents, 0),
        metaCents: metaTotal(projeto),
        membros: grid.linhas.length,
        equipes: grid.equipes.length,
        enviadosHoje: deHoje.filter((item) => item.estado !== "devolvido").length,
        pendentesValidacao: grid.relatorios.filter((item) => item.estado === "enviado").length,
        devolvidos: grid.relatorios.filter((item) => item.estado === "devolvido").length,
      },
      programas: porPrograma(grid),
      equipes,
      testemunho: { convidados: rows.length, porEtapa, alertas: rows.filter((row) => row.alerta).length },
    };

    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar a administração", error, "Não foi possível carregar a administração");
  }
}
