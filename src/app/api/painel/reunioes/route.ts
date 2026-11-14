import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { appUrlFor } from "@/lib/academy/accounts";
import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { equipeLookup, teamsInScope, usersById, type UserDoc } from "@/lib/hj/data";
import { avisarPedido, reuniaoRow, type ReuniaoDoc } from "@/lib/hj/reunioes";
import type { ReuniaoBody, ReunioesLista } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjEquipe } from "@/models/hj-equipe";
import { HjReuniao } from "@/models/hj-reuniao";

import { panelContext, textField } from "../_lib/context";

const USER_PICK = "fullName email phone photoUpdatedAt role";

// GET: the member's own meetings, or — for an educator — the ones asked
// of them (every educator's for an administrator, `?todas=1`).
export async function GET(request: Request) {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const todas = new URL(request.url).searchParams.get("todas") === "1" && context.papeis.administrador;
    const filter = context.papeis.educador
      ? todas
        ? {}
        : { $or: [{ educadorId: context.user._id }, { membroId: context.user._id }] }
      : { membroId: context.user._id };
    const docs = (await HjReuniao.find(filter).sort({ createdAt: -1 }).limit(200).lean()) as unknown as ReuniaoDoc[];
    const users = await usersById(docs.flatMap((doc) => [doc.membroId, doc.educadorId]));
    const equipes = context.projeto ? await teamsInScope({ ...context, papeis: { ...context.papeis, educador: true, administrador: true } }, context.projeto._id) : [];
    const lookup = equipeLookup(equipes);
    const reunioes = docs.map((doc) => reuniaoRow(doc, users, lookup, context));

    // Who the member may ask: their team's educator first, then every educator.
    const educadores = (await AcademyUser.find({ role: "tutor" }).select("fullName").sort({ fullName: 1 }).lean()) as UserDoc[];
    const meuEducadorId = context.equipe?.educadorId ?? context.user.assignedTutorId ?? null;
    const body: ReunioesLista = {
      reunioes,
      educadores: educadores.map((user) => ({ id: user._id.toString(), nome: user.fullName, minha: meuEducadorId !== null && String(meuEducadorId) === user._id.toString() })),
      pendentes: reunioes.filter((row) => row.nova).length,
    };
    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao listar reuniões", error, "Não foi possível carregar as reuniões");
  }
}

// POST: a member asks an educator for a meeting. The educator is told
// right away (bell, e-mail and WhatsApp where configured); the member
// gets a receipt the same way.
export async function POST(request: Request) {
  try {
    const result = await panelContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const body = (await request.json().catch(() => ({}))) as Partial<ReuniaoBody>;
    const motivo = textField(body.motivo, 500);
    if (motivo.length < 3) {
      return jsonError("Conte o motivo da reunião", 400, { code: "REASON_REQUIRED" });
    }
    let educadorId = context.equipe?.educadorId ?? context.user.assignedTutorId ?? null;
    if (body.educadorId) {
      if (!isObjectId(body.educadorId)) {
        return jsonError("Educador inválido", 400, { code: "INVALID_EDUCATOR" });
      }
      educadorId = new Types.ObjectId(body.educadorId);
    }
    if (!educadorId) {
      return jsonError("Escolha com quem quer a reunião", 400, { code: "EDUCATOR_REQUIRED" });
    }
    const educador = (await AcademyUser.findById(educadorId).select(USER_PICK).lean()) as UserDoc | null;
    if (!educador || educador.role !== "tutor") {
      return jsonError("Essa conta não é de educador", 400, { code: "NOT_EDUCATOR" });
    }
    if (String(educador._id) === context.user._id.toString()) {
      return jsonError("Uma reunião com você mesmo?", 400, { code: "SELF" });
    }
    const aberta = await HjReuniao.exists({ membroId: context.user._id, educadorId: educador._id, estado: { $in: ["solicitada", "remarcar"] } });
    if (aberta) {
      return jsonError("Você já tem um pedido em aberto com esse educador", 409, { code: "ALREADY_OPEN" });
    }

    const created = (await HjReuniao.create({
      membroId: context.user._id,
      educadorId: educador._id,
      motivo,
      disponibilidade: textField(body.disponibilidade, 200),
      estado: "solicitada",
    })) as unknown as { _id: Types.ObjectId; toObject: () => ReuniaoDoc };
    const doc = (await HjReuniao.findById(created._id).lean()) as unknown as ReuniaoDoc;
    const membro = (await AcademyUser.findById(context.user._id).select(USER_PICK).lean()) as UserDoc | null;
    await avisarPedido(doc, membro ?? undefined, educador, appUrlFor(request));

    const fresh = (await HjReuniao.findById(created._id).lean()) as unknown as ReuniaoDoc;
    const users = await usersById([fresh.membroId, fresh.educadorId]);
    const equipes = await HjEquipe.find({ membroIds: context.user._id }).lean();
    return NextResponse.json({ reuniao: reuniaoRow(fresh, users, equipeLookup(equipes as never), context) }, { status: 201 });
  } catch (error) {
    return serverError("Erro ao pedir reunião", error, "Não foi possível pedir a reunião");
  }
}
