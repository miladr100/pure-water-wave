import { jsonError, serverError } from "@/lib/academy/http";
import { movimentoGuardado, movimentosDosLivros } from "@/lib/hj/contabilidade-server";
import { HjContabMovimento } from "@/models/hj-contab-movimento";

import { contabContext, ok } from "../../../_lib";

// POST — undo a delete.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    const atual = await movimentoGuardado(id, result.livros.map((livro) => livro.id));
    if (!atual) {
      return jsonError("Movimento não encontrado", 404);
    }
    await HjContabMovimento.updateOne({ _id: atual._id }, { $set: { removidoEm: null, removidoPorId: null } });
    const movimento = (await movimentosDosLivros([atual.livroId])).find((mov) => mov.id === id) ?? null;
    return ok({ movimento });
  } catch (error) {
    return serverError("Erro ao restaurar movimento", error, "Não foi possível desfazer");
  }
}
