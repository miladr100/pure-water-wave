import { NextResponse } from "next/server";

import { serverError } from "@/lib/academy/http";
import {
  equipeLookup,
  equipeResumo,
  guestsOf,
  projetoResumo,
  relatorioRow,
  reportsOf,
  rmResumo,
  usersById,
  convidadoRow,
} from "@/lib/hj/data";
import type { PainelInicio } from "@/lib/hj/types";

import { panelContext } from "../_lib/context";

// The member's home: today's report (or its absence), the goal and the
// last seven days, the team's day for a captain, and the guests that need
// attention.
export async function GET() {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const { user, hoje, projeto, equipe, papeis } = context;

    const users = await usersById([
      user._id,
      ...(equipe ? [equipe.capitaoId, equipe.educadorId].filter((id): id is NonNullable<typeof id> => id != null) : []),
    ]);
    const equipes = new Map(equipe ? [[equipe._id.toString(), equipe]] : []);

    let rm: PainelInicio["rm"] = null;
    let relatorioHoje: PainelInicio["hoje"]["relatorio"] = null;
    let equipeHoje: PainelInicio["equipeHoje"] = null;
    let devolvidos: PainelInicio["devolvidos"] = [];

    if (projeto) {
      const meus = await reportsOf(projeto._id, { membroId: user._id });
      rm = rmResumo(projeto, meus, hoje);
      const today = meus.find((item) => item.data === hoje);
      relatorioHoje = today ? relatorioRow(today, users, equipes) : null;
      devolvidos = meus
        .filter((item) => item.estado === "devolvido" && item.data !== hoje)
        .map((item) => relatorioRow(item, users, equipes));

      if (equipe && papeis.capitao) {
        const daEquipe = await reportsOf(projeto._id, { equipeId: equipe._id, data: hoje });
        const pendentes = await reportsOf(projeto._id, { equipeId: equipe._id, estado: "enviado" });
        equipeHoje = {
          enviados: daEquipe.filter((item) => item.estado !== "devolvido").length,
          total: equipe.membroIds.length,
          liquidoCents: daEquipe
            .filter((item) => item.estado !== "devolvido")
            .reduce((sum, item) => sum + item.liquidoCents, 0),
          pendentes: pendentes.length,
        };
      }
    }

    const guests = await guestsOf([user._id.toString()]);
    const lookup = equipeLookup(equipe ? [equipe] : []);
    const rows = guests.map((guest) => convidadoRow(guest, users, lookup, hoje));

    const body: PainelInicio = {
      membro: { id: user._id.toString(), nome: user.fullName, papeis },
      projeto: projeto ? projetoResumo(projeto, hoje) : null,
      equipe: equipe ? equipeResumo(equipe, users) : null,
      hoje: {
        data: hoje,
        descanso: Boolean(projeto?.diasDescanso?.includes(hoje)),
        relatorio: relatorioHoje,
      },
      devolvidos,
      rm,
      equipeHoje,
      testemunho: {
        total: rows.length,
        atencao: rows
          .filter((row) => row.alerta)
          .map((row) => ({ id: row.id, nome: row.nome, alerta: row.alerta! })),
      },
    };

    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar o painel", error, "Não foi possível carregar o painel");
  }
}
