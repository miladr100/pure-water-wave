import { NextResponse } from "next/server";

import { AccountExistsError, appUrlFor, createAccount, validateAccountInput } from "@/lib/academy/accounts";
import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";
import type { AdminCreateAccountBody } from "@/lib/academy/types";

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

    const body = (await request.json().catch(() => ({}))) as AdminCreateAccountBody;
    const validated = validateAccountInput(body);
    if (!validated.ok) {
      return jsonError("Verifique os campos destacados", 400, {
        code: "validation",
        fields: validated.fields,
      });
    }

    const result = await createAccount(validated.value, { appUrl: appUrlFor(request) });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AccountExistsError) {
      return jsonError(error.message, 409, {
        code: error.field === "phone" ? "PHONE_IN_USE" : "EMAIL_IN_USE",
      });
    }
    return serverError("Erro ao criar conta", error, "Não foi possível criar a conta");
  }
}
