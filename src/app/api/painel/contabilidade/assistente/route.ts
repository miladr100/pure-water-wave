import { jsonError, serverError } from "@/lib/academy/http";
import { MOEDA_ORDEM, ordenar, type Comprovante, type Moeda } from "@/lib/hj/contabilidade";
import { aiDisponivel, IaIndisponivel, perguntarIA, transcrever } from "@/lib/hj/contabilidade-ia";
import { guardarComprovante, moedasDoLivro, movimentosDosLivros } from "@/lib/hj/contabilidade-server";
import { HjContabComprovante } from "@/models/hj-contab-comprovante";

import { contabContext, falhaResponse, ok } from "../_lib";

export const maxDuration = 60;

const MOTIVO_AUDIO = {
  vazio: "Não consegui ouvir nada nesse áudio. Tente de novo, mais perto do microfone.",
  formato: "Não reconheci o formato desse áudio.",
  grande: "O áudio é longo demais. Grave até dois minutos.",
  falhou: "Não consegui transcrever o áudio agora. Tente de novo ou escreva.",
  ocupado: "O serviço de áudio está ocupado. Tente de novo em um minuto ou escreva.",
} as const;

// POST (multipart) — one turn of the assistant.
//   mensagem   what the person wrote
//   foto       a receipt (image or PDF): kept as a receipt and read
//   audio      a voice note: transcribed, then read as text
//   livroId    the book new movements go to
//   livroIds   the books open on screen (comma-separated), for questions
//   historico  JSON [{de, texto}] of the conversation so far
// Answers {texto, propostas, comprovante?, transcricao?}. Nothing is saved
// but the receipt: each card is confirmed by the person.
export async function POST(request: Request) {
  try {
    const result = await contabContext();
    if (!result.ok) {
      return result.response;
    }
    const ia = aiDisponivel();
    if (!ia.texto) {
      return jsonError("O assistente ainda não está configurado neste ambiente", 503, { code: "AI_NOT_CONFIGURED" });
    }
    const form = await request.formData().catch(() => null);
    if (!form) {
      return jsonError("Pedido inválido", 400);
    }
    const permitidos = new Map(result.livros.map((livro) => [livro.id, livro]));
    const livroId = String(form.get("livroId") ?? "");
    const destino = permitidos.get(livroId);
    if (!destino) {
      return jsonError("Escolha uma contabilidade que você pode ver", 403, { code: "BOOK_NOT_ALLOWED" });
    }
    const escopo = String(form.get("livroIds") ?? livroId)
      .split(",")
      .filter((id) => permitidos.has(id));
    const livros = escopo.length ? escopo : [livroId];

    let mensagem = String(form.get("mensagem") ?? "").slice(0, 4000);
    let historico: { de: "eu" | "assistente"; texto: string }[] = [];
    try {
      const raw = JSON.parse(String(form.get("historico") ?? "[]")) as unknown;
      if (Array.isArray(raw)) {
        historico = raw
          .filter((item): item is { de: "eu" | "assistente"; texto: string } => Boolean(item) && (item.de === "eu" || item.de === "assistente") && typeof item.texto === "string")
          .slice(-8);
      }
    } catch {
      historico = [];
    }

    let transcricao: string | undefined;
    const audio = form.get("audio");
    if (audio instanceof Blob) {
      if (!ia.audio) {
        return jsonError("O áudio ainda não está configurado neste ambiente", 503, { code: "AUDIO_NOT_CONFIGURED" });
      }
      const ouvido = await transcrever(Buffer.from(await audio.arrayBuffer()));
      if (!ouvido.ok) {
        return ok({ texto: MOTIVO_AUDIO[ouvido.motivo], propostas: [], semAudio: true });
      }
      transcricao = ouvido.texto;
      mensagem = ouvido.texto;
    }

    let comprovante: Comprovante | undefined;
    let anexo: { mime: string; base64: string } | null = null;
    const foto = form.get("foto");
    if (foto instanceof Blob) {
      const bytes = Buffer.from(await foto.arrayBuffer());
      const salvo = await guardarComprovante({ livroId, nome: foto instanceof File ? foto.name : "comprovante.jpg", bytes, autorId: result.context.user._id });
      if ("ok" in salvo) {
        return falhaResponse(salvo);
      }
      comprovante = salvo;
      anexo = { mime: salvo.mime, base64: bytes.toString("base64") };
    }
    if (!mensagem.trim() && !anexo) {
      return jsonError("Escreva, fale ou envie um comprovante", 400, { code: "EMPTY" });
    }

    const movimentos = ordenar(await movimentosDosLivros(livros));
    const moedas = MOEDA_ORDEM.filter((moeda) => livros.some((id) => moedasDoLivro(id, movimentos, result.config.moedas).includes(moeda))) as Moeda[];
    const nome = livros.length === 1 ? (permitidos.get(livros[0])?.nome ?? destino.nome) : `${livros.length} contabilidades juntas`;
    try {
      const resposta = await perguntarIA({
        mensagem,
        anexo,
        historico,
        hoje: result.context.hoje,
        livroNome: nome,
        pessoa: result.context.user.fullName,
        movimentos,
        moedas,
        categorias: result.config.categorias,
      });
      return ok({ ...resposta, ...(comprovante ? { comprovante } : {}), ...(transcricao ? { transcricao } : {}) });
    } catch (error) {
      // a receipt nobody will attach does not stay behind
      if (comprovante) {
        await HjContabComprovante.deleteOne({ _id: comprovante.id });
      }
      if (error instanceof IaIndisponivel) {
        return jsonError("O assistente ainda não está configurado neste ambiente", 503, { code: "AI_NOT_CONFIGURED" });
      }
      console.error("assistente da contabilidade", error);
      return jsonError("O assistente não respondeu agora. Tente de novo em instantes.", 502, { code: "AI_FAILED" });
    }
  } catch (error) {
    return serverError("Erro no assistente", error, "O assistente não respondeu agora");
  }
}
