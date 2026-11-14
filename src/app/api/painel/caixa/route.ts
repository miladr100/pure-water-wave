import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { caixaDaEquipe, lancarEstadia, minhaEquipeTestemunho, podeLancar, podeVer } from "@/lib/hj/caixa";
import { isIsoDay } from "@/lib/hj/dates";
import { LANCAMENTO_CATEGORIAS, LANCAMENTO_TIPOS, type EstadiaBody, type LancamentoBody } from "@/lib/hj/types";
import { HjLancamento } from "@/models/hj-lancamento";

import { intField, panelContext, textField } from "../_lib/context";

// The team at hand: the person's own, or `?equipe=` for an educator.
async function teamFor(request: Request) {
  const result = await panelContext();
  if (!result.ok) {
    return result;
  }
  const { context } = result;
  const { projeto, equipes, equipe: minha } = await minhaEquipeTestemunho(context);
  const param = new URL(request.url).searchParams.get("equipe");
  const equipe = param && isObjectId(param) ? (equipes.find((item) => item._id.toString() === param) ?? null) : minha;
  if (!equipe) {
    return { ok: false as const, response: jsonError("Você não está em uma equipe do testemunho", 404, { code: "NO_TEAM" }) };
  }
  if (!podeVer(context, equipe)) {
    return { ok: false as const, response: jsonError("Não encontrado", 404) };
  }
  return { ok: true as const, context, projeto, equipe };
}

export async function GET(request: Request) {
  try {
    const loaded = await teamFor(request);
    if (!loaded.ok) {
      return loaded.response;
    }
    return NextResponse.json(await caixaDaEquipe(loaded.context, loaded.equipe, loaded.projeto));
  } catch (error) {
    return serverError("Erro ao carregar o caixa", error, "Não foi possível carregar o caixa");
  }
}

// POST: a movement typed in by the captain (or the team's educator), or
// `{ estadia: { inicio, fim } }` to post the stay fee for a period.
export async function POST(request: Request) {
  try {
    const loaded = await teamFor(request);
    if (!loaded.ok) {
      return loaded.response;
    }
    const { context, equipe, projeto } = loaded;
    if (!podeLancar(context, equipe)) {
      return jsonError("Só a capitã, o capitão ou o educador lançam no caixa", 403, { code: "NOT_ALLOWED" });
    }
    const body = (await request.json().catch(() => ({}))) as Partial<LancamentoBody> & { estadia?: Partial<EstadiaBody> };

    if (body.estadia) {
      const { inicio, fim } = body.estadia;
      if (!isIsoDay(inicio) || !isIsoDay(fim) || inicio > fim) {
        return jsonError("Período inválido", 400, { code: "INVALID_PERIOD" });
      }
      const posted = await lancarEstadia(context, equipe, projeto, inicio, fim);
      if (!posted.ok) {
        return jsonError(
          posted.code === "PERIOD_POSTED" ? "A estadia desse período já foi lançada" : "Nada a lançar: confira a taxa de estadia e os membros da equipe",
          409,
          { code: posted.code },
        );
      }
      return NextResponse.json({ ...(await caixaDaEquipe(context, equipe, projeto)), lancado: posted.id }, { status: 201 });
    }

    if (!body.tipo || !LANCAMENTO_TIPOS.includes(body.tipo)) {
      return jsonError("Tipo inválido", 400, { code: "INVALID_TYPE" });
    }
    if (!body.categoria || !LANCAMENTO_CATEGORIAS.includes(body.categoria)) {
      return jsonError("Categoria inválida", 400, { code: "INVALID_CATEGORY" });
    }
    const valorCents = intField(body.valorCents);
    if (valorCents <= 0) {
      return jsonError("Valor obrigatório", 400, { code: "AMOUNT_REQUIRED" });
    }
    const data = isIsoDay(body.data) ? body.data! : context.hoje;
    const created = await HjLancamento.create({
      equipeId: equipe._id,
      projetoId: projeto?._id ?? null,
      data,
      tipo: body.tipo,
      categoria: body.categoria,
      valorCents,
      descricao: textField(body.descricao, 200),
      autorId: context.user._id,
      automatico: false,
    });
    return NextResponse.json({ ...(await caixaDaEquipe(context, equipe, projeto)), lancado: created._id.toString() }, { status: 201 });
  } catch (error) {
    return serverError("Erro ao lançar no caixa", error, "Não foi possível lançar no caixa");
  }
}

// DELETE ?lancamento=<id>: a wrong entry goes away; the balance follows.
export async function DELETE(request: Request) {
  try {
    const loaded = await teamFor(request);
    if (!loaded.ok) {
      return loaded.response;
    }
    const { context, equipe, projeto } = loaded;
    if (!podeLancar(context, equipe)) {
      return jsonError("Só a capitã, o capitão ou o educador mexem no caixa", 403, { code: "NOT_ALLOWED" });
    }
    const id = new URL(request.url).searchParams.get("lancamento");
    if (!isObjectId(id)) {
      return jsonError("Lançamento não encontrado", 404);
    }
    const removed = await HjLancamento.deleteOne({ _id: new Types.ObjectId(id), equipeId: equipe._id });
    if (removed.deletedCount === 0) {
      return jsonError("Lançamento não encontrado", 404);
    }
    return NextResponse.json(await caixaDaEquipe(context, equipe, projeto));
  } catch (error) {
    return serverError("Erro ao apagar lançamento", error, "Não foi possível apagar o lançamento");
  }
}
