import { NextResponse } from "next/server";

import { jsonError } from "@/lib/academy/http";
import { isHttpUrl, youtubeIdFrom, type BibliotecaItemBody } from "@/lib/biblioteca/itens";
import { isUserLanguage } from "@/lib/user-languages";
import { BIBLIOTECA_TIPOS } from "@/models/biblioteca-item";

import { intField, textField } from "../../hj/_lib/shared";

type Validated = { ok: true; value: Record<string, unknown> } | { ok: false; response: NextResponse };

// Shared by POST and PATCH: on a create every required field must come;
// on an edit only what is sent changes.
export function validateItem(body: Partial<BibliotecaItemBody>, creating: boolean): Validated {
  const set: Record<string, unknown> = {};

  if (body.tipo !== undefined || creating) {
    if (!BIBLIOTECA_TIPOS.includes(body.tipo as never)) {
      return { ok: false, response: jsonError("Tipo inválido", 400, { code: "INVALID_TYPE" }) };
    }
    set.tipo = body.tipo;
  }
  if (body.titulo !== undefined || creating) {
    const titulo = textField(body.titulo, 160);
    if (titulo.length < 2) {
      return { ok: false, response: jsonError("Título obrigatório", 400, { code: "TITLE_REQUIRED" }) };
    }
    set.titulo = titulo;
  }
  if (body.url !== undefined || creating) {
    if (!isHttpUrl(body.url)) {
      return { ok: false, response: jsonError("Informe um link começando com https://", 400, { code: "INVALID_URL" }) };
    }
    set.url = body.url.trim();
    set.youtubeId = youtubeIdFrom(set.url as string);
  }
  if (body.subtitulo !== undefined) set.subtitulo = textField(body.subtitulo, 200);
  if (body.idioma !== undefined) {
    if (!isUserLanguage(body.idioma)) {
      return { ok: false, response: jsonError("Idioma inválido", 400, { code: "INVALID_LANGUAGE" }) };
    }
    set.idioma = body.idioma;
  }
  if (body.thumbnailUrl !== undefined) {
    const thumb: string = textField(body.thumbnailUrl, 500);
    const thumbOk = thumb === "" || thumb.startsWith("/") || isHttpUrl(thumb);
    if (!thumbOk) {
      return { ok: false, response: jsonError("Link da miniatura inválido", 400, { code: "INVALID_THUMBNAIL" }) };
    }
    set.thumbnailUrl = thumb;
  }
  if (body.publicado !== undefined) set.publicado = Boolean(body.publicado);
  if (body.ordem !== undefined) set.ordem = intField(body.ordem);

  if (Object.keys(set).length === 0) {
    return { ok: false, response: jsonError("Nada para alterar", 400, { code: "EMPTY" }) };
  }
  return { ok: true, value: set };
}
