import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { formatBirthday } from "@/lib/academy/profile";
import { countsAsResult, pessoaRow, ref, sameId, USER_FIELDS, type EquipeDoc, type UserDoc } from "@/lib/hj/data";
import { confidencialDe, hjSetPaths, parsePerfilEducador, perfilDe } from "@/lib/hj/perfil";
import { media } from "@/lib/hj/rm";
import { CONVIDADO_ETAPAS, type ConvidadoEtapa, type PessoaDetalhe, type PessoaPatchBody } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjConvidado } from "@/models/hj-convidado";
import { HjEquipe } from "@/models/hj-equipe";
import { HjRelatorio } from "@/models/hj-relatorio";

import { educatorContext, textField } from "../../_lib/shared";

type Params = { params: Promise<{ id: string }> };

async function detalhe(user: UserDoc, hoje: string, projetoId: Types.ObjectId | null): Promise<PessoaDetalhe> {
  const equipe = projetoId
    ? ((await HjEquipe.findOne({ projetoId, membroIds: user._id }).lean()) as EquipeDoc | null)
    : null;
  const row = pessoaRow(user, equipe, hoje);

  const porEtapa = Object.fromEntries(CONVIDADO_ETAPAS.map((etapa) => [etapa, 0])) as Record<ConvidadoEtapa, number>;
  const guests = (await HjConvidado.find({ responsavelId: user._id }).select("etapa").lean()) as { etapa: ConvidadoEtapa }[];
  for (const guest of guests) {
    porEtapa[guest.etapa] += 1;
  }

  let rm: PessoaDetalhe["rm"] = null;
  if (projetoId) {
    const relatorios = (await HjRelatorio.find({ projetoId, membroId: user._id }).select("liquidoCents estado").lean()) as { liquidoCents: number; estado: "enviado" | "validado" | "devolvido" }[];
    const valores = relatorios.filter((item) => countsAsResult(item.estado)).map((item) => item.liquidoCents);
    rm = { diasEnviados: valores.length, totalCents: valores.reduce((sum, value) => sum + value, 0), mediaCents: media(valores) };
  }

  const educadorId = equipe?.educadorId ?? user.assignedTutorId ?? null;
  const educador = educadorId ? ((await AcademyUser.findById(educadorId).select("fullName").lean()) as UserDoc | null) : null;

  return {
    ...row,
    nascimento: formatBirthday(user.birthday),
    idioma: user.language ?? "pt",
    perfil: perfilDe(user.hj),
    confidencial: confidencialDe(user.hj),
    anotacoes: user.tutorNotes ?? "",
    educadorResponsavel: ref(educador),
    convidados: { total: guests.length, porEtapa },
    rm,
  };
}

// GET: one person's HJ Team profile, confidential half included — this
// route is the educator's.
export async function GET(_request: Request, { params }: Params) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }
    const user = (await AcademyUser.findById(id).select(USER_FIELDS).lean()) as UserDoc | null;
    if (!user) {
      return jsonError("Não encontrado", 404);
    }
    return NextResponse.json({ pessoa: await detalhe(user, result.context.hoje, result.context.projeto?._id ?? null) });
  } catch (error) {
    return serverError("Erro ao carregar a pessoa", error, "Não foi possível carregar a pessoa");
  }
}

// PATCH: program, cohort, the public fields, the confidential fields and
// the educator's notes.
export async function PATCH(request: Request, { params }: Params) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }
    const body = (await request.json().catch(() => ({}))) as Partial<PessoaPatchBody>;
    const parsed = parsePerfilEducador(body);
    const set = hjSetPaths(parsed);
    if (typeof body.anotacoes === "string") {
      set.tutorNotes = textField(body.anotacoes, 5000);
    }
    if (Object.keys(set).length === 0) {
      return jsonError("Nada para salvar", 400, { code: "EMPTY" });
    }
    const user = (await AcademyUser.findByIdAndUpdate(id, { $set: set }, { new: true }).select(USER_FIELDS).lean()) as UserDoc | null;
    if (!user) {
      return jsonError("Não encontrado", 404);
    }
    if (!sameId(user._id, id)) {
      return jsonError("Não encontrado", 404);
    }
    return NextResponse.json({ pessoa: await detalhe(user, result.context.hoje, result.context.projeto?._id ?? null) });
  } catch (error) {
    return serverError("Erro ao salvar a pessoa", error, "Não foi possível salvar a pessoa");
  }
}
