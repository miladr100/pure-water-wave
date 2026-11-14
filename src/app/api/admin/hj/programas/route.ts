import { NextResponse } from "next/server";

import { jsonError, serverError } from "@/lib/academy/http";
import { HJ_PROGRAMAS, type ProgramaBody, type ProgramaCatalogo } from "@/lib/hj/types";
import { HjPrograma, programasCatalogo } from "@/models/hj-programa";

import { adminContext, educatorContext, textField } from "../_lib/shared";

const shape = (docs: Awaited<ReturnType<typeof programasCatalogo>>): ProgramaCatalogo[] =>
  docs.map((doc) => ({ sigla: doc.sigla, nome: doc.nome, ativo: doc.ativo !== false, turmas: doc.turmas.map((t) => ({ nome: t.nome, ativa: t.ativa !== false })) }));

// GET: the programs and their cohorts, for forms and filters.
export async function GET() {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    return NextResponse.json({ programas: shape(await programasCatalogo()) });
  } catch (error) {
    return serverError("Erro ao listar programas", error, "Não foi possível carregar os programas");
  }
}

// PUT: the administrator renames a program, (de)activates it, or replaces
// its list of cohorts. The initials never change (teams key on them).
export async function PUT(request: Request) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as Partial<ProgramaBody>;
    if (!body.sigla || !HJ_PROGRAMAS.includes(body.sigla)) {
      return jsonError("Programa inválido", 400, { code: "INVALID_PROGRAM" });
    }
    await programasCatalogo();
    const update: Record<string, unknown> = {};
    if (body.nome !== undefined) {
      const nome = textField(body.nome, 60);
      if (nome.length < 2) {
        return jsonError("Nome obrigatório", 400, { code: "NAME_REQUIRED" });
      }
      update.nome = nome;
    }
    if (typeof body.ativo === "boolean") {
      update.ativo = body.ativo;
    }
    if (body.turmas !== undefined) {
      if (!Array.isArray(body.turmas)) {
        return jsonError("Turmas inválidas", 400, { code: "INVALID_COHORTS" });
      }
      const turmas = body.turmas
        .map((t) => ({ nome: textField(t?.nome, 60), ativa: t?.ativa !== false }))
        .filter((t) => t.nome.length > 0);
      const nomes = new Set(turmas.map((t) => t.nome.toLowerCase()));
      if (nomes.size !== turmas.length) {
        return jsonError("Turma repetida", 400, { code: "DUPLICATE_COHORT" });
      }
      update.turmas = turmas;
    }
    if (Object.keys(update).length === 0) {
      return jsonError("Nada para salvar", 400, { code: "EMPTY" });
    }
    await HjPrograma.updateOne({ sigla: body.sigla }, { $set: update });
    return NextResponse.json({ programas: shape(await programasCatalogo()) });
  } catch (error) {
    return serverError("Erro ao salvar programa", error, "Não foi possível salvar o programa");
  }
}
