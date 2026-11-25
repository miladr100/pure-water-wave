import { Types } from "mongoose";

import { equipesAdmin } from "@/app/api/admin/hj/_lib/equipes";
import { isIsoDay } from "@/lib/hj/dates";
import { despesasItensDe, usersById, type PanelContext, type RelatorioDoc } from "@/lib/hj/data";
import type { EquipeAdmin } from "@/lib/hj/types";
import { HjContabComprovante } from "@/models/hj-contab-comprovante";
import { HjContabConfig } from "@/models/hj-contab-config";
import { HjContabMovimento } from "@/models/hj-contab-movimento";
import { HjRelatorio } from "@/models/hj-relatorio";

import {
  CATEGORIAS_BASE,
  MOEDA_ORDEM,
  MOEDAS,
  VALOR_MAXIMO,
  type Categoria,
  type Comprovante,
  type Meio,
  type Moeda,
  type Movimento,
  type MovimentoNovo,
  type Origem,
  type ProjetoContabil,
  type TipoMovimento,
} from "./contabilidade";

// The Contabilidade on the server: who sees which books, the movements of a
// book (the stored ones plus what validated RM reports bring), and the checks
// every write goes through — the screens, the assistant and the agent
// connector all end here.

export const GERAL_ID = "geral";
export const GERAL_NOME = "Time HJ — Geral";
// the oldest day a movement may carry
export const DATA_MINIMA = "2020-01-01";

export type Grupo = { id: string; nome: string; projetoIds: string[] };

export type Lado = "painel" | "admin";

export type Acesso = {
  lado: Lado;
  livros: ProjetoContabil[];
  grupos: Grupo[];
  // sees every book (administrator, or an educator the administrator allowed)
  veTudo: boolean;
};

const projetoDe = (equipe: EquipeAdmin): ProjetoContabil => ({
  id: equipe.id,
  nome: equipe.nome,
  tipo: "equipe",
  programa: equipe.programa,
  area: equipe.area?.local.nome ?? null,
  educador: equipe.educador?.nome ?? null,
  capitao: equipe.capitao?.nome ?? null,
  membros: equipe.membros.map((membro) => membro.nome),
});

const GERAL: ProjetoContabil = {
  id: GERAL_ID,
  nome: GERAL_NOME,
  tipo: "geral",
  programa: null,
  area: null,
  educador: null,
  capitao: null,
  membros: [],
};

export async function lerConfig() {
  const doc = await HjContabConfig.findById("contabilidade").lean();
  const moedas = new Map<string, Moeda[]>();
  const raw = doc?.moedas as unknown;
  const entries = raw instanceof Map ? [...raw.entries()] : Object.entries((raw ?? {}) as Record<string, string[]>);
  for (const [livro, lista] of entries) {
    moedas.set(livro, (lista as string[]).filter((moeda): moeda is Moeda => Object.hasOwn(MOEDAS, moeda)));
  }
  const extras: Categoria[] = (doc?.categorias ?? []).map((item) => ({
    id: item.id,
    nome: item.nome,
    tipo: item.tipo as "saida" | "entrada",
    icone: "etiqueta",
    cor: 0,
  }));
  return {
    categorias: [...CATEGORIAS_BASE, ...extras],
    extras,
    moedas,
    veTodas: (doc?.veTodas ?? []).map(String),
  };
}

export async function veTudo(context: PanelContext) {
  if (context.papeis.administrador) {
    return true;
  }
  if (!context.papeis.educador) {
    return false;
  }
  return (await lerConfig()).veTodas.includes(String(context.user._id));
}

