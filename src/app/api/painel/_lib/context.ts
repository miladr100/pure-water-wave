import { NextResponse } from "next/server";

import { jsonError, withDb } from "@/lib/academy/http";
import { requireAcademySession } from "@/lib/academy/require-session";
import { loadContext, type PanelContext } from "@/lib/hj/data";

// Every panel route starts the same way: a signed-in academy account, a
// database, and the person's place in the panel.
export async function panelContext(): Promise<
  { ok: true; context: PanelContext } | { ok: false; response: NextResponse }
> {
  const session = await requireAcademySession();
  if (!session) {
    return { ok: false, response: jsonError("Não autorizado", 401) };
  }

  const dbError = await withDb();
  if (dbError) {
    return { ok: false, response: dbError };
  }

  const context = await loadContext(session);
  if (!context) {
    return { ok: false, response: jsonError("Conta não encontrada", 404) };
  }

  return { ok: true, context };
}

export async function followerContext() {
  const result = await panelContext();
  if (!result.ok) {
    return result;
  }
  const { papeis } = result.context;
  if (!papeis.capitao && !papeis.educador && !papeis.administrador) {
    return { ok: false as const, response: jsonError("Não encontrado", 404) };
  }
  return result;
}

export async function educatorContext() {
  const result = await panelContext();
  if (!result.ok) {
    return result;
  }
  if (!result.context.papeis.educador) {
    return { ok: false as const, response: jsonError("Não encontrado", 404) };
  }
  return result;
}

export async function adminContext() {
  const result = await panelContext();
  if (!result.ok) {
    return result;
  }
  if (!result.context.papeis.administrador) {
    return { ok: false as const, response: jsonError("Não encontrado", 404) };
  }
  return result;
}

export const intField = (value: unknown, fallback = 0) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : fallback;
};

export const textField = (value: unknown, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
