import type { HjPrograma } from "@/lib/hj/types";
import { HJ_PROGRAMAS } from "@/lib/hj/types";

// The HJ Team side of a person's profile (docs/painel/P1 US-P1-02, and the
// group's asks of 14/11/2026). Two halves:
//
// - `perfil`: what the person fills in and sees — program and cohort (set
//   by the educator), the course they graduated in (HJ Academy), when they
//   joined the church (Pure Water), any other formation.
// - `confidencial`: what only educators see and fill in, often learned
//   from the parents or spiritual parents — Cheon Bo family, second
//   generation, parents, liberated ancestors, the pattern of their life of
//   faith. Never sent to the member (Victor, 14/11/2026).

export const HJ_GENEROS = ["masculino", "feminino"] as const;
export type HjGenero = (typeof HJ_GENEROS)[number];

export type HjPerfil = {
  programa: HjPrograma | null;
  // "meninos" and "meninas" in the course's general numbers (Yeseong, 14/11/2026)
  genero: HjGenero | null;
  turma: string;
  // yyyy-mm-dd: when they became a member of the church / movement
  membroDesde: string | null;
  cursoUniversitario: string;
  formacao: string;
};

export type HjConfidencial = {
  familiaCheonBo: boolean | null;
  segundaGeracao: boolean | null;
  pais: string;
  espiritosLibertados: number | null;
  padraoVidaFe: string;
};

export const PERFIL_VAZIO: HjPerfil = { programa: null, genero: null, turma: "", membroDesde: null, cursoUniversitario: "", formacao: "" };
export const CONFIDENCIAL_VAZIO: HjConfidencial = { familiaCheonBo: null, segundaGeracao: null, pais: "", espiritosLibertados: null, padraoVidaFe: "" };

export type HjDoc = { perfil?: Partial<HjPerfil> | null; confidencial?: Partial<HjConfidencial> | null };

export function perfilDe(hj: HjDoc | null | undefined): HjPerfil {
  const p = hj?.perfil ?? {};
  return {
    programa: p.programa && HJ_PROGRAMAS.includes(p.programa) ? p.programa : null,
    genero: p.genero && HJ_GENEROS.includes(p.genero) ? p.genero : null,
    turma: p.turma ?? "",
    membroDesde: p.membroDesde ?? null,
    cursoUniversitario: p.cursoUniversitario ?? "",
    formacao: p.formacao ?? "",
  };
}

export function confidencialDe(hj: HjDoc | null | undefined): HjConfidencial {
  const c = hj?.confidencial ?? {};
  return {
    familiaCheonBo: typeof c.familiaCheonBo === "boolean" ? c.familiaCheonBo : null,
    segundaGeracao: typeof c.segundaGeracao === "boolean" ? c.segundaGeracao : null,
    pais: c.pais ?? "",
    espiritosLibertados: typeof c.espiritosLibertados === "number" ? c.espiritosLibertados : null,
    padraoVidaFe: c.padraoVidaFe ?? "",
  };
}

