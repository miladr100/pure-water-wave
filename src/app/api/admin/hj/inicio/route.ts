import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { serverError } from "@/lib/academy/http";
import { activeProject, convidadoRow, equipeLookup, guestsOf, projetoResumo, usersById, USER_FIELDS, type UserDoc } from "@/lib/hj/data";
import { idadeEm, perfilDe } from "@/lib/hj/perfil";
import { CONVIDADO_ETAPAS, type AcontecimentoTipo, type AdminHjInicio, type ConvidadoEtapa, type DadosGerais, type HjPrograma } from "@/lib/hj/types";
import { AcademyUser } from "@/models/academy-user";
import { HjAcontecimento } from "@/models/hj-convidado";
import { programasCatalogo } from "@/models/hj-programa";
import { indicadoresDe, pontoDeAtencao } from "@/lib/hj/testemunho";

import { buildGrid, educatorContext, PANORAMA_VAZIO, panoramaArrecadacao, projectFor } from "../_lib/shared";

type EventDoc = {
  _id: Types.ObjectId;
  convidadoId: Types.ObjectId;
  autorId: Types.ObjectId;
  tipo: AcontecimentoTipo;
  texto: string;
  data: string;
};

// The educator's and administrator's home: the course's general numbers
// (people, programs, boys and girls, average age, who stands out) and one
// line per project running today — the fundraising panorama lives in its
// own module since 14/11/2026 (Yeseong), the testimony teams in theirs.
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
      ...PANORAMA_VAZIO,
      geral: { pessoas: 0, porPrograma: [], meninos: 0, meninas: 0, semGenero: 0, idadeMedia: null, comIdade: 0, destaquesRm: [], destaquesTestemunho: [] },
      testemunho: {
        projeto: projetoTestemunho ? projetoResumo(projetoTestemunho, hoje) : null,
        convidados: 0,
        porEtapa,
        alertas: 0,
        porEquipe: [],
        comAtencao: 0,
        recentes: [],
      },
    };

    // Teams come from the fundraising project (the one that organises
    // people); the testimony overview counts their members' guests.
    const grid = projeto ? await buildGrid(projeto) : null;

    if (projeto && grid) {
      body.projeto = projetoResumo(projeto, hoje);
      Object.assign(body, panoramaArrecadacao(grid, hoje));
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
        const indicadores = indicadoresDe(daEquipe);
        return {
          id: equipe._id.toString(),
          nome: equipe.nome,
          programa: equipe.programa,
          convidados: daEquipe.length,
          alertas: daEquipe.filter((row) => row.alerta).length,
          indicadores,
          atencao: pontoDeAtencao(indicadores),
        };
      })
      .filter((equipe) => equipe.convidados > 0)
      // teams that need a look first, then the busiest
      .sort((a, b) => Number(Boolean(b.atencao)) - Number(Boolean(a.atencao)) || b.convidados - a.convidados || a.nome.localeCompare(b.nome, "pt"));
    body.testemunho.comAtencao = body.testemunho.porEquipe.filter((equipe) => equipe.atencao).length;
    body.geral = await dadosGerais([...memberIds], lookup, grid?.linhas ?? [], rows, hoje);

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

// The course as a whole: everyone in a team of the active fundraising
// project plus every member filed under a program. Program comes from the
// profile, else from the team; boys and girls from the profile's "sexo".
async function dadosGerais(
  memberIds: string[],
  lookup: ReturnType<typeof equipeLookup>,
  linhas: { membro: { id: string; nome: string }; equipe: { nome: string }; totalCents: number }[],
  guests: { responsavel: { id: string; nome: string }; equipe: { nome: string } | null; etapa: ConvidadoEtapa }[],
  hoje: string,
): Promise<DadosGerais> {
  const pessoas = (await AcademyUser.find({ role: "student", $or: [{ _id: { $in: memberIds } }, { "hj.perfil.programa": { $ne: null } }] })
    .select(USER_FIELDS)
    .lean()) as UserDoc[];
  const nomes = new Map((await programasCatalogo()).map((item) => [item.sigla, item.nome]));
  const porPrograma = new Map<HjPrograma, number>();
  let meninos = 0;
  let meninas = 0;
  let semGenero = 0;
  let somaIdade = 0;
  let comIdade = 0;
  for (const user of pessoas) {
    const perfil = perfilDe(user.hj);
    const programa = perfil.programa ?? lookup(user._id.toString())?.programa ?? null;
    if (programa) {
      porPrograma.set(programa, (porPrograma.get(programa) ?? 0) + 1);
    }
    if (perfil.genero === "masculino") meninos += 1;
    else if (perfil.genero === "feminino") meninas += 1;
    else semGenero += 1;
    const idade = idadeEm(user.birthday, hoje);
    if (idade !== null) {
      somaIdade += idade;
      comIdade += 1;
    }
  }

  const destaquesRm = linhas
    .filter((linha) => linha.totalCents > 0)
    .sort((a, b) => b.totalCents - a.totalCents || a.membro.nome.localeCompare(b.membro.nome, "pt"))
    .slice(0, 3)
    .map((linha) => ({ membro: linha.membro, equipe: linha.equipe.nome, totalCents: linha.totalCents }));

  const porResponsavel = new Map<string, DadosGerais["destaquesTestemunho"][number]>();
  for (const guest of guests) {
    const current = porResponsavel.get(guest.responsavel.id) ?? { membro: guest.responsavel, equipe: guest.equipe?.nome ?? null, convidados: 0, jardim: 0 };
    current.convidados += 1;
    if (guest.etapa === "jardim") current.jardim += 1;
    porResponsavel.set(guest.responsavel.id, current);
  }
  const destaquesTestemunho = [...porResponsavel.values()]
    .sort((a, b) => b.jardim - a.jardim || b.convidados - a.convidados || a.membro.nome.localeCompare(b.membro.nome, "pt"))
    .slice(0, 3);

  return {
    pessoas: pessoas.length,
    porPrograma: [...porPrograma.entries()]
      .map(([programa, total]) => ({ programa, nome: nomes.get(programa) ?? programa, pessoas: total }))
      .sort((a, b) => b.pessoas - a.pessoas || a.programa.localeCompare(b.programa)),
    meninos,
    meninas,
    semGenero,
    idadeMedia: comIdade > 0 ? Math.round((somaIdade / comIdade) * 10) / 10 : null,
    comIdade,
    destaquesRm,
    destaquesTestemunho,
  };
}
