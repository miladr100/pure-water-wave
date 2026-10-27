import type { UserLanguage } from "@/lib/user-languages";

// The site's three languages map to the regional formats its readers use.
const DATE_LOCALES: Record<UserLanguage, string> = { pt: "pt-BR", en: "en-GB", es: "es" };

export function fmtDuration(minutes: number) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  if (total < 60) {
    return `${total} min`;
  }

  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

export function fmtClock(seconds: number) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");

  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

export function fmtDate(value: string | null | undefined, language: UserLanguage) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(DATE_LOCALES[language], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function firstNameOf(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
