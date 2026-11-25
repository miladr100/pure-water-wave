import { NextResponse } from "next/server";

import { jsonError } from "@/lib/academy/http";
import { lerConfig, livrosPermitidos, type Falha } from "@/lib/hj/contabilidade-server";

import { panelContext } from "../_lib/context";

// Every Contabilidade route: a signed-in account, the books it may touch and
// the settings. A person with no book gets a 404, as for any panel screen
// that is not theirs.
export async function contabContext() {
  const result = await panelContext();
  if (!result.ok) {
    return result;
  }
  const livros = await livrosPermitidos(result.context);
  if (!livros.length) {
    return { ok: false as const, response: jsonError("Não encontrado", 404) };
  }
  const config = await lerConfig();
  return { ok: true as const, context: result.context, livros, config };
}

export const falhaResponse = (falha: Falha) => jsonError(falha.error, falha.status, { code: falha.code });

export const ok = (body: unknown, status = 200) => NextResponse.json(body, { status });
