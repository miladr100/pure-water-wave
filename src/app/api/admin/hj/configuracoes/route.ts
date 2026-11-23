import { NextResponse } from "next/server";

import { jsonError, serverError } from "@/lib/academy/http";
import { projetoAtivo, projetoResumo } from "@/lib/hj/data";
import { MODULO_TESTEMUNHO_MODOS, type ConfiguracoesAdmin, type ConfiguracoesBody } from "@/lib/hj/types";
import { HjConfiguracao, hjConfiguracao } from "@/models/hj-configuracao";

import { adminContext, educatorContext } from "../_lib/shared";

async function shape(hoje: string): Promise<ConfiguracoesAdmin> {
  const config = await hjConfiguracao();
  const projetoTestemunho = await projetoAtivo("testemunho");
  return {
    modulos: config.modulos,
    projetoTestemunho: projetoTestemunho ? projetoResumo(projetoTestemunho, hoje) : null,
    testemunhoVisivelParaMembros: config.modulos.testemunho === "visivel" || (config.modulos.testemunho === "auto" && projetoTestemunho !== null),
  };
}

export async function GET() {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    return NextResponse.json(await shape(result.context.hoje));
  } catch (error) {
    return serverError("Erro ao carregar configurações", error, "Não foi possível carregar as configurações");
  }
}

export async function PUT(request: Request) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as Partial<ConfiguracoesBody>;
    const set: Record<string, unknown> = {};
    if (body.modulos?.testemunho !== undefined) {
      if (!MODULO_TESTEMUNHO_MODOS.includes(body.modulos.testemunho)) {
        return jsonError("Modo inválido", 400, { code: "INVALID_MODE" });
      }
      set["modulos.testemunho"] = body.modulos.testemunho;
    }
    if (Object.keys(set).length === 0) {
      return jsonError("Nada para salvar", 400, { code: "EMPTY" });
    }
    await HjConfiguracao.updateOne({ chave: "painel" }, { $set: set }, { upsert: true });
    return NextResponse.json(await shape(result.context.hoje));
  } catch (error) {
    return serverError("Erro ao salvar configurações", error, "Não foi possível salvar as configurações");
  }
}
