import { Types } from "mongoose";

import type { SessionPayload } from "@/lib/academy/auth";
import { addDays, daysBetween, todayInBrazil } from "@/lib/hj/dates";
import { liquido, media, novaMeta, recorde } from "@/lib/hj/rm";
import { alertaDe } from "@/lib/hj/testemunho";
import type {
  ConvidadoDatas,
  ConvidadoRow,
  DiaResumo,
  EquipeResumo,
  HjPrograma,
  Papeis,
  PessoaRef,
  ProjetoResumo,
  RelatorioEstado,
  RelatorioRow,
  RmResumo,
} from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjConvidado } from "@/models/hj-convidado";
import { HjEquipe } from "@/models/hj-equipe";
import { HjProjeto } from "@/models/hj-projeto";
import { HjRelatorio } from "@/models/hj-relatorio";

// Everything the panel's routes share: who the person is inside the
// panel (member, captain, educator, administrator), which teams they may
// see, and how documents become the rows the screens render.

export type UserDoc = {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  role: "student" | "tutor";
  isAdmin?: boolean;
  createdAt?: Date;
  lastSeenAt?: Date | null;
};

export type ProjetoDoc = {
  _id: Types.ObjectId;
  nome: string;
  tipo: "arrecadacao" | "testemunho";
  inicio: string;
  fim: string;
  ativo: boolean;
  diasDescanso: string[];
  moeda: string;
  metaDiariaPadraoCents: number;
  metaTotalCents: number;
  metasPrograma: { programa: HjPrograma; metaCents: number }[];
  regraNovaMeta: { fator: number; arredondarCents: number; minimoCents: number };
};

export type EquipeDoc = {
  _id: Types.ObjectId;
  projetoId: Types.ObjectId;
  nome: string;
  programa: HjPrograma;
  educadorId: Types.ObjectId | null;
  capitaoId: Types.ObjectId | null;
  membroIds: Types.ObjectId[];
};

export type RelatorioDoc = {
  _id: Types.ObjectId;
  projetoId: Types.ObjectId;
  equipeId: Types.ObjectId;
  membroId: Types.ObjectId;
  data: string;
  dinheiroCents: number;
  pixCents: number;
  despesasCents: number;
  liquidoCents: number;
  itens: number;
  contatos: number;
  observacoes: string;
  estado: RelatorioEstado;
  motivoDevolucao: string;
  enviadoEm: Date;
  validadoPorId: Types.ObjectId | null;
  validadoEm: Date | null;
};

export type ConvidadoDoc = {
  _id: Types.ObjectId;
  responsavelId: Types.ObjectId;
  nome: string;
  telefone: string;
  cidade: string;
  origem: string;
  etapa: ConvidadoRow["etapa"];
  conferencias: number;
  ultimoContato: string | null;
  proximoObjetivo: string;
  notas: string;
  datas: Partial<ConvidadoDatas>;
  updatedAt?: Date;
};

export const USER_FIELDS = "fullName email phone country role isAdmin createdAt lastSeenAt";

export const oid = (value: string | Types.ObjectId) =>
  typeof value === "string" ? new Types.ObjectId(value) : value;

export const sameId = (a: Types.ObjectId | string | null | undefined, b: Types.ObjectId | string | null | undefined) =>
  a != null && b != null && String(a) === String(b);

export function ref(user: Pick<UserDoc, "_id" | "fullName"> | null | undefined): PessoaRef | null {
  return user ? { id: user._id.toString(), nome: user.fullName } : null;
}

// ---------- who is this ----------

export type PanelContext = {
  session: SessionPayload;
  user: UserDoc;
  hoje: string;
  // the active fundraising project, if any
  projeto: ProjetoDoc | null;
  // the member's team in that project, if any
  equipe: EquipeDoc | null;
  papeis: Papeis;
};

export async function activeProject(tipo: "arrecadacao" | "testemunho" = "arrecadacao") {
  const hoje = todayInBrazil();
  // The project running today; failing that, the most recent active one.
  const running = (await HjProjeto.findOne({ tipo, ativo: true, inicio: { $lte: hoje }, fim: { $gte: hoje } })
    .sort({ inicio: -1 })
    .lean()) as ProjetoDoc | null;
  if (running) {
    return running;
  }
  return (await HjProjeto.findOne({ tipo, ativo: true }).sort({ inicio: -1 }).lean()) as ProjetoDoc | null;
}

