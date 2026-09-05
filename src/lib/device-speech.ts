import type { UserLanguage } from "@/lib/user-languages";

export const SPEECH_LOCALES: Record<UserLanguage, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
};

const LANGUAGE_PREFIXES: Record<UserLanguage, string[]> = {
  pt: ["pt-br", "pt_br", "pt-pt", "pt"],
  en: ["en-us", "en_us", "en-gb", "en"],
  es: ["es-es", "es_es", "es-mx", "es-us", "es"],
};

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function normalizeLang(value: string) {
  return value.toLowerCase().replace("_", "-");
}

function voiceScore(voice: SpeechSynthesisVoice, language: UserLanguage) {
  const lang = normalizeLang(voice.lang);
  const prefixes = LANGUAGE_PREFIXES[language];
  const prefixIndex = prefixes.findIndex((prefix) => lang.startsWith(prefix));

  if (prefixIndex < 0) {
    return -1;
  }

  const name = voice.name.toLowerCase();
  let score = 100 - prefixIndex * 10;

  if (voice.localService) score += 20;
  if (voice.default) score += 5;
  if (/(enhanced|premium|neural|siri|natural|compact)/.test(name)) score += 15;

  return score;
}

export function pickSpeechVoice(
  voices: SpeechSynthesisVoice[],
  language: UserLanguage,
) {
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;

  for (const voice of voices) {
    const score = voiceScore(voice, language);

    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  }

  return best;
}

export function splitTextForSpeech(text: string, maxLength = 240) {
  const trimmed = text.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.length <= maxLength) {
    return [trimmed];
  }

  const sentences = trimmed.match(/[^.!?…]+[.!?…]+\s*|[^.!?…]+$/g) ?? [
    trimmed,
  ];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence.trim()}` : sentence.trim();

    if (next.length > maxLength && current) {
      chunks.push(current.trim());
      current = sentence.trim();
      continue;
    }

    current = next;
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxLength) {
      return [chunk];
    }

    const words = chunk.split(" ");
    const pieces: string[] = [];
    let piece = "";

    for (const word of words) {
      const next = piece ? `${piece} ${word}` : word;

      if (next.length > maxLength && piece) {
        pieces.push(piece);
        piece = word;
        continue;
      }

      piece = next;
    }

    if (piece) {
      pieces.push(piece);
    }

    return pieces;
  });
}

export type SpeechChunk = {
  text: string;
  paragraphIndex: number | null;
};

export function buildSpeechChunks(
  title: string,
  paragraphs: string[],
): SpeechChunk[] {
  const chunks: SpeechChunk[] = [];

  for (const piece of splitTextForSpeech(title)) {
    chunks.push({ text: piece, paragraphIndex: null });
  }

  paragraphs.forEach((paragraph, paragraphIndex) => {
    for (const piece of splitTextForSpeech(paragraph)) {
      chunks.push({ text: piece, paragraphIndex });
    }
  });

  return chunks;
}
