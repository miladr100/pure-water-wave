import { NextResponse } from "next/server";

import { jsonError, serverError } from "@/lib/academy/http";
import { media, novaMeta } from "@/lib/hj/rm";
import {
  countsAsResult,
  equipeResumo,
  projetoResumo,
  relatorioRow,
  reportsOf,
  sameId,
  usersById,
} from "@/lib/hj/data";
import type { EquipePainel } from "@/lib/hj/types";

import { panelContext } from "../_lib/context";

// The captain's view of their team: who sent today, what waits for
// validation, and each member's numbers in the project.
export async function GET() {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { user, hoje, projeto, equipe, papeis } = result.context;

    if (!projeto || !equipe) {
      return jsonError("Você não está em uma equipe do projeto ativo", 404, { code: "NO_TEAM" });
    }
    if (!papeis.capitao && !papeis.educador && !papeis.administrador) {
      return jsonError("A página da equipe é da capitã ou do capitão", 404, { code: "NOT_CAPTAIN" });
    }

    const relatorios = await reportsOf(projeto._id, { equipeId: equipe._id });
    const users = await usersById([
      ...equipe.membroIds,
      user._id,
      ...[equipe.capitaoId, equipe.educadorId].filter((id): id is NonNullable<typeof id> => id != null),
      ...relatorios.map((item) => item.validadoPorId).filter((id): id is NonNullable<typeof id> => id != null),
    ]);
    const equipes = new Map([[equipe._id.toString(), equipe]]);

    const membros = equipe.membroIds.map((membroId) => {
      const meus = relatorios.filter((item) => sameId(item.membroId, membroId) && countsAsResult(item.estado));
      const valores = meus.map((item) => item.liquidoCents);
      const hojeDoc = relatorios.find((item) => sameId(item.membroId, membroId) && item.data === hoje);
      const mediaCents = media(valores);
      return {
        id: String(membroId),
        nome: users.get(String(membroId))?.fullName ?? "—",
        capitao: sameId(equipe.capitaoId, membroId),
        hoje: hojeDoc ? relatorioRow(hojeDoc, users, equipes) : null,
        totalCents: valores.reduce((sum, value) => sum + value, 0),
        mediaCents,
        metaCents: novaMeta(mediaCents, projeto.regraNovaMeta, projeto.metaDiariaPadraoCents, valores.length),
      };
    });
    membros.sort((a, b) => Number(b.capitao) - Number(a.capitao) || a.nome.localeCompare(b.nome, "pt"));

    const body: EquipePainel = {
      equipe: equipeResumo(equipe, users),
      projeto: projetoResumo(projeto, hoje),
      hoje,
      totalHojeCents: relatorios
        .filter((item) => item.data === hoje && countsAsResult(item.estado))
        .reduce((sum, item) => sum + item.liquidoCents, 0),
      membros,
      pendentes: relatorios
        .filter((item) => item.estado === "enviado")
        .sort((a, b) => b.data.localeCompare(a.data))
        .map((item) => relatorioRow(item, users, equipes)),
      historico: [...relatorios]
        .sort((a, b) => b.data.localeCompare(a.data) || b.enviadoEm.getTime() - a.enviadoEm.getTime())
        .slice(0, 60)
        .map((item) => relatorioRow(item, users, equipes)),
    };

    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar a equipe", error, "Não foi possível carregar a equipe");
  }
}
