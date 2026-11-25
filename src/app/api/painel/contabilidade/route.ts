import { NextResponse } from "next/server";

import { jsonError, serverError } from "@/lib/academy/http";
import { aiDisponivel } from "@/lib/hj/contabilidade-ia";
import type { ContabilidadeReply, Moeda } from "@/lib/hj/contabilidade";
import { acessoContabil, lerConfig, movimentosDosLivros } from "@/lib/hj/contabilidade-server";
import { listGrants } from "@/lib/oauth";
import { HjContabMovimento } from "@/models/hj-contab-movimento";

import { panelContext } from "../_lib/context";

// GET /api/painel/contabilidade?lado=painel|admin — the books this person sees
// from that side, with their movements and settings.
export async function GET(request: Request) {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const lado = new URL(request.url).searchParams.get("lado") === "admin" ? "admin" : "painel";
    const acesso = await acessoContabil(context, lado);
    if (lado === "admin" && !context.papeis.educador) {
      return jsonError("Não encontrado", 404);
    }
    const config = await lerConfig();
    const ids = acesso.livros.map((livro) => livro.id);
    const movimentos = await movimentosDosLivros(ids);
    const extras = config.extras.map((item) => item.id);
    const emUso = extras.length ? ((await HjContabMovimento.distinct("categoriaId", { categoriaId: { $in: extras }, removidoEm: null })) as string[]) : [];
    const moedasLigadas: Record<string, Moeda[]> = {};
    for (const id of ids) {
      moedasLigadas[id] = config.moedas.get(id) ?? [];
    }
    const podeConectar = context.papeis.educador;
    const body: ContabilidadeReply = {
      lado,
      hoje: context.hoje,
      livros: acesso.livros,
      grupos: acesso.grupos,
      administrador: context.papeis.administrador,
      podeConectar,
      movimentos,
      categorias: config.categorias,
      categoriasEmUso: emUso,
      moedasLigadas,
      veTodas: context.papeis.administrador ? config.veTodas : [],
      agentes: podeConectar ? await listGrants(context.user._id) : [],
      assistenteIA: aiDisponivel(),
    };
    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar a contabilidade", error, "Não foi possível carregar a contabilidade");
  }
}
