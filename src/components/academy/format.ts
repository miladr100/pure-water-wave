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

export function initialsOf(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

// Today as yyyy-mm-dd in the browser's own calendar (for a date input's max).
export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// A yyyy-mm-dd birthday has no time zone; parsing it as UTC would show the
// day before in Brazil, so it is read as a local calendar date.
export function fmtBirthday(value: string | null | undefined, language: UserLanguage) {
  if (!value) {
    return "";
  }
  return fmtDate(`${value}T00:00:00`, language);
}
