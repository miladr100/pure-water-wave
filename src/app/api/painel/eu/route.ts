import { NextResponse } from "next/server";

import { serverError } from "@/lib/academy/http";
import { equipeResumo, projetoResumo, usersById } from "@/lib/hj/data";
import type { EquipeResumo, Papeis, ProjetoResumo } from "@/lib/hj/types";

import { panelContext } from "../_lib/context";

export type PainelEu = {
  id: string;
  nome: string;
  papeis: Papeis;
  projeto: ProjetoResumo | null;
  equipe: EquipeResumo | null;
};

// Who the person is in the panel, for the shell: which areas to offer and
// what the header says. Small on purpose; the screens load their own data.
export async function GET() {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { user, hoje, projeto, equipe, papeis } = result.context;
    const users = equipe
      ? await usersById([equipe.capitaoId, equipe.educadorId].filter((id): id is NonNullable<typeof id> => id != null))
      : new Map();
    const body: PainelEu = {
      id: user._id.toString(),
      nome: user.fullName,
      papeis,
      projeto: projeto ? projetoResumo(projeto, hoje) : null,
      equipe: equipe ? equipeResumo(equipe, users) : null,
    };
    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao identificar a pessoa no painel", error, "Não foi possível carregar o painel");
  }
}
