import { jsonError, serverError } from "@/lib/academy/http";
import { semAcento } from "@/lib/hj/contabilidade";
import { HjContabConfig } from "@/models/hj-contab-config";
import { HjContabMovimento } from "@/models/hj-contab-movimento";

import { contabContext, ok } from "../_lib";

const slug = (text: string) =>
  semAcento(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30) || "categoria";

// POST {nome, tipo} — a category beyond the fixed list, for every team.
export async function POST(request: Request) {
  try {
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as { nome?: unknown; tipo?: unknown };
    const nome = typeof body.nome === "string" ? body.nome.trim().slice(0, 40) : "";
    const tipo = body.tipo === "entrada" ? "entrada" : body.tipo === "saida" ? "saida" : null;
    if (!nome || !tipo) {
      return jsonError("Dê um nome e um tipo à categoria", 400, { code: "INVALID_CATEGORY" });
    }
    if (result.config.categorias.some((item) => item.tipo === tipo && semAcento(item.nome) === semAcento(nome))) {
      return jsonError("Já existe uma categoria com esse nome", 409, { code: "DUPLICATE" });
    }
    const categoria = { id: `c:${slug(nome)}-${Date.now().toString(36)}`, nome, tipo, icone: "etiqueta", cor: 0, criadaPorId: result.context.user._id };
    await HjContabConfig.updateOne({ _id: "contabilidade" }, { $push: { categorias: categoria } }, { upsert: true });
    return ok({ categoria: { id: categoria.id, nome, tipo, icone: "etiqueta", cor: 0 } }, 201);
  } catch (error) {
    return serverError("Erro ao criar categoria", error, "Não foi possível criar a categoria");
  }
}

// DELETE ?id= — only a created category nobody used.
export async function DELETE(request: Request) {
  try {
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!result.config.extras.some((item) => item.id === id)) {
      return jsonError("Só as categorias criadas se apagam", 400, { code: "FIXED_CATEGORY" });
    }
    if (await HjContabMovimento.exists({ categoriaId: id, removidoEm: null })) {
      return jsonError("A categoria tem movimentos", 409, { code: "IN_USE" });
    }
    await HjContabConfig.updateOne({ _id: "contabilidade" }, { $pull: { categorias: { id } } });
    return ok({ ok: true });
  } catch (error) {
    return serverError("Erro ao apagar categoria", error, "Não foi possível apagar a categoria");
  }
}