// Which books a person sees from one side of the panel. The captain sees the
// book of their team (painel); educators see the teams they look after, and
// everything when allowed (admin).
export async function acessoContabil(context: PanelContext, lado: Lado, carregadas?: EquipeAdmin[]): Promise<Acesso> {
  const equipes = carregadas ?? (context.projeto ? await equipesAdmin(context.projeto) : []);
  if (lado === "painel") {
    const minha = context.papeis.capitao && context.equipe ? equipes.find((item) => item.id === String(context.equipe?._id)) : undefined;
    return { lado, livros: minha ? [projetoDe(minha)] : [], grupos: [], veTudo: false };
  }
  if (!context.papeis.educador) {
    return { lado, livros: [], grupos: [], veTudo: false };
  }
  const tudo = await veTudo(context);
  const minhas = equipes.filter((equipe) => tudo || equipe.educador?.id === String(context.user._id));
  // an area becomes a set when it joins more than one team, without being all of them
  const porArea = new Map<string, Grupo>();
  for (const equipe of minhas) {
    for (const area of [equipe.area?.regiao, equipe.area?.pais, equipe.area?.local]) {
      if (!area) {
        continue;
      }
      const grupo = porArea.get(area.id) ?? { id: area.id, nome: area.nome, projetoIds: [] };
      grupo.projetoIds.push(equipe.id);
      porArea.set(area.id, grupo);
    }
  }
  const vistos = new Set<string>();
  const grupos = [...porArea.values()].filter((grupo) => {
    const chave = [...grupo.projetoIds].sort().join(",");
    if (grupo.projetoIds.length < 2 || grupo.projetoIds.length >= minhas.length || vistos.has(chave)) {
      return false;
    }
    vistos.add(chave);
    return true;
  });
  const livros = minhas.map(projetoDe);
  return { lado, livros: tudo ? [...livros, GERAL] : livros, grupos, veTudo: tudo };
}

// Every book a person may touch, from either side (the assistant and the
// agent connector are not on a side).
export async function livrosPermitidos(context: PanelContext) {
  // as equipes uma vez só: carregá-las duas vezes em paralelo disputava a
  // criação das áreas padrão (AreasTree.load) e uma das duas falhava
  const equipes = context.projeto ? await equipesAdmin(context.projeto) : [];
  const painel = await acessoContabil(context, "painel", equipes);
  const admin = await acessoContabil(context, "admin", equipes);
  const map = new Map<string, ProjetoContabil>();
  for (const livro of [...admin.livros, ...painel.livros]) {
    map.set(livro.id, livro);
  }
  return [...map.values()];
}

// ---- reading ---------------------------------------------------------------

type MovimentoDoc = {
  _id: Types.ObjectId;
  livroId: string;
  tipo: TipoMovimento;
  valorMinor: number;
  moeda: string;
  meio: Meio;
  categoriaId: string | null;
  data: string;
  descricao: string;
  responsavel: string;
  origem: Origem;
  pendente: boolean;
  comprovanteId: Types.ObjectId | null;
  para?: { moeda: string; meio: Meio; valorMinor: number } | null;
  seq: number;
};

export function movimentoDeDoc(doc: MovimentoDoc, comprovantes: Map<string, Comprovante>): Movimento {
  return {
    id: String(doc._id),
    projetoId: doc.livroId,
    tipo: doc.tipo,
    valorMinor: doc.valorMinor,
    moeda: doc.moeda as Moeda,
    meio: doc.meio,
    categoriaId: doc.categoriaId ?? null,
    data: doc.data,
    descricao: doc.descricao ?? "",
    responsavel: doc.responsavel ?? "",
    origem: doc.origem,
    pendente: Boolean(doc.pendente),
    comprovante: doc.comprovanteId ? (comprovantes.get(String(doc.comprovanteId)) ?? null) : null,
    ...(doc.para ? { para: { moeda: doc.para.moeda as Moeda, meio: doc.para.meio, valorMinor: doc.para.valorMinor } } : {}),
    seq: doc.seq,
  };
}

