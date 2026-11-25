import { addDays, isIsoDay } from "@/lib/hj/dates";

import { fmtMes, fmtMoeda, mesDe, MOEDAS, parseValor, porCategoria, resumo, saldos, somaMes, type Categoria, type Moeda, type Movimento } from "./contabilidade";
import type { Proposta } from "./contabilidade-assistente";

// The Contabilidade's assistant on the server (Victor, 25/11/2026: "no puede
// quedar nada moqueado"). Claude reads what the person wrote or the photo of a
// receipt and answers with movements to confirm, or answers a question from
// the book's numbers; a voice note becomes text first (Whisper on Groq, as in
// Tensai Plan). Nothing is saved here: the person confirms each card.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export const MODELO = () => process.env.AI_MODEL || "claude-sonnet-5-5";
const chaveIA = () => process.env.ANTHROPIC_API_KEY || "";
const chaveAudio = () => process.env.GROQ_API_KEY || "";

export function aiDisponivel() {
  const texto = Boolean(chaveIA());
  return { texto, foto: texto, audio: texto && Boolean(chaveAudio()) };
}

export const MAX_MOVIMENTOS = 20;
export const MAX_AUDIO = 4 * 1024 * 1024;

export type Anexo = { mime: string; base64: string };

export type RespostaIA = { texto: string; propostas: Proposta[] };

export class IaIndisponivel extends Error {}

// ---- what the model is told -------------------------------------------------

function resumoDoLivro(movimentos: Movimento[], moedas: Moeda[], hoje: string, categoria: (id: string | null) => Categoria | undefined) {
  const linhas: string[] = [];
  const mes = mesDe(hoje);
  const passado = somaMes(mes, -1);
  linhas.push("Saldos hoje:");
  for (const saldo of saldos(movimentos, moedas)) {
    linhas.push(`- ${saldo.moeda}: ${fmtMoeda(saldo.total, saldo.moeda)} (dinheiro ${fmtMoeda(saldo.dinheiro, saldo.moeda)}, Pix/conta ${fmtMoeda(saldo.conta, saldo.moeda)})`);
  }
  const periodos: [string, (dia: string) => boolean][] = [
    ["Hoje", (dia) => dia === hoje],
    ["Ontem", (dia) => dia === addDays(hoje, -1)],
    [`Este mês (${fmtMes(mes)})`, (dia) => mesDe(dia) === mes],
    [`Mês passado (${fmtMes(passado)})`, (dia) => mesDe(dia) === passado],
    [`Ano de ${hoje.slice(0, 4)}`, (dia) => dia.startsWith(hoje.slice(0, 4))],
  ];
  for (const [nome, dentro] of periodos) {
    for (const moeda of moedas) {
      const total = resumo(movimentos, moeda, dentro);
      if (!total.entradas && !total.saidas) {
        continue;
      }
      const gastos = porCategoria(movimentos, "saida", moeda, dentro, categoria)
        .map((fatia) => `${fatia.categoria.nome} ${fmtMoeda(fatia.valor, moeda)} (${fatia.quantos})`)
        .join("; ");
      const entradas = porCategoria(movimentos, "entrada", moeda, dentro, categoria)
        .map((fatia) => `${fatia.categoria.nome} ${fmtMoeda(fatia.valor, moeda)} (${fatia.quantos})`)
        .join("; ");
      linhas.push(`${nome}, ${moeda}: entradas ${fmtMoeda(total.entradas, moeda)} [${entradas || "—"}]; gastos ${fmtMoeda(total.saidas, moeda)} [${gastos || "—"}]`);
    }
  }
  const recentes = movimentos.slice(0, 40).map((mov) => {
    const cat = categoria(mov.categoriaId)?.nome ?? (mov.tipo === "transferencia" ? "Transferência" : mov.tipo === "ajuste" ? "Ajuste" : "");
    return `${mov.data} ${mov.tipo} ${fmtMoeda(mov.valorMinor, mov.moeda)} ${mov.meio} · ${cat} · ${mov.descricao} · ${mov.responsavel}`;
  });
  linhas.push("Últimos movimentos (mais novo primeiro):", ...recentes);
  return linhas.join("\n");
}

