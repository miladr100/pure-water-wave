import { NextResponse } from "next/server";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import {
  isPhotoContentType,
  normalizePhotoContentType,
  PHOTO_MAX_BYTES,
  removePhoto,
  storePhoto,
} from "@/lib/academy/photo";
import { photoUrlOf } from "@/lib/academy/profile";
import { requireAcademySession } from "@/lib/academy/require-session";
import { AcademyUser } from "@/models/academy-user";

// The browser crops the photo to 512×512 and sends the raw JPEG as the body
// (no multipart): the whole request is the image.
export async function POST(request: Request) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const contentType = request.headers.get("content-type");
    if (!isPhotoContentType(contentType)) {
      return jsonError("Envie uma imagem JPEG, PNG ou WebP", 415, { code: "unsupported_type" });
    }

    // The declared length is checked first so an oversized upload is refused
    // before its bytes are read into memory.
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > PHOTO_MAX_BYTES) {
      return jsonError("A imagem deve ter no máximo 4 MB", 413, { code: "too_large" });
    }

    const bytes = await request.arrayBuffer();
    if (bytes.byteLength === 0) {
      return jsonError("A imagem está vazia", 400, { code: "empty" });
    }
    if (bytes.byteLength > PHOTO_MAX_BYTES) {
      return jsonError("A imagem deve ter no máximo 4 MB", 413, { code: "too_large" });
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    if (!(await AcademyUser.exists({ _id: session.userId }))) {
      return jsonError("Usuário não encontrado", 404, { code: "user_not_found" });
    }

    const photoUpdatedAt = await storePhoto(session.userId, bytes, normalizePhotoContentType(contentType));

    return NextResponse.json({ photoUrl: photoUrlOf({ _id: session.userId, photoUpdatedAt }) });
  } catch (error) {
    return serverError("Erro ao salvar a foto", error, "Não foi possível salvar a foto");
  }
}

export async function DELETE() {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    await removePhoto(session.userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("Erro ao remover a foto", error, "Não foi possível remover a foto");
  }
}
