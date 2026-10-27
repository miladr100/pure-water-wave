import { NextResponse } from "next/server";

import { bunnyUploadConfigured, getVideo } from "@/lib/academy/bunny";
import { jsonError, serverError } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";

type Params = { params: Promise<{ guid: string }> };

const GUID = /^[0-9a-f-]{32,36}$/i;

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    if (!bunnyUploadConfigured()) {
      return jsonError("Bunny Stream não está configurado", 503, { code: "bunny_not_configured" });
    }

    const { guid } = await params;
    if (!GUID.test(guid)) {
      return jsonError("Vídeo não encontrado", 404);
    }

    return NextResponse.json(await getVideo(guid));
  } catch (error) {
    return serverError("Erro ao consultar vídeo", error, "Não foi possível consultar o vídeo");
  }
}