function sistema(input: { hoje: string; livroNome: string; moedas: Moeda[]; categorias: Categoria[]; resumo: string; pessoa: string }) {
  const cats = (tipo: "saida" | "entrada") =>
    input.categorias
      .filter((item) => item.tipo === tipo)
      .map((item) => `${item.id} = ${item.nome}`)
      .join("; ");
  return [
    `Você é o assistente da contabilidade do Time HJ (Pure Water Wave). Fala com ${input.pessoa}, em português do Brasil, curto e claro.`,
    `Hoje é ${input.hoje} (${new Date(`${input.hoje}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" })}). A contabilidade aberta é "${input.livroNome}".`,
    "",
    "Sua tarefa: quando a pessoa conta um gasto ou uma entrada (por texto, áudio transcrito ou a foto de um comprovante), proponha os movimentos; quando ela pergunta algo, responda com os números abaixo (movimentos vazio).",
    "",
    "Regras dos movimentos:",
    "- Um movimento por valor. \"18 de ônibus e 32 no almoço\" são dois gastos.",
    `- tipo "saida" é dinheiro que saiu (gasto, pagamento, empréstimo dado); "entrada" é dinheiro que entrou (arrecadação de RM, doação, devolução).`,
    `- Categorias de gasto: ${cats("saida")}.`,
    `- Categorias de entrada: ${cats("entrada")}.`,
    `- moeda: uma de ${input.moedas.join(", ")} (moedas ligadas) ou outra de ${Object.keys(MOEDAS).join(", ")} se a pessoa disser. Sem moeda dita, BRL. Nunca converta moedas.`,
    `- meio: "conta" quando foi Pix, cartão de débito, transferência ou conta; "dinheiro" quando foi em espécie ou não foi dito.`,
    "- valor: número em unidades da moeda (12.5 = doze e cinquenta). Nunca invente um valor: sem valor, não proponha o movimento e pergunte.",
    `- data: AAAA-MM-DD. "ontem" = ${addDays(input.hoje, -1)}. Sem data dita, hoje. Nunca depois de hoje.`,
    "- descricao: curta, o que foi (\"Ônibus\", \"Almoço\", \"Doação da família Silva\"). Num comprovante, o nome da loja e o que foi comprado.",
    "- revisar: true quando você não teve certeza do valor, da categoria, da data ou da moeda.",
    `- No máximo ${MAX_MOVIMENTOS} movimentos por mensagem.`,
    "- Num comprovante, use o TOTAL pago e a data impressa (se a data impressa for depois de hoje ou ilegível, use hoje e marque revisar).",
    "",
    "Respostas: no campo `resposta`, uma ou duas frases. Quando houver movimentos, diga só algo como \"Entendi assim. Confira e confirme:\". Para perguntas, responda com os números do resumo (valores no formato R$ 1.234,56); se a resposta não está no resumo, diga que não tem esse dado. Nada é salvo sem a pessoa confirmar cada cartão.",
    "",
    "Resumo da contabilidade aberta:",
    input.resumo,
  ].join("\n");
}

// A resposta vem como JSON neste formato (structured outputs: os modelos 5.5
// não aceitam forçar uma ferramenta com tool_choice).
const FORMATO = (categorias: Categoria[]) => ({
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      resposta: { type: "string", description: "O que dizer à pessoa, em português, uma ou duas frases." },
      movimentos: {
        type: "array",
        items: {
          additionalProperties: false,
          type: "object",
          properties: {
            tipo: { type: "string", enum: ["saida", "entrada"] },
            valor: { type: "number", description: "Em unidades da moeda: 12.5 = doze e cinquenta" },
            moeda: { type: "string", enum: Object.keys(MOEDAS) },
            meio: { type: "string", enum: ["dinheiro", "conta"] },
            categoriaId: { type: "string", enum: categorias.map((item) => item.id) },
            data: { type: "string", description: "AAAA-MM-DD" },
            descricao: { type: "string" },
            revisar: { type: "boolean" },
          },
          required: ["tipo", "valor", "moeda", "meio", "categoriaId", "data", "descricao", "revisar"],
        },
      },
    },
    required: ["resposta", "movimentos"],
  },
});

