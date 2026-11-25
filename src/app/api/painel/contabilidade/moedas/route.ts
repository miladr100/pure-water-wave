import { jsonError, serverError } from "@/lib/academy/http";
import { MOEDAS, type Moeda } from "@/lib/hj/contabilidade";
import { HjContabConfig } from "@/models/hj-contab-config";

import { contabContext, ok } from "../_lib";

// PUT {livroId, moedas} — the currencies a book switched on by hand.
export async function PUT(request: Request) {
  try {
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as { livroId?: unknown; moedas?: unknown };
    const livroId = typeof body.livroId === "string" ? body.livroId : "";
    if (!result.livros.some((livro) => livro.id === livroId)) {
      return jsonError("Escolha uma contabilidade que você pode ver", 403, { code: "BOOK_NOT_ALLOWED" });
    }
    const moedas = Array.isArray(body.moedas)
      ? [...new Set(body.moedas.filter((moeda): moeda is Moeda => typeof moeda === "string" && Object.hasOwn(MOEDAS, moeda) && moeda !== "BRL"))]
      : [];
    await HjContabConfig.updateOne({ _id: "contabilidade" }, { $set: { [`moedas.${livroId}`]: moedas } }, { upsert: true });
    return ok({ livroId, moedas });
  } catch (error) {
    return serverError("Erro ao salvar moedas", error, "Não foi possível salvar as moedas");
  }
}