export async function loadContext(session: SessionPayload): Promise<PanelContext | null> {
  const user = (await AcademyUser.findById(session.userId).select(USER_FIELDS).lean()) as UserDoc | null;
  if (!user) {
    return null;
  }

  const projeto = await activeProject("arrecadacao");
  const equipe = projeto
    ? ((await HjEquipe.findOne({ projetoId: projeto._id, membroIds: user._id }).lean()) as EquipeDoc | null)
    : null;

  const educador = user.role === "tutor";
  const papeis: Papeis = {
    membro: true,
    capitao: Boolean(equipe && sameId(equipe.capitaoId, user._id)),
    educador,
    administrador: educador && user.isAdmin === true,
  };

  return { session, user, hoje: todayInBrazil(), projeto, equipe, papeis };
}

// Teams the person may act on as a follower: their own as captain, the
// ones they educate, all of them as administrator.
export async function teamsInScope(context: PanelContext, projetoId?: Types.ObjectId | null) {
  const filter: Record<string, unknown> = {};
  if (projetoId) {
    filter.projetoId = projetoId;
  }
  if (context.papeis.administrador) {
    return (await HjEquipe.find(filter).lean()) as EquipeDoc[];
  }
  const clauses: Record<string, unknown>[] = [{ capitaoId: context.user._id }];
  if (context.papeis.educador) {
    clauses.push({ educadorId: context.user._id });
  }
  return (await HjEquipe.find({ ...filter, $or: clauses }).lean()) as EquipeDoc[];
}

export function canValidate(context: PanelContext, equipe: EquipeDoc) {
  return (
    context.papeis.administrador ||
    sameId(equipe.capitaoId, context.user._id) ||
    (context.papeis.educador && sameId(equipe.educadorId, context.user._id))
  );
}

// ---------- shaping ----------

export function projetoResumo(doc: ProjetoDoc, hoje: string): ProjetoResumo {
  const dias = daysBetween(doc.inicio, doc.fim);
  const passados = dias.filter((dia) => dia <= hoje).length;
  return {
    id: doc._id.toString(),
    nome: doc.nome,
    tipo: doc.tipo,
    inicio: doc.inicio,
    fim: doc.fim,
    ativo: doc.ativo,
    hoje,
    diaAtual: Math.min(Math.max(passados, 0), dias.length),
    totalDias: dias.length,
    diasDescanso: doc.diasDescanso ?? [],
    moeda: doc.moeda ?? "BRL",
  };
}

export async function usersById(ids: Iterable<Types.ObjectId | string>) {
  const unique = [...new Set([...ids].map(String))].map((id) => new Types.ObjectId(id));
  const docs = (await AcademyUser.find({ _id: { $in: unique } }).select(USER_FIELDS).lean()) as UserDoc[];
  return new Map(docs.map((doc) => [doc._id.toString(), doc]));
}

export function equipeResumo(equipe: EquipeDoc, users: Map<string, UserDoc>): EquipeResumo {
  return {
    id: equipe._id.toString(),
    nome: equipe.nome,
    programa: equipe.programa,
    capitao: ref(equipe.capitaoId ? users.get(String(equipe.capitaoId)) : null),
    educador: ref(equipe.educadorId ? users.get(String(equipe.educadorId)) : null),
  };
}

export function relatorioRow(
  doc: RelatorioDoc,
  users: Map<string, UserDoc>,
  equipes: Map<string, EquipeDoc>,
): RelatorioRow {
  const membro = users.get(String(doc.membroId));
  const equipe = equipes.get(String(doc.equipeId));
  return {
    id: doc._id.toString(),
    data: doc.data,
    dinheiroCents: doc.dinheiroCents,
    pixCents: doc.pixCents,
    despesasCents: doc.despesasCents,
    liquidoCents: doc.liquidoCents,
    itens: doc.itens,
    contatos: doc.contatos,
    observacoes: doc.observacoes ?? "",
    estado: doc.estado,
    motivoDevolucao: doc.motivoDevolucao ?? "",
    enviadoEm: doc.enviadoEm.toISOString(),
    validadoPor: ref(doc.validadoPorId ? users.get(String(doc.validadoPorId)) : null),
    validadoEm: doc.validadoEm ? doc.validadoEm.toISOString() : null,
    membro: { id: String(doc.membroId), nome: membro?.fullName ?? "—" },
    equipe: {
      id: String(doc.equipeId),
      nome: equipe?.nome ?? "—",
      programa: equipe?.programa ?? "HJA",
    },
  };
}

// The days the spreadsheet counts: validated or sent (a returned report is
// not a result until it is corrected).
export function countsAsResult(estado: RelatorioEstado) {
  return estado !== "devolvido";
}

