import { type UserLanguage } from "@/lib/user-languages";

// Content is authored in Portuguese first (the movement's main language) and
// translated to Spanish and English when there is time. A missing translation
// falls back to pt rather than rendering a blank, the same way the library's
// video manual falls back to its Portuguese JSON.
export type Localized = {
  pt: string;
  en?: string;
  es?: string;
};

export const EMPTY_LOCALIZED: Localized = { pt: "", en: "", es: "" };

export function pick(value: Localized | null | undefined, language: UserLanguage): string {
  if (!value) {
    return "";
  }

  const chosen = value[language];
  if (chosen && chosen.trim()) {
    return chosen;
  }

  return value.pt ?? "";
}

export function isTranslated(value: Localized | null | undefined, language: UserLanguage) {
  if (!value) {
    return false;
  }

  return Boolean(value[language]?.trim());
}

export function normalizeLocalized(input: unknown): Localized {
  if (typeof input === "string") {
    return { pt: input.trim(), en: "", es: "" };
  }

  if (!input || typeof input !== "object") {
    return { ...EMPTY_LOCALIZED };
  }

  const raw = input as Record<string, unknown>;
  const read = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");

  return { pt: read("pt"), en: read("en"), es: read("es") };
}
