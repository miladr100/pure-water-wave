// The countries where the movement is present come first (the same list the
// public site shows), then the rest of the Americas and Europe. Matching is by
// exact string, as in the FFPUM academy.
export const COUNTRIES_MAIN = [
  "Brasil",
  "Argentina",
  "Bolívia",
  "Peru",
  "Portugal",
  "São Tomé e Príncipe",
] as const;

export const COUNTRIES_REST = [
  "Angola",
  "Chile",
  "Colômbia",
  "Costa Rica",
  "Cuba",
  "El Salvador",
  "Equador",
  "Espanha",
  "Estados Unidos",
  "Guatemala",
  "Honduras",
  "México",
  "Moçambique",
  "Nicarágua",
  "Panamá",
  "Paraguai",
  "República Dominicana",
  "Uruguai",
  "Venezuela",
  "Outro",
] as const;

export const COUNTRIES = [...COUNTRIES_MAIN, ...COUNTRIES_REST] as const;
export type Country = (typeof COUNTRIES)[number];

export function isCountry(value: unknown): value is Country {
  return typeof value === "string" && (COUNTRIES as readonly string[]).includes(value);
}

// Spreadsheets spell countries every which way: "BR", "brasil", "Brazil",
// "España". This maps what a person would plausibly type to the stored name,
// ignoring case and accents; anything it does not recognise stays unknown.
const ALIASES: Record<string, Country> = {
  br: "Brasil", bra: "Brasil", brazil: "Brasil",
  ar: "Argentina", arg: "Argentina",
  bo: "Bolívia", bol: "Bolívia",
  pe: "Peru", per: "Peru",
  pt: "Portugal", prt: "Portugal",
  st: "São Tomé e Príncipe", stp: "São Tomé e Príncipe", "sao tome": "São Tomé e Príncipe",
  "sao tome and principe": "São Tomé e Príncipe", "santo tome y principe": "São Tomé e Príncipe",
  ao: "Angola", ago: "Angola",
  cl: "Chile", chl: "Chile",
  co: "Colômbia", col: "Colômbia",
  cr: "Costa Rica",
  cu: "Cuba",
  sv: "El Salvador",
  ec: "Equador", ecuador: "Equador",
  es: "Espanha", esp: "Espanha", espana: "Espanha", spain: "Espanha",
  us: "Estados Unidos", usa: "Estados Unidos", eua: "Estados Unidos", eeuu: "Estados Unidos",
  "united states": "Estados Unidos", "estados unidos da america": "Estados Unidos",
  gt: "Guatemala",
  hn: "Honduras",
  mx: "México", mex: "México",
  mz: "Moçambique", moz: "Moçambique", mozambique: "Moçambique",
  ni: "Nicarágua",
  pa: "Panamá", panama: "Panamá",
  py: "Paraguai", paraguay: "Paraguai",
  do: "República Dominicana", "dominican republic": "República Dominicana",
  uy: "Uruguai", uruguay: "Uruguai",
  ve: "Venezuela",
  other: "Outro", otro: "Outro",
};

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeCountry(value: string): Country | null {
  const folded = fold(value);
  if (!folded) {
    return null;
  }
  return COUNTRIES.find((country) => fold(country) === folded) ?? ALIASES[folded] ?? null;
}
