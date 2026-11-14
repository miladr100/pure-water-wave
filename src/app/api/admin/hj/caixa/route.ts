import { NextResponse } from "next/server";

import { serverError } from "@/lib/academy/http";
import { resumoDasEquipes, testemunhoTeamsOf } from "@/lib/hj/caixa";
import { activeProject, projetoResumo } from "@/lib/hj/data";
import type { CaixaResumo } from "@/lib/hj/types";

import { educatorContext } from "../_lib/shared";

// GET: every team's cash box at a glance — balance, in, out, last
// movement — for the educator's Testemunho › Caixa.
export async function GET() {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const projeto = await activeProject("testemunho");
    const equipes = await testemunhoTeamsOf(projeto, context.projeto);
    const rows = await resumoDasEquipes(equipes);
    const body: CaixaResumo = {
      projeto: projeto ? projetoResumo(projeto, context.hoje) : null,
      equipes: rows,
      totais: {
        saldoCents: rows.reduce((sum, row) => sum + row.saldoCents, 0),
        entradasCents: rows.reduce((sum, row) => sum + row.entradasCents, 0),
        saidasCents: rows.reduce((sum, row) => sum + row.saidasCents, 0),
      },
    };
    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar os caixas", error, "Não foi possível carregar os caixas");
  }
}
