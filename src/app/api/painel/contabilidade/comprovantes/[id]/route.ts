import { Types } from "mongoose";

import { jsonError, serverError } from "@/lib/academy/http";
import { HjContabComprovante } from "@/models/hj-contab-comprovante";

import { contabContext } from "../../_lib";

// GET — the receipt itself, for whoever sees its book.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    if (!Types.ObjectId.isValid(id)) {
      return jsonError("Comprovante não encontrado", 404);
    }
    const doc = await HjContabComprovante.findById(id).lean();
    if (!doc || !result.livros.some((livro) => livro.id === doc.livroId)) {
      return jsonError("Comprovante não encontrado", 404);
    }
    const nome = encodeURIComponent(doc.nome ?? "comprovante");
    // .lean() hands back the driver's Binary, not a Buffer
    const raw = doc.dados as unknown as Buffer | { buffer: Uint8Array };
    const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw.buffer);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.mime,
        "Content-Disposition": `inline; filename*=UTF-8''${nome}`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return serverError("Erro ao abrir comprovante", error, "Não foi possível abrir o comprovante");
  }
}
