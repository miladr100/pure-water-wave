import type { AccountKind, AdminImportResult, AdminImportRowInput } from "@/lib/academy/types";
import { isUserLanguage } from "@/lib/user-languages";

// Browser-side reading of the accounts spreadsheet. Everything here is
// lenient on purpose: the file comes from Excel or Google Sheets in whatever
// locale the educator uses, so the delimiter, the header spelling and the
// date format are all guessed. Validation proper stays on the server.

export const IMPORT_MAX_ROWS = 500;

export const TEMPLATE_HEADER = [
  "tipo",
  "nome",
  "email",
  "telefone",
  "pais",
  "cidade",
  "nascimento",
  "idade",
  "idioma",
  "igreja",
  "senha",
] as const;

const TEMPLATE_ROWS: string[][] = [
  ["pastor", "João da Silva", "joao@exemplo.com", "+55 11 99999-0000", "Brasil", "São Paulo", "1980-05-12", "", "pt", "Igreja Exemplo", ""],
  ["hjteam", "Maria Souza", "maria@exemplo.com", "+55 21 98888-0000", "Brasil", "Rio de Janeiro", "", "24", "pt", "", ""],
];

type Field =
  | "kind"
  | "fullName"
  | "email"
  | "phone"
  | "country"
  | "city"
  | "birthday"
  | "age"
  | "language"
  | "churchName"
  | "password";

// Header aliases, already normalised (lowercase, no accents, single spaces).
const HEADER_ALIASES: Record<string, Field> = {
  tipo: "kind",
  type: "kind",
  kind: "kind",
  nome: "fullName",
  name: "fullName",
  "nome completo": "fullName",
  email: "email",
  "e-mail": "email",
  telefone: "phone",
  phone: "phone",
  celular: "phone",
  whatsapp: "phone",
  pais: "country",
  country: "country",
  cidade: "city",
  city: "city",
  nascimento: "birthday",
  "data de nascimento": "birthday",
  birthday: "birthday",
  data_nascimento: "birthday",
  idade: "age",
  age: "age",
  idioma: "language",
  language: "language",
  lingua: "language",
  igreja: "churchName",
  church: "churchName",
  "church name": "churchName",
  senha: "password",
  password: "password",
};

const KIND_ALIASES: Record<string, AccountKind> = {
  pastor: "pastor",
  hjteam: "hjteam",
  "hj team": "hjteam",
  hj: "hjteam",
  membro: "hjteam",
  aluno: "hjteam",
  estudante: "hjteam",
  student: "hjteam",
  educador: "educador",
  educadora: "educador",
  educator: "educador",
  tutor: "educador",
  staff: "educador",
  admin: "educador",
};

export function normaliseHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function detectDelimiter(headerLine: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;
  for (const candidate of candidates) {
    const count = headerLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

// RFC 4180-ish: quoted fields may hold the delimiter, newlines and doubled
// quotes. Returns one array per record, blank records dropped.
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const firstBreak = source.search(/\r?\n/);
  const delimiter = detectDelimiter(firstBreak === -1 ? source : source.slice(0, firstBreak));

  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      record.push(field);
      field = "";
      records.push(record);
      record = [];
    } else {
      field += char;
    }
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records.filter((row) => row.some((cell) => cell.trim() !== ""));
}

// "12/05/1980" → "1980-05-12"; ISO passes through; anything else as typed,
// for the server to refuse with a line number.
export function normaliseBirthday(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const br = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (br) {
    const [, day, month, year] = br;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return trimmed;
}

export type ParsedImport = {
  rows: AdminImportRowInput[];
  // rows the server will certainly refuse: tipo, nome or email missing
  incomplete: Set<number>;
  // how many data lines the file had before the cap
  totalLines: number;
  truncated: boolean;
  // headers nobody recognised, to show the educator
  unknownHeaders: string[];
};

export function parseAccountsCsv(text: string): ParsedImport {
  const records = parseCsv(text);
  const [header = [], ...body] = records;

  const columns: (Field | null)[] = header.map((cell) => HEADER_ALIASES[normaliseHeader(cell)] ?? null);
  const unknownHeaders = header.filter((cell, index) => columns[index] === null && cell.trim() !== "");

  const incomplete = new Set<number>();
  const rows: AdminImportRowInput[] = [];
  const limited = body.slice(0, IMPORT_MAX_ROWS);

  limited.forEach((cells, index) => {
    const line = index + 2; // 1-based, header is line 1
    const values: Partial<Record<Field, string>> = {};
    columns.forEach((field, column) => {
      if (field && cells[column] !== undefined) {
        values[field] = cells[column].trim();
      }
    });

    const kindRaw = normaliseHeader(values.kind ?? "");
    const kind = KIND_ALIASES[kindRaw];
    const fullName = values.fullName ?? "";
    const email = values.email ?? "";
    if (!kind || !fullName || !email) {
      incomplete.add(line);
    }

    const ageNumber = values.age ? Number.parseInt(values.age, 10) : Number.NaN;
    const language = (values.language ?? "").toLowerCase().trim();

    rows.push({
      line,
      // an unknown kind is sent as typed so the server's "invalid" names it
      kind: kind ?? (values.kind as AccountKind),
      fullName,
      email,
      phone: values.phone || undefined,
      country: values.country || undefined,
      city: values.city || undefined,
      birthday: normaliseBirthday(values.birthday ?? "") ?? null,
      age: Number.isFinite(ageNumber) ? ageNumber : null,
      language: isUserLanguage(language) ? language : undefined,
      churchName: values.churchName || undefined,
      password: values.password || undefined,
    });
  });

  return {
    rows,
    incomplete,
    totalLines: body.length,
    truncated: body.length > IMPORT_MAX_ROWS,
    unknownHeaders,
  };
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: (string | number | null | undefined)[][]) {
  // BOM so Excel opens the accents right.
  return `﻿${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function templateCsv() {
  return toCsv([[...TEMPLATE_HEADER], ...TEMPLATE_ROWS]);
}

export function resultCsv(result: AdminImportResult) {
  return toCsv([
    ["linha", "tipo", "nome", "email", "resultado", "mensagem", "senha_temporaria"],
    ...result.rows.map((row) => [
      row.line,
      row.kind ?? "",
      row.fullName,
      row.email,
      row.status,
      row.message,
      row.temporaryPassword ?? "",
    ]),
  ]);
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
