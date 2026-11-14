import { NextResponse } from "next/server";

import { appUrlFor } from "@/lib/academy/accounts";
import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { equipeLookup, sameId, usersById, type PanelContext, type UserDoc } from "@/lib/hj/data";
import { avisarResposta, reuniaoRow, type ReuniaoDoc } from "@/lib/hj/reunioes";
import type { ReuniaoRespostaBody } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjEquipe } from "@/models/hj-equipe";
import { HjReuniao } from "@/models/hj-reuniao";

import { panelContext, textField } from "../../_lib/context";

type Params = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!isObjectId(id)) {
    return null;
  }
  return (await HjReuniao.findById(id).lean()) as unknown as ReuniaoDoc | null;
}

async function shaped(doc: ReuniaoDoc, context: PanelContext) {
  const users = await usersById([doc.membroId, doc.educadorId]);
  const equipes = await HjEquipe.find({ membroIds: doc.membroId }).lean();
  return reuniaoRow(doc, users, equipeLookup(equipes as never), context);
}

// PATCH: the educator confirms (date, time, place), suggests another
// time, declines or marks it done; the member cancels their own.
export async function PATCH(request: Request, { params }: Params) {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const { id } = await params;
    const doc = await load(id);
    if (!doc) {
      return jsonError("Reunião não encontrada", 404);
    }
    const souMembro = sameId(doc.membroId, context.user._id);
    const souEducador = sameId(doc.educadorId, context.user._id) || context.papeis.administrador;
    if (!souMembro && !souEducador) {
      return jsonError("Reunião não encontrada", 404);
    }
    const body = (await request.json().catch(() => ({}))) as Partial<ReuniaoRespostaBody>;
    const set: Record<string, unknown> = {};

    if (body.acao === "cancelar") {
      if (!souMembro && !souEducador) {
        return jsonError("Não encontrado", 404);
      }
      if (doc.estado === "realizada" || doc.estado === "cancelada") {
        return jsonError("Essa reunião já foi encerrada", 409, { code: "CLOSED" });
      }
      set.estado = "cancelada";
      set.respondidaEm = new Date();
    } else {
      if (!souEducador) {
        return jsonError("Só o educador responde ao pedido", 403, { code: "NOT_EDUCATOR" });
      }
      const resposta = textField(body.resposta, 500);
      switch (body.acao) {
        case "confirmar": {
          const quando = body.dataHora ? new Date(body.dataHora) : null;
          if (!quando || Number.isNaN(quando.getTime())) {
            return jsonError("Escolha data e hora", 400, { code: "DATETIME_REQUIRED" });
          }
          set.estado = "confirmada";
          set.dataHora = quando;
          set.local = textField(body.local, 200);
          set.resposta = resposta;
          break;
        }
        case "remarcar":
          if (resposta.length < 3) {
            return jsonError("Diga qual horário serve", 400, { code: "REPLY_REQUIRED" });
          }
          set.estado = "remarcar";
          set.resposta = resposta;
          break;
        case "recusar":
          set.estado = "recusada";
          set.resposta = resposta;
          break;
        case "realizada":
          if (doc.estado !== "confirmada") {
            return jsonError("Só uma reunião confirmada pode ser marcada como realizada", 409, { code: "NOT_CONFIRMED" });
          }
          set.estado = "realizada";
          break;
        default:
          return jsonError("Ação inválida", 400, { code: "INVALID_ACTION" });
      }
      set.respondidaEm = new Date();
      set.vistaPeloEducadorEm = new Date();
    }

    await HjReuniao.updateOne({ _id: doc._id }, { $set: set });
    const updated = (await HjReuniao.findById(doc._id).lean()) as unknown as ReuniaoDoc;
    if (!souMembro) {
      const [membro, educador] = await Promise.all([
        AcademyUser.findById(updated.membroId).select("fullName email phone").lean() as Promise<UserDoc | null>,
        AcademyUser.findById(updated.educadorId).select("fullName email phone").lean() as Promise<UserDoc | null>,
      ]);
      await avisarResposta(updated, membro ?? undefined, educador ?? undefined, appUrlFor(request));
    }
    const fresh = (await HjReuniao.findById(doc._id).lean()) as unknown as ReuniaoDoc;
    return NextResponse.json({ reuniao: await shaped(fresh, context) });
  } catch (error) {
    return serverError("Erro ao responder reunião", error, "Não foi possível responder");
  }
}

// POST: "seen" — the bell stops counting it for this side.
export async function POST(_request: Request, { params }: Params) {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const { id } = await params;
    const doc = await load(id);
    if (!doc) {
      return jsonError("Reunião não encontrada", 404);
    }
    if (sameId(doc.membroId, context.user._id)) {
      await HjReuniao.updateOne({ _id: doc._id }, { $set: { vistaPeloMembroEm: new Date() } });
    } else if (sameId(doc.educadorId, context.user._id) || context.papeis.administrador) {
      await HjReuniao.updateOne({ _id: doc._id }, { $set: { vistaPeloEducadorEm: new Date() } });
    } else {
      return jsonError("Reunião não encontrada", 404);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("Erro ao marcar reunião como vista", error, "Não foi possível marcar como vista");
  }
}