async function comprovantesDe(ids: (Types.ObjectId | null)[]) {
  const validos = ids.filter((id): id is Types.ObjectId => id != null);
  const map = new Map<string, Comprovante>();
  if (!validos.length) {
    return map;
  }
  const docs = await HjContabComprovante.find({ _id: { $in: validos } })
    .select("nome mime")
    .lean();
  for (const doc of docs) {
    map.set(String(doc._id), { id: String(doc._id), nome: doc.nome ?? "comprovante", mime: doc.mime });
  }
  return map;
}

// What a validated RM report brings to its team's book: the cash and the Pix
// as entries, each expense of the day as an expense paid in cash.
export function movimentosDoRelatorio(relatorio: RelatorioDoc, membro: string): Movimento[] {
  const livroId = String(relatorio.equipeId);
  const base = {
    projetoId: livroId,
    moeda: "BRL" as Moeda,
    data: relatorio.data,
    responsavel: membro,
    origem: "relatorio" as Origem,
    pendente: false,
    comprovante: null,
  };
  const seq = relatorio.validadoEm ? new Date(relatorio.validadoEm).getTime() : 0;
  const out: Movimento[] = [];
  const id = String(relatorio._id);
  if (relatorio.dinheiroCents > 0) {
    out.push({ ...base, id: `rel:${id}:d`, tipo: "entrada", valorMinor: relatorio.dinheiroCents, meio: "dinheiro", categoriaId: "rm", descricao: "Relatório de RM", seq });
  }
  if (relatorio.pixCents > 0) {
    out.push({ ...base, id: `rel:${id}:p`, tipo: "entrada", valorMinor: relatorio.pixCents, meio: "conta", categoriaId: "rm", descricao: "Relatório de RM · Pix", seq: seq + 1 });
  }
  despesasItensDe(relatorio).forEach((item, index) => {
    if (item.valorCents > 0) {
      const categoria = CATEGORIAS_BASE.find((cat) => cat.id === item.categoria && cat.tipo === "saida");
      out.push({
        ...base,
        id: `rel:${id}:s${index}`,
        tipo: "saida",
        valorMinor: item.valorCents,
        meio: "dinheiro",
        categoriaId: categoria?.id ?? "outros",
        descricao: `Relatório de RM · ${categoria?.nome ?? "Despesa"}`,
        seq: seq + 2 + index,
      });
    }
  });
  return out;
}

export async function movimentosDosLivros(livroIds: string[]): Promise<Movimento[]> {
  if (!livroIds.length) {
    return [];
  }
  const docs = (await HjContabMovimento.find({ livroId: { $in: livroIds }, removidoEm: null }).lean()) as unknown as MovimentoDoc[];
  const comprovantes = await comprovantesDe(docs.map((doc) => doc.comprovanteId));
  const guardados = docs.map((doc) => movimentoDeDoc(doc, comprovantes));

  const equipeIds = livroIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  const relatorios = equipeIds.length
    ? ((await HjRelatorio.find({ equipeId: { $in: equipeIds }, estado: "validado" }).lean()) as unknown as RelatorioDoc[])
    : [];
  const users = await usersById(relatorios.map((item) => item.membroId));
  const doRm = relatorios.flatMap((item) => movimentosDoRelatorio(item, users.get(String(item.membroId))?.fullName ?? "Membro"));
  return [...guardados, ...doRm];
}

// The currencies a book shows: real, the ones switched on, and any it used.
export function moedasDoLivro(livroId: string, movimentos: Movimento[], ligadas: Map<string, Moeda[]>): Moeda[] {
  const usadas = new Set<Moeda>(["BRL", ...(ligadas.get(livroId) ?? [])]);
  for (const mov of movimentos) {
    if (mov.projetoId === livroId) {
      usadas.add(mov.moeda);
      if (mov.para) {
        usadas.add(mov.para.moeda);
      }
    }
  }
  return MOEDA_ORDEM.filter((moeda) => usadas.has(moeda));
}

// ---- writing ---------------------------------------------------------------

export type Falha = { ok: false; status: number; code: string; error: string };
const falha = (code: string, error: string, status = 400): Falha => ({ ok: false, status, code, error });

