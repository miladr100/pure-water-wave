import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { projetoAtivo, usersById, type EquipeDoc, type UserDoc } from "@/lib/hj/data";
import { isIsoDay } from "@/lib/hj/dates";
import { orientacaoRow, type OrientacaoDoc } from "@/lib/hj/orientacoes";
import { ORIENTACAO_MODULOS, type OrientacaoBody, type OrientacaoRow } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjEquipe } from "@/models/hj-equipe";
import { HjOrientacao } from "@/models/hj-orientacao";

import { educatorContext, textField } from "../_lib/shared";

// GET ?equipe=<id> | ?membro=<id> [&modulo=]: the history, newest first.
export async function GET(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const params = new URL(request.url).searchParams;
    const equipe = params.get("equipe");
    const membro = params.get("membro");
    const modulo = params.get("modulo");
    const filter: Record<string, unknown> = {};
    if (equipe) {
      if (!isObjectId(equipe)) return jsonError("Equipe inválida", 400, { code: "INVALID_TEAM" });
      filter.equipeId = new Types.ObjectId(equipe);
    } else if (membro) {
      if (!isObjectId(membro)) return jsonError("Membro inválido", 400, { code: "INVALID_MEMBER" });
      filter.membroId = new Types.ObjectId(membro);
    } else {
      return jsonError("Informe a equipe ou o membro", 400, { code: "TARGET_REQUIRED" });
    }
    if (modulo) {
      if (!ORIENTACAO_MODULOS.includes(modulo as never)) return jsonError("Módulo inválido", 400, { code: "INVALID_MODULE" });
      filter.modulo = modulo;
    }
    const docs = (await HjOrientacao.find(filter).sort({ data: -1, createdAt: -1 }).limit(100).lean()) as unknown as OrientacaoDoc[];
    const users = await usersById(docs.flatMap((doc) => [doc.autorId, ...(doc.membroId ? [doc.membroId] : [])]));
    const equipes = (await HjEquipe.find({ _id: { $in: docs.map((doc) => doc.equipeId).filter((id): id is Types.ObjectId => id != null) } }).lean()) as EquipeDoc[];
    const byId = new Map(equipes.map((item) => [item._id.toString(), item]));
    const orientacoes: OrientacaoRow[] = docs.map((doc) => orientacaoRow(doc, users, byId));
    return NextResponse.json({ orientacoes });
  } catch (error) {
    return serverError("Erro ao listar orientações", error, "Não foi possível carregar as orientações");
  }
}

// POST: what the educator told a team (testemunho) or a member (the meta interna).
export async function POST(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const body = (await request.json().catch(() => ({}))) as Partial<OrientacaoBody>;
    if (!body.modulo || !ORIENTACAO_MODULOS.includes(body.modulo)) {
      return jsonError("Módulo inválido", 400, { code: "INVALID_MODULE" });
    }
    const texto = textField(body.texto, 1000);
    if (texto.length < 3) {
      return jsonError("Escreva a orientação", 400, { code: "TEXT_REQUIRED" });
    }
    let equipeId: Types.ObjectId | null = null;
    let membroId: Types.ObjectId | null = null;
    if (body.equipeId) {
      if (!isObjectId(body.equipeId) || !(await HjEquipe.exists({ _id: body.equipeId }))) {
        return jsonError("Equipe não encontrada", 404, { code: "TEAM_NOT_FOUND" });
      }
      equipeId = new Types.ObjectId(body.equipeId);
    } else if (body.membroId) {
      if (!isObjectId(body.membroId) || !(await AcademyUser.exists({ _id: body.membroId }))) {
        return jsonError("Membro não encontrado", 404, { code: "MEMBER_NOT_FOUND" });
      }
      membroId = new Types.ObjectId(body.membroId);
    } else {
      return jsonError("Informe a equipe ou o membro", 400, { code: "TARGET_REQUIRED" });
    }
    // A member's meta interna is filed under the phase the course is in
    // when it is given: the testimony drive while it is the active project,
    // the RM otherwise (Victor, 23/11/2026: there is a meta interna in the
    // testimony phase too). A team's orientation keeps the module it came with.
    const modulo = membroId ? ((await projetoAtivo("testemunho")) ? "testemunho" : "rm") : body.modulo;
    const created = await HjOrientacao.create({
      modulo,
      equipeId,
      membroId,
      texto,
      data: isIsoDay(body.data) ? body.data : context.hoje,
      autorId: context.user._id,
    });
    const doc = (await HjOrientacao.findById(created._id).lean()) as unknown as OrientacaoDoc;
    const users = await usersById([doc.autorId, ...(doc.membroId ? [doc.membroId] : [])]);
    const equipe = equipeId ? ((await HjEquipe.findById(equipeId).lean()) as EquipeDoc | null) : null;
    const byId = new Map<string, EquipeDoc>(equipe ? [[equipe._id.toString(), equipe]] : []);
    return NextResponse.json({ orientacao: orientacaoRow(doc, users as Map<string, UserDoc>, byId) }, { status: 201 });
  } catch (error) {
    return serverError("Erro ao registrar orientação", error, "Não foi possível registrar a orientação");
  }
}
