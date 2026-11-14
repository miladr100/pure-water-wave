import { Types } from "mongoose";

import { emailConfigured, sendEmailReuniao } from "@/lib/academy/emails";
import { photoUrlOf } from "@/lib/academy/profile";
import { sameId, type EquipeDoc, type PanelContext, type UserDoc } from "@/lib/hj/data";
import type { ReuniaoEstado, ReuniaoRow } from "@/lib/hj/types";
import { sendWhatsappTemplate, whatsappConfigured, whatsappLink, whatsappTemplate } from "@/lib/whatsapp";
import { HjReuniao } from "@/models/hj-reuniao";

// Meetings between a member and their educator: the rows the screens
// show and the notices each step sends (bell always; e-mail and WhatsApp
// when configured — see src/lib/whatsapp.ts for what WhatsApp needs).

export type ReuniaoDoc = {
  _id: Types.ObjectId;
  membroId: Types.ObjectId;
  educadorId: Types.ObjectId;
  motivo: string;
  disponibilidade: string;
  estado: ReuniaoEstado;
  dataHora: Date | null;
  local: string;
  resposta: string;
  respondidaEm: Date | null;
  vistaPeloMembroEm: Date | null;
  vistaPeloEducadorEm: Date | null;
  avisos: { para: "membro" | "educador"; canal: "email" | "whatsapp"; ok: boolean; detalhe: string; em: Date }[];
  createdAt: Date;
  updatedAt: Date;
};

export const fmtDataHora = (value: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);

export function reuniaoRow(doc: ReuniaoDoc, users: Map<string, UserDoc>, equipeDe: (membroId: string) => EquipeDoc | undefined, viewer: PanelContext): ReuniaoRow {
  const membro = users.get(String(doc.membroId));
  const educador = users.get(String(doc.educadorId));
  const souMembro = sameId(doc.membroId, viewer.user._id);
  const souEducador = !souMembro;
  const nova = souMembro
    ? doc.respondidaEm !== null && (doc.vistaPeloMembroEm === null || doc.vistaPeloMembroEm < doc.respondidaEm)
    : doc.estado === "solicitada" && doc.vistaPeloEducadorEm === null;
  const other = souEducador ? membro : educador;
  const chat = other?.phone
    ? whatsappLink(
        other.phone,
        souEducador ? `Olá, ${membro?.fullName.split(" ")[0] ?? ""}! Vi seu pedido de reunião no Painel HJ Team.` : `Olá! Pedi uma reunião pelo Painel HJ Team: ${doc.motivo}`,
      )
    : null;
  return {
    id: doc._id.toString(),
    membro: { id: String(doc.membroId), nome: membro?.fullName ?? "—", telefone: membro?.phone ?? "", fotoUrl: membro ? photoUrlOf(membro) : null, equipe: equipeDe(String(doc.membroId))?.nome ?? "" },
    educador: { id: String(doc.educadorId), nome: educador?.fullName ?? "—", telefone: educador?.phone ?? "" },
    motivo: doc.motivo,
    disponibilidade: doc.disponibilidade ?? "",
    estado: doc.estado,
    dataHora: doc.dataHora ? doc.dataHora.toISOString() : null,
    local: doc.local ?? "",
    resposta: doc.resposta ?? "",
    criadaEm: doc.createdAt.toISOString(),
    respondidaEm: doc.respondidaEm ? doc.respondidaEm.toISOString() : null,
    nova,
    avisos: (doc.avisos ?? []).map((aviso) => ({ ...aviso, em: aviso.em.toISOString() })),
    whatsappLink: chat,
  };
}

type Aviso = { para: "membro" | "educador"; canal: "email" | "whatsapp"; ok: boolean; detalhe: string; em: Date };

