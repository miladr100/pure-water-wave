import { randomInt } from "node:crypto";

import { normalizeCountry } from "@/lib/academy/countries";
import { emailConfigured, sendEmailWelcome } from "@/lib/academy/emails";
import { formatBirthday, parseBirthday } from "@/lib/academy/profile";
import type {
  AccountKind,
  AdminCreateAccountBody,
  AdminCreateAccountResult,
  AdminImportResult,
  AdminImportRowInput,
  AdminImportRowResult,
} from "@/lib/academy/types";
import { hashPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";
import { isUserLanguage, type UserLanguage } from "@/lib/user-languages";
import { AcademyUser } from "@/models/academy-user";
import { SystemUser } from "@/models/system-user";

// Accounts are created by educators, never by the person themself. A pastor
// becomes a `SystemUser` (the library's account, where `phone` is required
// and unique); HJ Team members and educators become `AcademyUser`s (roles
// student / tutor) and reach the library through the session bridge.

export const ACCOUNT_KINDS: readonly AccountKind[] = ["pastor", "hjteam", "educador"];

export function isAccountKind(value: unknown): value is AccountKind {
  return typeof value === "string" && (ACCOUNT_KINDS as readonly string[]).includes(value);
}

// No 0/O/1/l/I: the password is read off a screen or an e-mail and typed.
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const TEMPORARY_PASSWORD_LENGTH = 10;

export function generateTemporaryPassword() {
  let password = "";
  for (let i = 0; i < TEMPORARY_PASSWORD_LENGTH; i += 1) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  }
  return password;
}

export type FieldCode = "required" | "invalid" | "too_short";

export type CleanAccount = {
  kind: AccountKind;
  fullName: string;
  email: string;
  // digits only for a pastor (the library's format); as typed otherwise
  phone: string;
  country: string;
  city: string;
  birthday: Date | null;
  language: UserLanguage;
  // pastors only; "" for the other kinds
  churchName: string;
  // null → generate a temporary one
  password: string | null;
};

export type ValidationResult =
  | { ok: true; value: CleanAccount }
  | { ok: false; fields: Record<string, FieldCode> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s()-]{6,20}$/;
const BR_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_TEXT = 120;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// The form sends yyyy-mm-dd; a CSV written by hand often says dd/mm/yyyy.
// Both land on `parseBirthday`, which does the calendar check.
export function normalizeBirthdayText(value: string) {
  const match = BR_DATE_PATTERN.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function validateAccountInput(body: AdminCreateAccountBody): ValidationResult {
  const fields: Record<string, FieldCode> = {};

  const kind = body.kind;
  if (!isAccountKind(kind)) {
    fields.kind = kind ? "invalid" : "required";
  }

  const fullName = text(body.fullName);
  if (!fullName) {
    fields.fullName = "required";
  } else if (fullName.length < 2) {
    fields.fullName = "too_short";
  } else if (fullName.length > MAX_TEXT) {
    fields.fullName = "invalid";
  }

  const email = text(body.email).toLowerCase();
  if (!email) {
    fields.email = "required";
  } else if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    fields.email = "invalid";
  }

  let phone = text(body.phone);
  if (!phone) {
    if (kind === "pastor") {
      fields.phone = "required";
    }
  } else if (!PHONE_PATTERN.test(phone)) {
    fields.phone = "invalid";
  } else if (kind === "pastor") {
    phone = normalizePhone(phone);
  }

  const typedCountry = text(body.country);
  const country = typedCountry ? (normalizeCountry(typedCountry) ?? "") : "";
  if (typedCountry && !country) {
    fields.country = "invalid";
  }

  const city = text(body.city);
  if (city.length > MAX_TEXT) {
    fields.city = "invalid";
  }

  let birthday: Date | null = null;
  const birthdayText = text(body.birthday);
  if (birthdayText) {
    birthday = parseBirthday(normalizeBirthdayText(birthdayText));
    if (!birthday) {
      fields.birthday = "invalid";
    }
  }

  let language: UserLanguage = "pt";
  const languageText = text(body.language);
  if (languageText) {
    if (isUserLanguage(languageText)) {
      language = languageText;
    } else {
      fields.language = "invalid";
    }
  }

  const churchName = kind === "pastor" ? text(body.churchName) : "";
  if (churchName.length > MAX_TEXT) {
    fields.churchName = "invalid";
  }

  let password: string | null = null;
  if (typeof body.password === "string" && body.password !== "") {
    if (body.password.length < MIN_PASSWORD_LENGTH) {
      fields.password = "too_short";
    } else {
      password = body.password;
    }
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      kind: kind as AccountKind,
      fullName,
      email,
      phone,
      country,
      city,
      birthday,
      language,
      churchName,
      password,
    },
  };
}

