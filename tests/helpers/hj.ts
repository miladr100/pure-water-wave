import { Types } from "mongoose";

import { createSessionToken, type SessionPayload } from "@/lib/academy/auth";
import { addDays, todayInBrazil } from "@/lib/hj/dates";
import { liquido } from "@/lib/hj/rm";
import type { ConvidadoEtapa, HjPrograma, RelatorioEstado } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjConvidado } from "@/models/hj-convidado";
import { HjEquipe } from "@/models/hj-equipe";
import { HjProjeto } from "@/models/hj-projeto";
import { HjRelatorio } from "@/models/hj-relatorio";

import { createUser } from "./api";
import { setSessionCookie } from "./next-headers";

// The HJ Team panel's fixtures: a project running today, teams, people in
// their roles, reports and guests — and a sign-in that carries the
// administrator flag the way the login route does.

export const hoje = todayInBrazil();

type UserDoc = Awaited<ReturnType<typeof createUser>>;

export async function signInAsPanel(user: UserDoc & { isAdmin?: boolean }) {
  const payload: SessionPayload = {
    userId: user._id.toString(),
    login: user.login,
    fullName: user.fullName,
    role: user.role,
    language: user.language,
    ...(user.role === "tutor" && user.isAdmin ? { admin: true } : {}),
  };
  const token = await createSessionToken(payload);
  setSessionCookie(token);
  return token;
}

export async function createMember(fullName = "Membro de Teste") {
  return createUser({ fullName, role: "student" });
}

export async function createEducator(fullName = "Educador de Teste") {
  return createUser({ fullName, role: "tutor" });
}

export async function createAdmin(fullName = "Administrador de Teste") {
  const user = await createUser({ fullName, role: "tutor" });
  await AcademyUser.updateOne({ _id: user._id }, { $set: { isAdmin: true } });
  return Object.assign(user, { isAdmin: true });
}

export async function createProjeto(
  overrides: Partial<{
    nome: string;
    tipo: "arrecadacao" | "testemunho";
    inicio: string;
    fim: string;
    ativo: boolean;
    diasDescanso: string[];
    metaDiariaPadraoCents: number;
    metaTotalCents: number;
    metasPrograma: { programa: HjPrograma; metaCents: number }[];
  }> = {},
) {
  return HjProjeto.create({
    nome: overrides.nome ?? "RM de teste",
    tipo: overrides.tipo ?? "arrecadacao",
    inicio: overrides.inicio ?? addDays(hoje, -10),
    fim: overrides.fim ?? addDays(hoje, 19),
    ativo: overrides.ativo ?? true,
    diasDescanso: overrides.diasDescanso ?? [],
    metaDiariaPadraoCents: overrides.metaDiariaPadraoCents ?? 30000,
    metaTotalCents: overrides.metaTotalCents ?? 100_000_000,
    metasPrograma: overrides.metasPrograma ?? [{ programa: "HJA", metaCents: 35_000_000 }],
  });
}

export async function createEquipe(
  projetoId: Types.ObjectId,
  overrides: Partial<{
    nome: string;
    programa: HjPrograma;
    educadorId: Types.ObjectId | null;
    capitaoId: Types.ObjectId | null;
    membroIds: Types.ObjectId[];
  }> = {},
) {
  return HjEquipe.create({
    projetoId,
    nome: overrides.nome ?? "Equipe 01 – HJA",
    programa: overrides.programa ?? "HJA",
    educadorId: overrides.educadorId ?? null,
    capitaoId: overrides.capitaoId ?? null,
    membroIds: overrides.membroIds ?? [],
  });
}

export async function createRelatorio(
  projetoId: Types.ObjectId,
  equipeId: Types.ObjectId,
  membroId: Types.ObjectId,
  overrides: Partial<{
    data: string;
    dinheiroCents: number;
    pixCents: number;
    despesasCents: number;
    estado: RelatorioEstado;
    motivoDevolucao: string;
  }> = {},
) {
  const dinheiroCents = overrides.dinheiroCents ?? 30000;
  const pixCents = overrides.pixCents ?? 10000;
  const despesasCents = overrides.despesasCents ?? 0;
  return HjRelatorio.create({
    projetoId,
    equipeId,
    membroId,
    data: overrides.data ?? hoje,
    dinheiroCents,
    pixCents,
    despesasCents,
    liquidoCents: liquido(dinheiroCents, pixCents, despesasCents),
    estado: overrides.estado ?? "enviado",
    motivoDevolucao: overrides.motivoDevolucao ?? "",
    enviadoEm: new Date(),
  });
}

export async function createConvidado(
  responsavelId: Types.ObjectId,
  overrides: Partial<{ nome: string; etapa: ConvidadoEtapa; conferencias: number; ultimoContato: string | null }> = {},
) {
  return HjConvidado.create({
    responsavelId,
    nome: overrides.nome ?? "Convidado de Teste",
    etapa: overrides.etapa ?? "pre_gateway",
    conferencias: overrides.conferencias ?? 0,
    ultimoContato: overrides.ultimoContato === undefined ? hoje : overrides.ultimoContato,
    datas: { primeiroContato: hoje },
  });
}

// A whole team in one go: a captain, two members, their educator, the
// project they belong to.
export async function createTeamSetup() {
  const educador = await createEducator("Educador da Equipe");
  const capita = await createMember("Capitã da Equipe");
  const membro = await createMember("Membro da Equipe");
  const colega = await createMember("Colega da Equipe");
  const projeto = await createProjeto();
  const equipe = await createEquipe(projeto._id, {
    educadorId: educador._id,
    capitaoId: capita._id,
    membroIds: [capita._id, membro._id, colega._id],
  });
  return { educador, capita, membro, colega, projeto, equipe };
}