const ehMoeda = (raw: unknown): raw is Moeda => typeof raw === "string" && Object.hasOwn(MOEDAS, raw);
const ehMeio = (raw: unknown): raw is Meio => raw === "dinheiro" || raw === "conta";
const inteiro = (raw: unknown) => (typeof raw === "number" && Number.isInteger(raw) ? raw : null);
const texto = (raw: unknown, max: number) => (typeof raw === "string" ? raw.trim().slice(0, max) : "");

export type Validado = {
  livroId: string;
  tipo: TipoMovimento;
  valorMinor: number;
  moeda: Moeda;
  meio: Meio;
  categoriaId: string | null;
  data: string;
  descricao: string;
  responsavel: string;
  pendente: boolean;
  comprovanteId: Types.ObjectId | null;
  para?: { moeda: Moeda; meio: Meio; valorMinor: number };
};

// Checks one movement as a person, the assistant or an agent sent it.
export async function validarMovimento(
  body: Partial<MovimentoNovo> & { comprovanteId?: unknown },
  opcoes: { livros: ProjetoContabil[]; categorias: Categoria[]; hoje: string; responsavelPadrao: string },
): Promise<{ ok: true; value: Validado } | Falha> {
  const livro = opcoes.livros.find((item) => item.id === body.projetoId);
  if (!livro) {
    return falha("BOOK_NOT_ALLOWED", "Escolha uma contabilidade que você pode ver", 403);
  }
  const tipo = body.tipo;
  if (tipo !== "saida" && tipo !== "entrada" && tipo !== "transferencia" && tipo !== "ajuste") {
    return falha("INVALID_TYPE", "Tipo de movimento inválido");
  }
  if (!ehMoeda(body.moeda)) {
    return falha("INVALID_CURRENCY", "Moeda inválida");
  }
  const meio = body.meio ?? "dinheiro";
  if (!ehMeio(meio)) {
    return falha("INVALID_METHOD", "Escolha dinheiro ou Pix / conta");
  }
  const valor = inteiro(body.valorMinor);
  if (valor === null || valor === 0 || Math.abs(valor) > VALOR_MAXIMO || (tipo !== "ajuste" && valor < 0)) {
    return falha("INVALID_AMOUNT", "Valor inválido");
  }
  const data = typeof body.data === "string" ? body.data : opcoes.hoje;
  if (!isIsoDay(data) || data < DATA_MINIMA || data > opcoes.hoje) {
    return falha("INVALID_DATE", "A data não pode ser depois de hoje");
  }
  let categoriaId: string | null = null;
  if (tipo === "saida" || tipo === "entrada") {
    const categoria = opcoes.categorias.find((item) => item.id === body.categoriaId && item.tipo === tipo);
    if (!categoria) {
      return falha("INVALID_CATEGORY", "Escolha uma categoria");
    }
    categoriaId = categoria.id;
  }
  let para: Validado["para"];
  if (tipo === "transferencia") {
    const raw = body.para;
    const paraMoeda = raw?.moeda ?? body.moeda;
    const paraMeio = raw?.meio;
    const paraValor = paraMoeda === body.moeda ? valor : inteiro(raw?.valorMinor);
    if (!ehMoeda(paraMoeda) || !ehMeio(paraMeio) || paraValor === null || paraValor <= 0 || paraValor > VALOR_MAXIMO) {
      return falha("INVALID_TRANSFER", "Diga para onde foi o dinheiro e quanto chegou");
    }
    if (paraMoeda === body.moeda && paraMeio === meio) {
      return falha("SAME_PLACE", "A transferência tem de ir para outro lugar");
    }
    para = { moeda: paraMoeda, meio: paraMeio, valorMinor: paraValor };
  }
  let comprovanteId: Types.ObjectId | null = null;
  const pedido = body.comprovanteId ?? body.comprovante?.id ?? null;
  if (pedido) {
    if (typeof pedido !== "string" || !Types.ObjectId.isValid(pedido)) {
      return falha("INVALID_RECEIPT", "Comprovante inválido");
    }
    const doc = await HjContabComprovante.findById(pedido).select("livroId").lean();
    if (!doc || doc.livroId !== livro.id) {
      return falha("INVALID_RECEIPT", "Comprovante não encontrado");
    }
    comprovanteId = new Types.ObjectId(pedido);
  }
  return {
    ok: true,
    value: {
      livroId: livro.id,
      tipo,
      valorMinor: valor,
      moeda: body.moeda,
      meio,
      categoriaId,
      data,
      descricao: texto(body.descricao, 120),
      responsavel: texto(body.responsavel, 80) || opcoes.responsavelPadrao,
      pendente: body.pendente === true,
      comprovanteId,
      ...(para ? { para } : {}),
    },
  };
}