// Age in whole years on `hoje` (yyyy-mm-dd), from a birthday stored at UTC midnight.
export function idadeEm(birthday: Date | null | undefined, hoje: string): number | null {
  if (!birthday || Number.isNaN(birthday.getTime())) {
    return null;
  }
  const [y, m, d] = hoje.split("-").map(Number);
  let age = y - birthday.getUTCFullYear();
  const beforeBirthday = m < birthday.getUTCMonth() + 1 || (m === birthday.getUTCMonth() + 1 && d < birthday.getUTCDate());
  if (beforeBirthday) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

// Whole years since `membroDesde` on `hoje`, for "há quanto tempo é membro".
export function anosDesde(desde: string | null, hoje: string): number | null {
  if (!desde) {
    return null;
  }
  const [y, m, d] = desde.split("-").map(Number);
  const [hy, hm, hd] = hoje.split("-").map(Number);
  let years = hy - y;
  if (hm < m || (hm === m && hd < d)) {
    years -= 1;
  }
  return years >= 0 ? years : null;
}

// The one line under the name in the people list, per program: HJ
// Academy shows the course, Pure Water the years as a member, HJ Rang the
// Cheon Bo family (educators only — the list is theirs).
export function resumoDe(perfil: HjPerfil, confidencial: HjConfidencial | null, hoje: string): string {
  switch (perfil.programa) {
    case "HJA":
      return perfil.cursoUniversitario ? `Formado(a) em ${perfil.cursoUniversitario}` : "";
    case "HJR": {
      if (!confidencial || confidencial.familiaCheonBo === null) {
        return "";
      }
      return confidencial.familiaCheonBo ? "Família Cheon Bo" : "Não é família Cheon Bo";
    }
    case "PW": {
      const anos = anosDesde(perfil.membroDesde, hoje);
      if (anos === null) {
        return "";
      }
      return anos === 0 ? "Membro há menos de 1 ano" : anos === 1 ? "Membro há 1 ano" : `Membro há ${anos} anos`;
    }
    default:
      return perfil.formacao;
  }
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : undefined);

// What the member may change in their own HJ profile.
export function parsePerfilProprio(body: Partial<HjPerfil>): Partial<HjPerfil> {
  const out: Partial<HjPerfil> = {};
  const curso = text(body.cursoUniversitario, 120);
  if (curso !== undefined) out.cursoUniversitario = curso;
  const formacao = text(body.formacao, 300);
  if (formacao !== undefined) out.formacao = formacao;
  if (body.membroDesde === null || (typeof body.membroDesde === "string" && ISO_DAY.test(body.membroDesde))) {
    out.membroDesde = body.membroDesde;
  }
  if (body.genero === null || (body.genero && HJ_GENEROS.includes(body.genero))) {
    out.genero = body.genero;
  }
  return out;
}

// What the educator may change: everything the member may, plus program,
// cohort and the confidential half.
export function parsePerfilEducador(body: { perfil?: Partial<HjPerfil>; confidencial?: Partial<HjConfidencial> }) {
  const perfil = parsePerfilProprio(body.perfil ?? {});
  if (body.perfil?.programa === null || (body.perfil?.programa && HJ_PROGRAMAS.includes(body.perfil.programa))) {
    perfil.programa = body.perfil.programa;
  }
  const turma = text(body.perfil?.turma, 60);
  if (turma !== undefined) perfil.turma = turma;

  const confidencial: Partial<HjConfidencial> = {};
  const c = body.confidencial ?? {};
  if (c.familiaCheonBo === null || typeof c.familiaCheonBo === "boolean") confidencial.familiaCheonBo = c.familiaCheonBo;
  if (c.segundaGeracao === null || typeof c.segundaGeracao === "boolean") confidencial.segundaGeracao = c.segundaGeracao;
  const pais = text(c.pais, 200);
  if (pais !== undefined) confidencial.pais = pais;
  if (c.espiritosLibertados === null) {
    confidencial.espiritosLibertados = null;
  } else if (typeof c.espiritosLibertados === "number" && Number.isFinite(c.espiritosLibertados) && c.espiritosLibertados >= 0) {
    confidencial.espiritosLibertados = Math.round(c.espiritosLibertados);
  }
  const padrao = text(c.padraoVidaFe, 2000);
  if (padrao !== undefined) confidencial.padraoVidaFe = padrao;

  return { perfil, confidencial };
}

// `$set` paths for a partial update of the `hj` subdocument.
export function hjSetPaths(update: { perfil?: Partial<HjPerfil>; confidencial?: Partial<HjConfidencial> }) {
  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(update.perfil ?? {})) {
    set[`hj.perfil.${key}`] = value;
  }
  for (const [key, value] of Object.entries(update.confidencial ?? {})) {
    set[`hj.confidencial.${key}`] = value;
  }
  return set;
}
