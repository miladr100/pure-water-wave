import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { serverError } from "@/lib/academy/http";
import { AreasTree } from "@/lib/hj/areas";
import { testemunhoTeamsOf } from "@/lib/hj/caixa";
import { activeProject, convidadoRow, equipeLookup, guestsOf, projetoResumo, ref, usersById } from "@/lib/hj/data";
import { ultimasDasEquipes, ultimasDosMembros } from "@/lib/hj/orientacoes";
import { indicadoresDe, pontoDeAtencao, somaIndicadores } from "@/lib/hj/testemunho";
import type { EquipeTestemunhoRow, TestemunhoEquipes } from "@/lib/hj/types";

import { educatorContext } from "../../_lib/shared";

// GET: every team of the drive with the four indicators Rev. Kim reads
// (Kit 1, fichas, Kit 2, Jardim), the "ponto de atenção" when two of them
// drift apart, and the last orientation the educator gave the team
// (Yeseong, 14/11/2026), and each member's meta interna (Victor, 23/11/2026).
export async function GET() {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const projeto = await activeProject("testemunho");
    const equipes = await testemunhoTeamsOf(projeto, context.projeto);
    const areas = await AreasTree.load();

    const memberIds = new Set(equipes.flatMap((equipe) => equipe.membroIds.map(String)));
    const guests = memberIds.size > 0 ? await guestsOf(memberIds) : [];
    const users = await usersById([
      ...guests.map((guest) => guest.responsavelId),
      ...equipes.flatMap((equipe) => [equipe.capitaoId, equipe.educadorId].filter((id): id is Types.ObjectId => id != null)),
      ...equipes.flatMap((equipe) => equipe.membroIds),
    ]);
    const lookup = equipeLookup(equipes);
    const rows = guests.map((guest) => convidadoRow(guest, users, lookup, context.hoje));
    const orientacoes = await ultimasDasEquipes(equipes);
    // each member's meta interna: there is one in the testimony phase too (Victor, 23/11/2026)
    const metas = await ultimasDosMembros(memberIds);

    const totais: TestemunhoEquipes["totais"] = { kit1: 0, fichas: 0, kit2: 0, jardim: 0, convidados: 0, comAtencao: 0 };
    const lista: EquipeTestemunhoRow[] = equipes.map((equipe) => {
      const id = equipe._id.toString();
      const daEquipe = rows.filter((row) => row.equipe?.id === id);
      const indicadores = indicadoresDe(daEquipe);
      const atencao = pontoDeAtencao(indicadores);
      const comConvidado = new Set(daEquipe.map((row) => row.responsavel.id));
      somaIndicadores(totais, indicadores);
      totais.convidados += daEquipe.length;
      if (atencao) totais.comAtencao += 1;
      return {
        id,
        nome: equipe.nome,
        programa: equipe.programa,
        educador: ref(equipe.educadorId ? users.get(String(equipe.educadorId)) : null),
        capitao: ref(equipe.capitaoId ? users.get(String(equipe.capitaoId)) : null),
        membros: equipe.membroIds.length,
        membrosComConvidado: equipe.membroIds.filter((memberId) => comConvidado.has(String(memberId))).length,
        convidados: daEquipe.length,
        indicadores,
        atencao,
        orientacao: orientacoes.get(id) ?? null,
        metasInternas: equipe.membroIds
          .map((memberId) => ({ membro: { id: String(memberId), nome: users.get(String(memberId))?.fullName ?? "—" }, meta: metas.get(String(memberId)) ?? null }))
          .sort((a, b) => a.membro.nome.localeCompare(b.membro.nome, "pt")),
        area: areas.daEquipe(equipe.areaId),
      };
    });
    lista.sort((a, b) => Number(Boolean(b.atencao)) - Number(Boolean(a.atencao)) || a.nome.localeCompare(b.nome, "pt"));

    const body: TestemunhoEquipes = { projeto: projeto ? projetoResumo(projeto, context.hoje) : null, equipes: lista, totais };
    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar as equipes do testemunho", error, "Não foi possível carregar as equipes");
  }
}