let ultimoSeq = 0;
// strictly increasing inside this process, close to the clock across processes
export function proximoSeq() {
  ultimoSeq = Math.max(Date.now(), ultimoSeq + 1);
  return ultimoSeq;
}

export async function criarMovimento(value: Validado, origem: "manual" | "assistente" | "mcp", autorId: Types.ObjectId) {
  const doc = await HjContabMovimento.create({ ...value, origem, seq: proximoSeq(), autorId });
  const comprovantes = await comprovantesDe([doc.comprovanteId ?? null]);
  return movimentoDeDoc(doc.toObject() as unknown as MovimentoDoc, comprovantes);
}

export async function atualizarMovimento(id: string, value: Validado) {
  const doc = await HjContabMovimento.findOneAndUpdate(
    { _id: id, removidoEm: null },
    { $set: { ...value, para: value.para ?? null } },
    { new: true },
  ).lean();
  if (!doc) {
    return null;
  }
  const comprovantes = await comprovantesDe([doc.comprovanteId ?? null]);
  return movimentoDeDoc(doc as unknown as MovimentoDoc, comprovantes);
}

// The stored movement behind an id, if the person may touch its book.
export async function movimentoGuardado(id: string, livroIds: string[]) {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  const doc = await HjContabMovimento.findById(id).lean();
  if (!doc || !livroIds.includes(doc.livroId)) {
    return null;
  }
  return doc;
}

export const ehDoRelatorio = (id: string) => id.startsWith("rel:");

export const MAX_COMPROVANTE = 3 * 1024 * 1024;
export const MIMES_COMPROVANTE = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// What the bytes say a receipt is, never the declared type.
export function mimeDosBytes(buf: Uint8Array): string | null {
  if (buf.length < 12) {
    return null;
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png";
  }
  const ascii = (from: number, len: number) => String.fromCharCode(...buf.subarray(from, from + len));
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return "image/webp";
  }
  if (ascii(0, 5) === "%PDF-") {
    return "application/pdf";
  }
  return null;
}

export async function guardarComprovante(input: { livroId: string; nome: string; bytes: Buffer; autorId: Types.ObjectId }): Promise<Comprovante | Falha> {
  if (!input.bytes.length) {
    return falha("EMPTY_FILE", "O arquivo está vazio");
  }
  if (input.bytes.length > MAX_COMPROVANTE) {
    return falha("FILE_TOO_BIG", "O arquivo passa de 3 MB", 413);
  }
  const mime = mimeDosBytes(input.bytes);
  if (!mime) {
    return falha("FILE_TYPE", "Envie uma foto (JPEG, PNG, WebP) ou um PDF");
  }
  const doc = await HjContabComprovante.create({
    livroId: input.livroId,
    nome: input.nome.slice(0, 120) || "comprovante",
    mime,
    tamanho: input.bytes.length,
    dados: input.bytes,
    autorId: input.autorId,
  });
  return { id: String(doc._id), nome: doc.nome ?? "comprovante", mime };
}
