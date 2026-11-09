import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { isIsoDay } from "@/lib/hj/dates";
import {
  convidadoRow,
  equipeLookup,
  membersInScope,
  usersById,
  type ConvidadoDoc,
  type EquipeDoc,
  type PanelContext,
} from "@/lib/hj/data";
import { ETAPA_LABELS, sugestoesPara } from "@/lib/hj/testemunho";
import { CONVIDADO_ETAPAS, type ConvidadoBody, type ConvidadoDatas, type ConvidadoDetalhe } from "@/lib/hj/types";
import { HjAcontecimento, HjConvidado } from "@/models/hj-convidado";

import { intField, panelContext, textField } from "../../_lib/context";

type AcontecimentoDoc = {
  _id: { toString(): string };
  autorId: { toString(): string };
  tipo: ConvidadoDetalhe["acontecimentos"][number]["tipo"];
  texto: string;
  data: string;
};

const DATE_KEYS: (keyof ConvidadoDatas)[] = [
  "primeiroContato",
  "gateway",
  "fichaAssinada",
  "inicioSistema1",
  "fimSistema1",
  "inicioSistema2",
  "jardim",
];

async function loadGuest(id: string) {
  const result = await panelContext();
  if (!result.ok) {
    return { ok: false as const, response: result.response };
  }
  if (!isObjectId(id)) {
    return { ok: false as const, response: jsonError("Não encontrado", 404) };
  }
  const doc = (await HjConvidado.findById(id).lean()) as ConvidadoDoc | null;
  const scope = await membersInScope(result.context);
  if (!doc || !scope.ids.has(String(doc.responsavelId))) {
    return { ok: false as const, response: jsonError("Não encontrado", 404) };
  }
  return { ok: true as const, context: result.context, doc, scope };
}

async function detalhe(doc: ConvidadoDoc, context: PanelContext, scope: { equipes: EquipeDoc[] }) {
  const events = (await HjAcontecimento.find({ convidadoId: doc._id }).sort({ data: -1, createdAt: -1 }).lean()) as unknown as AcontecimentoDoc[];
  const users = await usersById([doc.responsavelId, ...events.map((event) => event.autorId.toString())]);
  const row = convidadoRow(doc, users, equipeLookup(scope.equipes), context.hoje);
  const body: ConvidadoDetalhe = {
    ...row,
    notas: doc.notas ?? "",
    acontecimentos: events.map((event) => ({
      id: event._id.toString(),
      tipo: event.tipo,
      texto: event.texto,
      data: event.data,
      autor: { id: event.autorId.toString(), nome: users.get(event.autorId.toString())?.fullName ?? "—" },
    })),
    sugestoes: sugestoesPara({ etapa: row.etapa, conferencias: row.conferencias, ultimoContato: row.ultimoContato, datas: row.datas }),
  };
  return body;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadGuest(id);
    if (!loaded.ok) {
      return loaded.response;
    }
    return NextResponse.json({ convidado: await detalhe(loaded.doc, loaded.context, loaded.scope) });
  } catch (error) {
    return serverError("Erro ao carregar convidado", error, "Não foi possível carregar o convidado");
  }
}

// PATCH: the guest's data and milestones. Moving to a later stage writes
// the milestone's date (today unless given) and a timeline entry.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadGuest(id);
    if (!loaded.ok) {
      return loaded.response;
    }
    const { context, doc } = loaded;
    const body = (await request.json().catch(() => ({}))) as Partial<ConvidadoBody>;

    const set: Record<string, unknown> = {};
    if (body.nome !== undefined) {
      const nome = textField(body.nome, 120);
      if (nome.length < 2) {
        return jsonError("Nome obrigatório", 400, { code: "NAME_REQUIRED" });
      }
      set.nome = nome;
    }
    if (body.telefone !== undefined) set.telefone = textField(body.telefone, 40);
    if (body.cidade !== undefined) set.cidade = textField(body.cidade, 80);
    if (body.origem !== undefined) set.origem = textField(body.origem, 120);
    if (body.proximoObjetivo !== undefined) set.proximoObjetivo = textField(body.proximoObjetivo, 200);
    if (body.notas !== undefined) set.notas = textField(body.notas, 2000);
    if (body.conferencias !== undefined) set.conferencias = Math.min(16, intField(body.conferencias));

    if (body.datas) {
      for (const key of DATE_KEYS) {
        const value = body.datas[key];
        if (value === null) {
          set[`datas.${key}`] = null;
        } else if (value !== undefined) {
          if (!isIsoDay(value)) {
            return jsonError("Data inválida", 400, { code: "INVALID_DATE", field: key });
          }
          set[`datas.${key}`] = value;
        }
      }
    }

    const timeline: { tipo: "etapa" | "ficha"; texto: string; data: string }[] = [];
    if (body.etapa !== undefined) {
      if (!CONVIDADO_ETAPAS.includes(body.etapa)) {
        return jsonError("Etapa inválida", 400, { code: "INVALID_STAGE" });
      }
      if (body.etapa !== doc.etapa) {
        set.etapa = body.etapa;
        const dateKey: Partial<Record<typeof body.etapa, keyof ConvidadoDatas>> = {
          gateway: "gateway",
          sistema1: "inicioSistema1",
          sistema2: "inicioSistema2",
          jardim: "jardim",
        };
        const key = dateKey[body.etapa];
        if (key && set[`datas.${key}`] === undefined && !doc.datas?.[key]) {
          set[`datas.${key}`] = context.hoje;
        }
        set.ultimoContato = context.hoje;
        timeline.push({ tipo: "etapa", texto: `Passou para ${ETAPA_LABELS[body.etapa]}`, data: context.hoje });
      }
    }
    if (set["datas.fichaAssinada"] && !doc.datas?.fichaAssinada) {
      timeline.push({ tipo: "ficha", texto: "Ficha assinada", data: String(set["datas.fichaAssinada"]) });
    }

    if (Object.keys(set).length === 0) {
      return jsonError("Nada para alterar", 400, { code: "EMPTY" });
    }

    const saved = (await HjConvidado.findByIdAndUpdate(doc._id, { $set: set }, { new: true }).lean()) as ConvidadoDoc;
    if (timeline.length > 0) {
      await HjAcontecimento.insertMany(
        timeline.map((item) => ({ convidadoId: doc._id, autorId: context.user._id, ...item })),
      );
    }

    return NextResponse.json({ convidado: await detalhe(saved, context, loaded.scope) });
  } catch (error) {
    return serverError("Erro ao salvar convidado", error, "Não foi possível salvar o convidado");
  }
}
