import { jsonError, serverError } from "@/lib/academy/http";
import { guardarComprovante } from "@/lib/hj/contabilidade-server";

import { contabContext, falhaResponse, ok } from "../_lib";

// POST (multipart: arquivo, livroId) — keeps the photo or PDF of a receipt
// and answers its id, which the movement then carries.
export async function POST(request: Request) {
  try {
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    const form = await request.formData().catch(() => null);
    const arquivo = form?.get("arquivo");
    const livroId = String(form?.get("livroId") ?? "");
    if (!result.livros.some((livro) => livro.id === livroId)) {
      return jsonError("Escolha uma contabilidade que você pode ver", 403, { code: "BOOK_NOT_ALLOWED" });
    }
    if (!(arquivo instanceof Blob)) {
      return jsonError("Envie um arquivo", 400, { code: "FILE_REQUIRED" });
    }
    const nome = arquivo instanceof File ? arquivo.name : "comprovante";
    const salvo = await guardarComprovante({ livroId, nome, bytes: Buffer.from(await arquivo.arrayBuffer()), autorId: result.context.user._id });
    if ("ok" in salvo) {
      return falhaResponse(salvo);
    }
    return ok({ comprovante: salvo }, 201);
  } catch (error) {
    return serverError("Erro ao guardar comprovante", error, "Não foi possível guardar o comprovante");
  }
}
