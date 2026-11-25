import { serverError } from "@/lib/academy/http";
import { criarMovimento, validarMovimento } from "@/lib/hj/contabilidade-server";

import { contabContext, falhaResponse, ok } from "../_lib";

// POST — a new movement, typed in by hand or confirmed from the assistant.
export async function POST(request: Request) {
  try {
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const validado = await validarMovimento(body, {
      livros: result.livros,
      categorias: result.config.categorias,
      hoje: result.context.hoje,
      responsavelPadrao: result.context.user.fullName,
    });
    if (!validado.ok) {
      return falhaResponse(validado);
    }
    const origem = body.origem === "assistente" ? "assistente" : "manual";
    return ok({ movimento: await criarMovimento(validado.value, origem, result.context.user._id) }, 201);
  } catch (error) {
    return serverError("Erro ao lançar movimento", error, "Não foi possível salvar o movimento");
  }
}
