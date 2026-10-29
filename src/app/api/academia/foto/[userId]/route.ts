import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import { loadPhoto } from "@/lib/academy/photo";
import { requireAcademySession } from "@/lib/academy/require-session";

type Params = { params: Promise<{ userId: string }> };

// Any signed-in academy user can see any photo: a student sees their tutor's,
// a tutor sees their students'. The URL carries `?v=<upload time>`, so the
// bytes are cached for a year and a new photo simply gets a new URL.
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const { userId } = await params;
    if (!isObjectId(userId)) {
      return jsonError("Foto não encontrada", 404, { code: "photo_not_found" });
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const photo = await loadPhoto(userId);
    if (!photo) {
      return jsonError("Foto não encontrada", 404, { code: "photo_not_found" });
    }

    const etag = `"${photo.updatedAt.getTime()}"`;
    const headers = {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      ETag: etag,
    };

    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    // Copied into a fresh ArrayBuffer-backed view: a Buffer may be a slice
    // of a shared pool, which the Response body type does not accept.
    const body = new Uint8Array(photo.data.byteLength);
    body.set(photo.data);

    return new NextResponse(body, { headers: { ...headers, "Content-Length": String(body.byteLength) } });
  } catch (error) {
    return serverError("Erro ao carregar a foto", error, "Não foi possível carregar a foto");
  }
}