type Bruto = { tipo?: unknown; valor?: unknown; moeda?: unknown; meio?: unknown; categoriaId?: unknown; data?: unknown; descricao?: unknown; revisar?: unknown };

// The model's movements, checked: a wrong category, a day after today or an
// amount that is not one never reach a card as if they were sure.
export function propostasDe(brutos: unknown, input: { hoje: string; categorias: Categoria[] }): Proposta[] {
  if (!Array.isArray(brutos)) {
    return [];
  }
  const out: Proposta[] = [];
  for (const raw of brutos.slice(0, MAX_MOVIMENTOS) as Bruto[]) {
    const tipo = raw.tipo === "entrada" ? "entrada" : raw.tipo === "saida" ? "saida" : null;
    if (!tipo) {
      continue;
    }
    const moeda = typeof raw.moeda === "string" && Object.hasOwn(MOEDAS, raw.moeda) ? (raw.moeda as Moeda) : "BRL";
    const valor = typeof raw.valor === "number" && raw.valor > 0 ? parseValor(raw.valor.toFixed(MOEDAS[moeda].decimais).replace(".", ","), moeda) : null;
    if (!valor) {
      continue;
    }
    let revisar = raw.revisar === true;
    const categoria = input.categorias.find((item) => item.id === raw.categoriaId && item.tipo === tipo);
    if (!categoria) {
      revisar = true;
    }
    let data = typeof raw.data === "string" && isIsoDay(raw.data) ? raw.data : input.hoje;
    if (data > input.hoje) {
      data = input.hoje;
      revisar = true;
    }
    out.push({
      tipo,
      valorMinor: valor,
      moeda,
      meio: raw.meio === "conta" ? "conta" : "dinheiro",
      categoriaId: categoria?.id ?? (tipo === "saida" ? "outros" : "outras-entradas"),
      data,
      descricao: typeof raw.descricao === "string" ? raw.descricao.trim().slice(0, 120) : "",
      revisar,
    });
  }
  return out;
}

type Bloco = { type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: string; data: string } } | { type: "document"; source: { type: "base64"; media_type: string; data: string } };
type Mensagem = { role: "user" | "assistant"; content: string | Bloco[] };

export async function perguntarIA(input: {
  mensagem: string;
  anexo?: Anexo | null;
  historico?: { de: "eu" | "assistente"; texto: string }[];
  hoje: string;
  livroNome: string;
  pessoa: string;
  movimentos: Movimento[];
  moedas: Moeda[];
  categorias: Categoria[];
  fetcher?: typeof fetch;
}): Promise<RespostaIA> {
  const key = chaveIA();
  if (!key) {
    throw new IaIndisponivel("ANTHROPIC_API_KEY não configurada");
  }
  const categoria = (id: string | null) => (id ? input.categorias.find((item) => item.id === id) : undefined);
  const system = sistema({
    hoje: input.hoje,
    livroNome: input.livroNome,
    moedas: input.moedas,
    categorias: input.categorias,
    resumo: resumoDoLivro(input.movimentos, input.moedas, input.hoje, categoria),
    pessoa: input.pessoa,
  });
  const mensagens: Mensagem[] = [];
  for (const item of (input.historico ?? []).slice(-8)) {
    const role = item.de === "eu" ? "user" : "assistant";
    const ultimo = mensagens[mensagens.length - 1];
    if (ultimo && ultimo.role === role && typeof ultimo.content === "string") {
      ultimo.content += `\n${item.texto}`;
    } else if (mensagens.length || role === "user") {
      mensagens.push({ role, content: item.texto.slice(0, 2000) });
    }
  }
  const conteudo: Bloco[] = [];
  if (input.anexo) {
    conteudo.push(
      input.anexo.mime === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: input.anexo.base64 } }
        : { type: "image", source: { type: "base64", media_type: input.anexo.mime, data: input.anexo.base64 } },
    );
  }
  conteudo.push({ type: "text", text: input.mensagem.slice(0, 4000) || "Leia este comprovante e proponha o movimento." });
  if (mensagens.length && mensagens[mensagens.length - 1].role === "user") {
    mensagens.push({ role: "assistant", content: "Certo." });
  }
  mensagens.push({ role: "user", content: conteudo });

  const response = await (input.fetcher ?? fetch)(ANTHROPIC_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODELO(),
      max_tokens: 8000,
      system,
      output_config: { effort: "low", format: FORMATO(input.categorias) },
      messages: mensagens,
    }),
    signal: AbortSignal.timeout(55_000),
  });
  if (!response.ok) {
    const detalhe = await response.text().catch(() => "");
    throw new Error(`Anthropic ${response.status}: ${detalhe.slice(0, 300)}`);
  }
  const json = (await response.json()) as { stop_reason?: string; content?: { type: string; text?: string }[] };
  if (json.stop_reason === "refusal") {
    return { texto: "Não posso ajudar com isso. Conte um gasto, uma entrada ou pergunte sobre os números.", propostas: [] };
  }
  const texto0 = json.content?.find((bloco) => bloco.type === "text")?.text ?? "";
  let uso: { input?: { resposta?: unknown; movimentos?: unknown } } | undefined;
  try {
    uso = { input: JSON.parse(texto0) as { resposta?: unknown; movimentos?: unknown } };
  } catch {
    uso = undefined;
  }
  const propostas = propostasDe(uso?.input?.movimentos, { hoje: input.hoje, categorias: input.categorias });
  const texto = typeof uso?.input?.resposta === "string" && uso.input.resposta.trim() ? uso.input.resposta.trim() : propostas.length ? "Entendi assim. Confira e confirme:" : "Não entendi. Pode dizer de outro jeito?";
  return { texto, propostas };
}