export class AccountExistsError extends Error {
  readonly field: "email" | "phone";

  constructor(field: "email" | "phone") {
    super(field === "email" ? "E-mail já cadastrado" : "Telefone já cadastrado");
    this.name = "AccountExistsError";
    this.field = field;
  }
}

export type CreateAccountOptions = { appUrl: string };

// The public URL the welcome e-mail points at: the configured one in
// production, the request's own origin when running locally.
export function appUrlFor(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
}

async function emailTaken(email: string) {
  const [academy, library] = await Promise.all([
    AcademyUser.exists({ email }),
    SystemUser.exists({ email }),
  ]);
  return Boolean(academy || library);
}

// A unique index can still trip when two requests race past the lookups;
// the duplicate-key error then names the same field the lookups would have.
function duplicateKeyField(error: unknown): "email" | "phone" | null {
  const candidate = error as { code?: number; keyPattern?: Record<string, unknown> } | null;
  if (!candidate || candidate.code !== 11000) {
    return null;
  }
  const keys = Object.keys(candidate.keyPattern ?? {});
  if (keys.includes("phone")) {
    return "phone";
  }
  return "email";
}

export async function createAccount(
  value: CleanAccount,
  options: CreateAccountOptions,
): Promise<AdminCreateAccountResult> {
  if (await emailTaken(value.email)) {
    throw new AccountExistsError("email");
  }

  if (value.kind === "pastor" && (await SystemUser.exists({ phone: value.phone }))) {
    throw new AccountExistsError("phone");
  }

  const temporaryPassword = value.password === null ? generateTemporaryPassword() : null;
  const hash = await hashPassword(temporaryPassword ?? (value.password as string));

  let id: string;
  try {
    if (value.kind === "pastor") {
      const pastor = await SystemUser.create({
        fullName: value.fullName,
        phone: value.phone,
        email: value.email,
        churchName: value.churchName,
        country: value.country,
        language: value.language,
        login: value.email,
        password: hash,
        role: "pastor",
      });
      id = pastor._id.toString();
    } else {
      const user = await AcademyUser.create({
        fullName: value.fullName,
        email: value.email,
        login: value.email,
        password: hash,
        phone: value.phone,
        country: value.country,
        city: value.city,
        birthday: value.birthday,
        language: value.language,
        theme: "system",
        role: value.kind === "educador" ? "tutor" : "student",
      });
      id = user._id.toString();
    }
  } catch (error) {
    const field = duplicateKeyField(error);
    if (field) {
      throw new AccountExistsError(field);
    }
    throw error;
  }

  let emailed = false;
  if (emailConfigured()) {
    try {
      await sendEmailWelcome({
        to: value.email,
        fullName: value.fullName,
        kind: value.kind,
        email: value.email,
        temporaryPassword,
        appUrl: options.appUrl,
      });
      emailed = true;
    } catch (error) {
      // The account exists either way; the educator still sees the password.
      console.error("Erro ao enviar e-mail de boas-vindas:", error);
    }
  }

  return {
    id,
    kind: value.kind,
    fullName: value.fullName,
    email: value.email,
    temporaryPassword,
    emailed,
  };
}

