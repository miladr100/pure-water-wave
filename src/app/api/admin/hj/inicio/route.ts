import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { serverError } from "@/lib/academy/http";
import { activeProject, convidadoRow, equipeLookup, guestsOf, projetoResumo, ref, sameId, usersById } from "@/lib/hj/data";
import { CONVIDADO_ETAPAS, type AcontecimentoTipo, type AdminHjInicio, type ConvidadoEtapa } from "@/lib/hj/types";
import { HjAcontecimento } from "@/models/hj-convidado";

import { buildGrid, educatorContext, metaTotal, porPrograma, projectFor } from "../_lib/shared";

type EventDoc = {
  _id: Types.ObjectId;
  convidadoId: Types.ObjectId;
  autorId: Types.ObjectId;
  tipo: AcontecimentoTipo;
  texto: string;
  data: string;
};

// The educator's and administrator's home: two overviews, one per kind
// of project running today — the fundraising (by program and by team) and
// the testimony drive (guests by stage and by team, latest happenings).
export async function GET(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const { context } = result;
    const hoje = context.hoje;
    const projeto = await projectFor(context, new URL(request.url).searchParams.get("projeto"));
    const projetoTestemunho = await activeProject("testemunho");

    const porEtapa = Object.fromEntries(CONVIDADO_ETAPAS.map((etapa) => [etapa, 0])) as Record<ConvidadoEtapa, number>;
    const body: AdminHjInicio = {
      projeto: null,
      totais: { liquidoCents: 0, metaCents: 0, membros: 0, equipes: 0, enviadosHoje: 0, pendentesValidacao: 0, devolvidos: 0 },
      programas: [],
      equipes: [],
      testemunho: {
        projeto: projetoTestemunho ? projetoResumo(projetoTestemunho, hoje) : null,
        convidados: 0,
        porEtapa,
        alertas: 0,
        porEquipe: [],
        recentes: [],
      },
    };

    // Teams come from the fundraising project (the one that organises
    // people); the testimony overview counts their members' guests.
    const grid = projeto ? await buildGrid(projeto) : null;

    if (projeto && grid) {
      const deHoje = grid.relatorios.filter((item) => item.data === hoje);
      body.projeto = projetoResumo(projeto, hoje);
      body.totais = {
        liquidoCents: grid.linhas.reduce((sum, linha) => sum + linha.totalCents, 0),
        metaCents: metaTotal(projeto),
        membros: grid.linhas.length,
        equipes: grid.equipes.length,
        enviadosHoje: deHoje.filter((item) => item.estado !== "devolvido").length,
        pendentesValidacao: grid.relatorios.filter((item) => item.estado === "enviado").length,
        devolvidos: grid.relatorios.filter((item) => item.estado === "devolvido").length,
      };
      body.programas = porPrograma(grid);
      body.equipes = grid.equipes
        .map((equipe) => {
          const linhas = grid.linhas.filter((linha) => linha.equipe.id === equipe._id.toString());
          const hojeDaEquipe = deHoje.filter((item) => sameId(item.equipeId, equipe._id) && item.estado !== "devolvido");
          return {
            id: equipe._id.toString(),
            nome: equipe.nome,
            programa: equipe.programa,
            educador: ref(equipe.educadorId ? grid.users.get(String(equipe.educadorId)) : null),
            capitao: ref(equipe.capitaoId ? grid.users.get(String(equipe.capitaoId)) : null),
            membros: equipe.membroIds.length,
            enviadosHoje: hojeDaEquipe.length,
            liquidoHojeCents: hojeDaEquipe.reduce((sum, item) => sum + item.liquidoCents, 0),
            liquidoCents: linhas.reduce((sum, linha) => sum + linha.totalCents, 0),
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
    }

    const equipes = grid?.equipes ?? [];
    const memberIds = new Set(equipes.flatMap((equipe) => equipe.membroIds.map(String)));
    const guests = memberIds.size > 0 ? await guestsOf(memberIds) : [];
    const users = grid?.users ?? (await usersById([]));
    const lookup = equipeLookup(equipes);
    const rows = guests.map((guest) => convidadoRow(guest, users, lookup, hoje));
    for (const row of rows) {
      porEtapa[row.etapa] += 1;
    }
    body.testemunho.convidados = rows.length;
    body.testemunho.alertas = rows.filter((row) => row.alerta).length;
    body.testemunho.porEquipe = equipes
      .map((equipe) => {
        const daEquipe = rows.filter((row) => row.equipe?.id === equipe._id.toString());
        return {
          id: equipe._id.toString(),
          nome: equipe.nome,
          programa: equipe.programa,
          convidados: daEquipe.length,
          alertas: daEquipe.filter((row) => row.alerta).length,
          sistema1: daEquipe.filter((row) => row.etapa === "sistema1").length,
          jardim: daEquipe.filter((row) => row.etapa === "jardim").length,
        };
      })
      .filter((equipe) => equipe.convidados > 0)
      .sort((a, b) => b.convidados - a.convidados || a.nome.localeCompare(b.nome, "pt"));

    if (guests.length > 0) {
      const events = (await HjAcontecimento.find({ convidadoId: { $in: guests.map((guest) => guest._id) } })
        .sort({ data: -1, createdAt: -1 })
        .limit(8)
        .lean()) as unknown as EventDoc[];
      const autores = await usersById(events.map((event) => event.autorId));
      const guestById = new Map(guests.map((guest) => [guest._id.toString(), guest]));
      body.testemunho.recentes = events.map((event) => ({
        id: event._id.toString(),
        convidado: { id: event.convidadoId.toString(), nome: guestById.get(event.convidadoId.toString())?.nome ?? "—" },
        tipo: event.tipo,
        texto: event.texto,
        data: event.data,
        autor: { id: event.autorId.toString(), nome: autores.get(event.autorId.toString())?.fullName ?? "—" },
      }));
    }

    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar a administração", error, "Não foi possível carregar a administração");
  }
}
