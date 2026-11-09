import { NextResponse } from "next/server";

import { serverError } from "@/lib/academy/http";
import { isIsoDay } from "@/lib/hj/dates";
import { canValidate, projetoResumo, relatorioRow, reportsOf, usersById, type EquipeDoc } from "@/lib/hj/data";
import { RELATORIO_ESTADOS, type RelatorioEstado, type RelatorioRow } from "@/lib/hj/types";
import { HjEquipe } from "@/models/hj-equipe";

import { educatorContext, projectFor } from "../_lib/shared";

// The day's reports across the project (`?data=`, today by default), or
// every report in one state (`?estado=enviado` for what waits). Each row
// says whether this person may validate it.
export async function GET(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const params = new URL(request.url).searchParams;
    const projeto = await projectFor(context, params.get("projeto"));
    if (!projeto) {
      return NextResponse.json({ projeto: null, relatorios: [], podeValidar: {} });
    }

    const estadoParam = params.get("estado");
    const estado = RELATORIO_ESTADOS.includes(estadoParam as RelatorioEstado) ? (estadoParam as RelatorioEstado) : null;
    const dataParam = params.get("data");
    const data = isIsoDay(dataParam) ? dataParam : estado ? null : context.hoje;

    const filter: Record<string, unknown> = {};
    if (data) filter.data = data;
    if (estado) filter.estado = estado;

    const relatorios = await reportsOf(projeto._id, filter);
    const equipes = (await HjEquipe.find({ projetoId: projeto._id }).lean()) as EquipeDoc[];
    const byId = new Map(equipes.map((equipe) => [equipe._id.toString(), equipe]));
    const users = await usersById([
      ...relatorios.map((item) => item.membroId),
      ...relatorios.map((item) => item.validadoPorId).filter((id): id is NonNullable<typeof id> => id != null),
    ]);

    const rows: RelatorioRow[] = relatorios
      .sort((a, b) => b.data.localeCompare(a.data) || a.equipeId.toString().localeCompare(b.equipeId.toString()))
      .map((item) => relatorioRow(item, users, byId));
    const podeValidar = Object.fromEntries(
      rows.map((row) => {
        const equipe = byId.get(row.equipe.id);
        return [row.id, Boolean(equipe && canValidate(context, equipe, row.membro.id))];
      }),
    );

    return NextResponse.json({ projeto: projetoResumo(projeto, context.hoje), data, estado, relatorios: rows, podeValidar });
  } catch (error) {
    return serverError("Erro ao listar relatórios", error, "Não foi possível carregar os relatórios");
  }
}
