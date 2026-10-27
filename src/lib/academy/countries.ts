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