// Tells one side what happened, on every channel that is set up, and
// records what went through. Never throws: a notice that fails must not
// fail the request that caused it.
async function avisar({
  reuniaoId,
  para,
  user,
  title,
  lines,
  ctaLabel,
  ctaUrl,
  template,
  params,
}: {
  reuniaoId: Types.ObjectId;
  para: "membro" | "educador";
  user: UserDoc | undefined;
  title: string;
  lines: string[];
  ctaLabel: string;
  ctaUrl: string;
  template: string;
  params: string[];
}) {
  const avisos: Aviso[] = [];
  if (!user) {
    return;
  }
  if (emailConfigured()) {
    try {
      await sendEmailReuniao({ to: user.email, firstName: user.fullName.split(" ")[0], title, lines, ctaLabel, ctaUrl });
      avisos.push({ para, canal: "email", ok: true, detalhe: "", em: new Date() });
    } catch (error) {
      avisos.push({ para, canal: "email", ok: false, detalhe: error instanceof Error ? error.message : String(error), em: new Date() });
    }
  }
  if (whatsappConfigured() && user.phone) {
    const sent = await sendWhatsappTemplate({ to: user.phone, template: whatsappTemplate(template), params }).catch((error: unknown) => ({
      ok: false as const,
      detalhe: error instanceof Error ? error.message : String(error),
    }));
    avisos.push({ para, canal: "whatsapp", ok: sent.ok, detalhe: sent.ok ? "" : sent.detalhe, em: new Date() });
  }
  if (!emailConfigured() && !whatsappConfigured()) {
    console.info(`[reuniões] aviso para ${para} ${user.email}: ${title} (nenhum canal configurado; só o sino)`);
  }
  if (avisos.length > 0) {
    await HjReuniao.updateOne({ _id: reuniaoId }, { $push: { avisos: { $each: avisos } } });
  }
}

export async function avisarPedido(doc: ReuniaoDoc, membro: UserDoc | undefined, educador: UserDoc | undefined, appUrl: string) {
  const nome = membro?.fullName ?? "Um membro";
  await avisar({
    reuniaoId: doc._id,
    para: "educador",
    user: educador,
    title: "Pedido de reunião",
    lines: [`${nome} pediu uma reunião com você.`, `Motivo: ${doc.motivo}`, ...(doc.disponibilidade ? [`Quando pode: ${doc.disponibilidade}`] : [])],
    ctaLabel: "Responder no painel",
    ctaUrl: `${appUrl}/admin/reunioes`,
    template: "reuniao_pedida",
    params: [nome, doc.motivo],
  });
  await avisar({
    reuniaoId: doc._id,
    para: "membro",
    user: membro,
    title: "Seu pedido de reunião foi enviado",
    lines: [`${educador?.fullName ?? "Seu educador"} recebeu o seu pedido e vai responder pelo painel.`, `Motivo: ${doc.motivo}`],
    ctaLabel: "Ver minhas reuniões",
    ctaUrl: `${appUrl}/painel/reunioes`,
    template: "reuniao_recebida",
    params: [educador?.fullName ?? "seu educador"],
  });
}

export async function avisarResposta(doc: ReuniaoDoc, membro: UserDoc | undefined, educador: UserDoc | undefined, appUrl: string) {
  const quem = educador?.fullName ?? "Seu educador";
  const quando = doc.dataHora ? fmtDataHora(doc.dataHora) : "";
  const texto: Record<ReuniaoEstado, { title: string; lines: string[] }> = {
    solicitada: { title: "Pedido de reunião", lines: [] },
    confirmada: { title: "Reunião confirmada", lines: [`${quem} confirmou a reunião para ${quando}.`, ...(doc.local ? [`Onde: ${doc.local}`] : []), ...(doc.resposta ? [doc.resposta] : [])] },
    remarcar: { title: "Outro horário para a reunião", lines: [`${quem} sugeriu outro horário.`, ...(doc.resposta ? [doc.resposta] : [])] },
    recusada: { title: "Reunião não confirmada", lines: [`${quem} não pôde confirmar a reunião agora.`, ...(doc.resposta ? [doc.resposta] : [])] },
    cancelada: { title: "Reunião cancelada", lines: [`A reunião foi cancelada.`] },
    realizada: { title: "Reunião realizada", lines: [`${quem} marcou a reunião como realizada.`] },
  };
  const { title, lines } = texto[doc.estado];
  await avisar({
    reuniaoId: doc._id,
    para: "membro",
    user: membro,
    title,
    lines,
    ctaLabel: "Ver minhas reuniões",
    ctaUrl: `${appUrl}/painel/reunioes`,
    template: "reuniao_respondida",
    params: [quem, title, quando || doc.resposta || "—"],
  });
}
