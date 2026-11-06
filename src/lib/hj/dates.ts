// Calendar days of the panel are `yyyy-mm-dd` strings in Brazil's calendar
// (America/Sao_Paulo): a report filed at 23:30 in São Paulo belongs to that
// day whatever the server's clock says.

export const PANEL_TIME_ZONE = "America/Sao_Paulo";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDay(value: unknown): value is string {
  if (typeof value !== "string" || !DAY_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function todayInBrazil(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PANEL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(day: string, amount: number) {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + amount));
  return next.toISOString().slice(0, 10);
}

// Days from `from` to `to`, both included, in order.
export function daysBetween(from: string, to: string) {
  const days: string[] = [];
  if (!isIsoDay(from) || !isIsoDay(to) || from > to) {
    return days;
  }
  let current = from;
  while (current <= to) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

export function daysApart(from: string, to: string) {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

// "qua, 5 nov" / "5 de novembro" in Portuguese, for headings.
export function fmtDia(day: string, style: "curto" | "longo" = "curto") {
  if (!isIsoDay(day)) {
    return day;
  }
  const [year, month, date] = day.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, date, 12));
  return new Intl.DateTimeFormat(
    "pt-BR",
    style === "curto"
      ? { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }
      : { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" },
  ).format(value);
}

export function fmtDiaNumero(day: string) {
  return isIsoDay(day) ? `${day.slice(8, 10)}/${day.slice(5, 7)}` : day;
}
