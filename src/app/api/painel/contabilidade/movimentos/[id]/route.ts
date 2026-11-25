import { jsonError, serverError } from "@/lib/academy/http";
import { atualizarMovimento, ehDoRelatorio, movimentoGuardado, validarMovimento } from "@/lib/hj/contabilidade-server";
import { HjContabMovimento } from "@/models/hj-contab-movimento";

import { contabContext, falhaResponse, ok } from "../../_lib";

type Params = { params: Promise<{ id: string }> };

const doRelatorio = () =>
  jsonError("Isto veio de um relatório de RM validado. Para mudar, devolva o relatório.", 409, { code: "FROM_REPORT" });

// PATCH — edit a stored movement. What came from an RM report changes there.
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    if (ehDoRelatorio(id)) {
      return doRelatorio();
    }
    const ids = result.livros.map((livro) => livro.id);
    const atual = await movimentoGuardado(id, ids);
    if (!atual || atual.removidoEm) {
      return jsonError("Movimento não encontrado", 404);
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const validado = await validarMovimento(
      { projetoId: atual.livroId, ...body },
      { livros: result.livros, categorias: result.config.categorias, hoje: result.context.hoje, responsavelPadrao: result.context.user.fullName },
    );
    if (!validado.ok) {
      return falhaResponse(validado);
    }
    const movimento = await atualizarMovimento(id, validado.value);
    return movimento ? ok({ movimento }) : jsonError("Movimento não encontrado", 404);
  } catch (error) {
    return serverError("Erro ao editar movimento", error, "Não foi possível salvar o movimento");
  }
}

// DELETE — the movement leaves the books; "Desfazer" brings it back.
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    if (ehDoRelatorio(id)) {
      return doRelatorio();
    }
    const atual = await movimentoGuardado(id, result.livros.map((livro) => livro.id));
    if (!atual || atual.removidoEm) {
      return jsonError("Movimento não encontrado", 404);
    }
    await HjContabMovimento.updateOne({ _id: atual._id }, { $set: { removidoEm: new Date(), removidoPorId: result.context.user._id } });
    return ok({ ok: true });
  } catch (error) {
    return serverError("Erro ao excluir movimento", error, "Não foi possível excluir o movimento");
  }
}