export function rmResumo(projeto: ProjetoDoc, relatorios: RelatorioDoc[], hoje: string): RmResumo {
  const validos = relatorios.filter((item) => countsAsResult(item.estado));
  const valores = validos.map((item) => item.liquidoCents);
  const mediaCents = media(valores);
  const byDay = new Map(relatorios.map((item) => [item.data, item]));
  const descanso = new Set(projeto.diasDescanso ?? []);

  const ultimos7: DiaResumo[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const data = addDays(hoje, -offset);
    const doc = byDay.get(data);
    ultimos7.push({
      data,
      descanso: descanso.has(data),
      liquidoCents: doc && countsAsResult(doc.estado) ? doc.liquidoCents : null,
      estado: doc?.estado ?? null,
    });
  }

  return {
    metaCents: novaMeta(mediaCents, projeto.regraNovaMeta, projeto.metaDiariaPadraoCents, validos.length),
    mediaCents,
    recordeCents: recorde(valores),
    totalCents: valores.reduce((sum, value) => sum + value, 0),
    diasEnviados: validos.length,
    ultimos7,
  };
}

export function computeLiquido(body: { dinheiroCents: number; pixCents: number; despesasCents: number }) {
  return liquido(body.dinheiroCents, body.pixCents, body.despesasCents);
}

export function convidadoRow(
  doc: ConvidadoDoc,
  users: Map<string, UserDoc>,
  equipeDe: (membroId: string) => EquipeDoc | undefined,
  hoje: string,
): ConvidadoRow {
  const responsavel = users.get(String(doc.responsavelId));
  const equipe = equipeDe(String(doc.responsavelId));
  const datas: ConvidadoDatas = {
    primeiroContato: doc.datas?.primeiroContato ?? null,
    gateway: doc.datas?.gateway ?? null,
    fichaAssinada: doc.datas?.fichaAssinada ?? null,
    inicioSistema1: doc.datas?.inicioSistema1 ?? null,
    fimSistema1: doc.datas?.fimSistema1 ?? null,
    inicioSistema2: doc.datas?.inicioSistema2 ?? null,
    jardim: doc.datas?.jardim ?? null,
  };
  return {
    id: doc._id.toString(),
    nome: doc.nome,
    telefone: doc.telefone ?? "",
    cidade: doc.cidade ?? "",
    origem: doc.origem ?? "",
    etapa: doc.etapa,
    conferencias: doc.conferencias ?? 0,
    ultimoContato: doc.ultimoContato ?? null,
    proximoObjetivo: doc.proximoObjetivo ?? "",
    responsavel: { id: String(doc.responsavelId), nome: responsavel?.fullName ?? "—" },
    equipe: equipe ? { id: equipe._id.toString(), nome: equipe.nome, programa: equipe.programa } : null,
    alerta: alertaDe({ etapa: doc.etapa, conferencias: doc.conferencias ?? 0, ultimoContato: doc.ultimoContato ?? null, datas }, hoje),
    datas,
    atualizadoEm: (doc.updatedAt ?? new Date()).toISOString(),
  };
}

// Members a person may see guests of: themselves, everyone in the teams
// they follow (captain, educator), everyone at all for an administrator.
// `equipes` also carries the person's own team, so their guests show it.
export async function membersInScope(context: PanelContext) {
  const ids = new Set<string>([context.user._id.toString()]);
  const followed = await teamsInScope(context, context.projeto?._id ?? null);
  for (const equipe of followed) {
    for (const id of equipe.membroIds) {
      ids.add(String(id));
    }
  }
  const equipes = [...followed];
  if (context.equipe && !equipes.some((equipe) => sameId(equipe._id, context.equipe!._id))) {
    equipes.push(context.equipe);
  }
  if (context.papeis.administrador) {
    const everyone = (await AcademyUser.find().select("_id").lean()) as { _id: Types.ObjectId }[];
    for (const user of everyone) {
      ids.add(user._id.toString());
    }
  }
  return { ids, equipes };
}

export function equipeLookup(equipes: EquipeDoc[]) {
  const byMember = new Map<string, EquipeDoc>();
  for (const equipe of equipes) {
    for (const id of equipe.membroIds) {
      byMember.set(String(id), equipe);
    }
  }
  return (membroId: string) => byMember.get(membroId);
}

export async function guestsOf(ids: Iterable<string>) {
  const list = [...ids].map((id) => new Types.ObjectId(id));
  return (await HjConvidado.find({ responsavelId: { $in: list } }).sort({ updatedAt: -1 }).lean()) as ConvidadoDoc[];
}

export async function reportsOf(projetoId: Types.ObjectId, filter: Record<string, unknown> = {}) {
  return (await HjRelatorio.find({ projetoId, ...filter }).sort({ data: 1 }).lean()) as RelatorioDoc[];
}
