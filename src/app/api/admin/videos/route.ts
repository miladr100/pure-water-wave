import { NextResponse } from "next/server";

import { bunnyUploadConfigured, listLibraryVideos } from "@/lib/academy/bunny";
import { jsonError, serverError } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";

// The Bunny library as the lesson dialog's picker sees it. Educators only;
// the API key stays on the server.
export async function GET() {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    if (!bunnyUploadConfigured()) {
      return jsonError("Bunny Stream não está configurado", 503, { code: "bunny_not_configured" });
    }

    return NextResponse.json({ videos: await listLibraryVideos() });
  } catch (error) {
    return serverError("Erro ao listar vídeos", error, "Não foi possível listar os vídeos da biblioteca");
  }
}
