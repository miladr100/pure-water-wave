import {
  searchAllLibraryPdfs,
  type LibrarySearchResult,
} from "@/lib/pdf-library-search";
import { getLibraryPdfReaderPath } from "@/lib/library-pdfs";
import { normalizeSearchText } from "@/lib/pdf-search";

const MAX_CONTEXT_SNIPPETS = 12;
const STOP_WORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "um",
  "uma",
  "para",
  "por",
  "com",
  "que",
  "qual",
  "quais",
  "como",
  "onde",
  "quando",
  "porque",
  "porquê",
  "sobre",
  "me",
  "seu",
  "sua",
  "seus",
  "suas",
  "este",
  "esta",
  "esse",
  "essa",
  "isso",
  "isto",
  "the",
  "and",
  "what",
  "how",
  "why",
]);

export type LibraryAskCitation = {
  pdfId: string;
  pdfTitle: string;
  pageNumber: number;
  snippet: string;
  readerUrl: string;
};

export type LibraryAskResult = {
  answer: string;
  citations: LibraryAskCitation[];
};

function extractSearchTerms(question: string) {
  const normalized = normalizeSearchText(question);
  const terms = normalized
    .split(/[^a-z0-9]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4 && !STOP_WORDS.has(term));

  const unique = [...new Set(terms)];
  return unique.slice(0, 8);
}

function resultKey(result: LibrarySearchResult) {
  return `${result.pdfId}:${result.pageNumber}:${result.snippet.slice(0, 40)}`;
}

export async function gatherLibraryContext(question: string) {
  const terms = extractSearchTerms(question);
  const queries = [question.trim(), ...terms].filter(Boolean);
  const byKey = new Map<string, LibrarySearchResult>();

  for (const query of queries) {
    const results = await searchAllLibraryPdfs(query);

    for (const result of results) {
      const key = resultKey(result);

      if (!byKey.has(key)) {
        byKey.set(key, result);
      }

      if (byKey.size >= MAX_CONTEXT_SNIPPETS) {
        break;
      }
    }

    if (byKey.size >= MAX_CONTEXT_SNIPPETS) {
      break;
    }
  }

  return [...byKey.values()].slice(0, MAX_CONTEXT_SNIPPETS);
}

function buildContextPrompt(snippets: LibrarySearchResult[]) {
  if (snippets.length === 0) {
    return "Nenhum trecho encontrado nos livros.";
  }

  return snippets
    .map(
      (snippet, index) =>
        `[${index + 1}] Livro: ${snippet.pdfTitle} | Página: ${snippet.pageNumber}\nTrecho: ${snippet.snippet}`,
    )
    .join("\n\n");
}

function toCitations(snippets: LibrarySearchResult[]): LibraryAskCitation[] {
  const seen = new Set<string>();

  return snippets
    .filter((snippet) => {
      const key = `${snippet.pdfId}:${snippet.pageNumber}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((snippet) => ({
      pdfId: snippet.pdfId,
      pdfTitle: snippet.pdfTitle,
      pageNumber: snippet.pageNumber,
      snippet: snippet.snippet,
      readerUrl: `${getLibraryPdfReaderPath(snippet.pdfId)}?page=${snippet.pageNumber}`,
    }));
}

export async function askLibraryAi(question: string): Promise<LibraryAskResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "A IA ainda não está configurada. Defina OPENAI_API_KEY no ambiente.",
    );
  }

  const snippets = await gatherLibraryContext(question);
  const citations = toCitations(snippets);
  const context = buildContextPrompt(snippets);

  const systemPrompt = `Você é um assistente pastoral da Biblioteca Água Pura.
Responda em português do Brasil, com clareza e respeito.
Use APENAS os trechos fornecidos dos livros como base.
Se a resposta não estiver nos trechos, diga honestamente que não encontrou essa informação nos livros disponíveis.
Cite as fontes no formato: (Livro, p. X).
Não invente citações, páginas ou conteúdos.`;

  const userPrompt = `Pergunta do pastor:
${question}

Trechos dos livros:
${context}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(
      data.error?.message ?? "Não foi possível obter resposta da IA",
    );
  }

  const answer =
    data.choices?.[0]?.message?.content?.trim() ||
    "Não foi possível gerar uma resposta neste momento.";

  return { answer, citations };
}
