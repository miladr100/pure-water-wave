import { NextResponse } from "next/server";

import { appUrlFor, importAccounts } from "@/lib/academy/accounts";
import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";
import type { AdminImportRowInput } from "@/lib/academy/types";

const MAX_ROWS = 500;

export async function POST(request: Request) {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const body = (await request.json().catch(() => ({}))) as { rows?: unknown };
    const rows = Array.isArray(body.rows) ? (body.rows as AdminImportRowInput[]) : null;

    if (!rows || rows.length === 0) {
      return jsonError("Envie pelo menos uma linha", 400, { code: "validation" });
    }
    if (rows.length > MAX_ROWS) {
      return jsonError(`Envie no máximo ${MAX_ROWS} linhas por vez`, 400, { code: "validation" });
    }
    if (rows.some((row) => typeof row !== "object" || row === null)) {
      return jsonError("Linhas inválidas", 400, { code: "validation" });
    }

    const result = await importAccounts(rows, { appUrl: appUrlFor(request) });
    return NextResponse.json(result);
  } catch (error) {
    return serverError("Erro ao importar contas", error, "Não foi possível importar as contas");
  }
}