// A CSV may give an age instead of a birthday: 1 January of the year that
// makes the person that age today (UTC, like every stored birthday).
export function ageToBirthday(age: number): Date {
  return new Date(Date.UTC(new Date().getUTCFullYear() - age, 0, 1));
}

const MAX_AGE = 120;

const FIELD_MESSAGES: Record<string, Partial<Record<FieldCode, string>>> = {
  kind: { required: "Tipo obrigatório", invalid: "Tipo inválido" },
  fullName: { required: "Nome obrigatório", too_short: "Nome muito curto", invalid: "Nome muito longo" },
  email: { required: "E-mail obrigatório", invalid: "E-mail inválido" },
  phone: { required: "Telefone obrigatório para pastor", invalid: "Telefone inválido" },
  country: { invalid: "País inválido" },
  city: { invalid: "Cidade muito longa" },
  birthday: { invalid: "Data de nascimento inválida" },
  age: { invalid: "Idade inválida" },
  language: { invalid: "Idioma inválido (use pt, en ou es)" },
  churchName: { invalid: "Nome da igreja muito longo" },
  password: { too_short: `Senha muito curta (mínimo ${MIN_PASSWORD_LENGTH} caracteres)` },
};

export function fieldMessages(fields: Record<string, FieldCode>) {
  return Object.entries(fields)
    .map(([field, code]) => FIELD_MESSAGES[field]?.[code] ?? `${field}: ${code}`)
    .join("; ");
}

// Each row stands on its own: one bad line never stops the rest, and a
// second line with an e-mail already seen in the file reads as "exists"
// without touching the database.
export async function importAccounts(
  rows: AdminImportRowInput[],
  options: CreateAccountOptions,
): Promise<AdminImportResult> {
  const results: AdminImportRowResult[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const line = Number.isInteger(row.line) ? row.line : results.length + 1;
    const email = text(row.email).toLowerCase();
    const fullName = text(row.fullName);
    const kind = isAccountKind(row.kind) ? row.kind : null;

    const base = { line, email, fullName, kind, temporaryPassword: null, emailed: false };

    const fields: Record<string, FieldCode> = {};
    let birthday = row.birthday ?? null;
    const ageGiven = row.age !== undefined && row.age !== null && String(row.age).trim() !== "";
    if (!text(birthday) && ageGiven) {
      const age = Number(row.age);
      if (Number.isInteger(age) && age >= 0 && age <= MAX_AGE) {
        birthday = formatBirthday(ageToBirthday(age));
      } else {
        fields.age = "invalid";
      }
    }

    const validated = validateAccountInput({ ...row, birthday });
    if (!validated.ok || Object.keys(fields).length > 0) {
      const all = { ...(validated.ok ? {} : validated.fields), ...fields };
      results.push({ ...base, status: "invalid", message: fieldMessages(all) });
      continue;
    }

    if (seen.has(validated.value.email)) {
      results.push({ ...base, status: "exists", message: "E-mail repetido no arquivo" });
      continue;
    }
    seen.add(validated.value.email);

    try {
      const created = await createAccount(validated.value, options);
      results.push({
        ...base,
        status: "created",
        message: created.emailed ? "Conta criada e e-mail enviado" : "Conta criada",
        temporaryPassword: created.temporaryPassword,
        emailed: created.emailed,
      });
    } catch (error) {
      if (error instanceof AccountExistsError) {
        results.push({ ...base, status: "exists", message: error.message });
        continue;
      }
      console.error(`Erro ao importar a linha ${line}:`, error);
      results.push({ ...base, status: "invalid", message: "Não foi possível criar a conta" });
    }
  }

  return {
    created: results.filter((row) => row.status === "created").length,
    exists: results.filter((row) => row.status === "exists").length,
    invalid: results.filter((row) => row.status === "invalid").length,
    rows: results,
  };
}
