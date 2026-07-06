export const USER_LANGUAGES = ["pt", "en", "es"] as const;
export type UserLanguage = (typeof USER_LANGUAGES)[number];

export const USER_LANGUAGE_LABELS: Record<UserLanguage, string> = {
  pt: "Português",
  en: "Inglês",
  es: "Espanhol",
};

export function isUserLanguage(value: unknown): value is UserLanguage {
  return typeof value === "string" && USER_LANGUAGES.includes(value as UserLanguage);
}