// ---- voice -------------------------------------------------------------------

/* What Whisper writes over silence or noise, compared after normalising. */
const ALUCINACOES = ["obrigado", "obrigada", "obrigado por assistir", "legendas pela comunidade amaraorg", "gracias", "gracias por ver el video", "thank you", "thanks for watching", "musica", "you", "tchau"];

const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function transcricaoVazia(texto: string, noSpeech?: number | null) {
  const n = normal(texto);
  return !n || (typeof noSpeech === "number" && noSpeech > 0.6) || ALUCINACOES.includes(n);
}

export function tipoDoAudio(buf: Uint8Array): { mime: string; ext: string } | null {
  if (buf.length < 12) {
    return null;
  }
  const ascii = (from: number, len: number) => String.fromCharCode(...buf.subarray(from, from + len));
  if (ascii(0, 4) === "OggS") {
    return { mime: "audio/ogg", ext: "ogg" };
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { mime: "audio/webm", ext: "webm" };
  }
  if (ascii(4, 4) === "ftyp") {
    return { mime: "audio/mp4", ext: "m4a" };
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") {
    return { mime: "audio/wav", ext: "wav" };
  }
  if (ascii(0, 3) === "ID3" || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) {
    return { mime: "audio/mpeg", ext: "mp3" };
  }
  return null;
}

export async function transcrever(bytes: Buffer, fetcher: typeof fetch = fetch): Promise<{ ok: true; texto: string } | { ok: false; motivo: "vazio" | "formato" | "grande" | "falhou" | "ocupado" }> {
  const key = chaveAudio();
  if (!key) {
    throw new IaIndisponivel("GROQ_API_KEY não configurada");
  }
  if (bytes.length > MAX_AUDIO) {
    return { ok: false, motivo: "grande" };
  }
  const tipo = tipoDoAudio(bytes);
  if (!tipo) {
    return { ok: false, motivo: "formato" };
  }
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: tipo.mime }), `nota.${tipo.ext}`);
  form.append("model", process.env.TRANSCRIBE_MODEL || "whisper-large-v3-turbo");
  form.append("language", "pt");
  form.append("response_format", "verbose_json");
  const response = await fetcher(GROQ_URL, { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(45_000) });
  if (response.status === 429) {
    return { ok: false, motivo: "ocupado" };
  }
  if (!response.ok) {
    return { ok: false, motivo: "falhou" };
  }
  const json = (await response.json()) as { text?: string; segments?: { no_speech_prob?: number }[] };
  const texto = (json.text ?? "").trim();
  const noSpeech = json.segments?.length ? Math.min(...json.segments.map((seg) => seg.no_speech_prob ?? 0)) : null;
  return transcricaoVazia(texto, noSpeech) ? { ok: false, motivo: "vazio" } : { ok: true, texto };
}
