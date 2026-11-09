import { NextResponse } from "next/server";

import { serverError } from "@/lib/academy/http";
import { sameId, USER_FIELDS, type EquipeDoc, type UserDoc } from "@/lib/hj/data";
import type { PessoaRow } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjEquipe } from "@/models/hj-equipe";

import { educatorContext } from "../_lib/shared";

// Everyone with an academy account and their roles in the panel: members,
// educators (role tutor) and administrators (tutor + isAdmin), with the
// team each one is in for the active project. `?papel=` keeps one group.
export async function GET(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const params = new URL(request.url).searchParams;
    const papel = params.get("papel");
    const busca = params.get("busca")?.trim().toLowerCase() ?? "";

    const users = (await AcademyUser.find().select(USER_FIELDS).sort({ fullName: 1 }).lean()) as UserDoc[];
    const equipes = context.projeto ? ((await HjEquipe.find({ projetoId: context.projeto._id }).lean()) as EquipeDoc[]) : [];

    const rows: PessoaRow[] = users.map((user) => {
      const equipe = equipes.find((item) => item.membroIds.some((id) => sameId(id, user._id))) ?? null;
      const educador = user.role === "tutor";
      return {
        id: user._id.toString(),
        nome: user.fullName,
        email: user.email,
        telefone: user.phone ?? "",
        pais: user.country ?? "",
        papeis: {
          membro: true,
          capitao: Boolean(equipe && sameId(equipe.capitaoId, user._id)),
          educador,
          administrador: educador && user.isAdmin === true,
        },
        equipe: equipe ? { id: equipe._id.toString(), nome: equipe.nome, programa: equipe.programa } : null,
        criadoEm: (user.createdAt ?? new Date()).toISOString(),
        ultimoAcesso: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
      };
    });

    const filtered = rows.filter((row) => {
      if (busca && !row.nome.toLowerCase().includes(busca) && !row.email.toLowerCase().includes(busca)) {
        return false;
      }
      switch (papel) {
        case "educador":
          return row.papeis.educador;
        case "administrador":
          return row.papeis.administrador;
        case "membro":
          return !row.papeis.educador;
        case "capitao":
          return row.papeis.capitao;
        default:
          return true;
      }
    });

    return NextResponse.json({ pessoas: filtered, papel: papel ?? "todos" });
  } catch (error) {
    return serverError("Erro ao listar pessoas", error, "Não foi possível carregar as pessoas");
  }
}
