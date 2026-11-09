import type { RegraNovaMeta } from "@/lib/hj/types";

// The arithmetic of the "Resultados Restauração Material" spreadsheet, as
// it is kept today (docs/painel/02-como-funciona-hoje.md): líquido per day,
// average and record over the days with a report, and the "nova meta".

export function liquido(dinheiroCents: number, pixCents: number, despesasCents: number) {
  return Math.round(dinheiroCents) + Math.round(pixCents) - Math.round(despesasCents);
}

export function media(valoresCents: number[]) {
  if (valoresCents.length === 0) {
    return 0;
  }
  const total = valoresCents.reduce((sum, value) => sum + value, 0);
  return Math.round(total / valoresCents.length);
}

export function recorde(valoresCents: number[]) {
  return valoresCents.reduce((best, value) => Math.max(best, value), 0);
}

// Nova meta = ceil(média × fator) to the next multiple of `arredondarCents`,
// never below `minimoCents`. Without any day yet the default goal applies.
export function novaMeta(
  mediaCents: number,
  regra: RegraNovaMeta,
  metaPadraoCents: number,
  diasEnviados: number,
) {
  if (diasEnviados === 0) {
    return Math.max(metaPadraoCents, regra.minimoCents);
  }
  const step = Math.max(1, Math.round(regra.arredondarCents));
  // Whole cents first: 50000 × 1.1 is 55000.00000000001 in floating point,
  // which would otherwise round an exact multiple up a whole step.
  const produto = Math.round(mediaCents * regra.fator);
  const alvo = Math.ceil(produto / step) * step;
  return Math.max(regra.minimoCents, alvo);
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const BRL_CENTS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function fmtReais(cents: number, options: { centavos?: boolean } = {}) {
  const value = (Number(cents) || 0) / 100;
  return options.centavos ? BRL_CENTS.format(value) : BRL.format(Math.round(value));
}

// "1.250" / "1250,50" / "R$ 1.250,50" typed by a person → cents, or null.
// A lone dot followed by one or two digits ("350.50", as a numeric keypad
// types it) is a decimal mark, not a thousands separator.
export function parseReais(text: string): number | null {
  const compact = text.replace(/[R$\s]/g, "");
  const dotDecimal = !compact.includes(",") && /^\d*\.\d{1,2}$/.test(compact);
  const cleaned = dotDecimal ? compact : compact.replace(/\./g, "").replace(",", ".");
  if (cleaned === "" || cleaned === "-") {
    return null;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100);
}

export function pct(part: number, whole: number) {
  if (whole <= 0) {
    return 0;
  }
  return Math.round((part / whole) * 1000) / 10;
}
