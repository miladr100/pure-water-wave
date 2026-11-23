"use client";

import { Check, ChevronDown, Landmark, Layers, MapPinned, Plus, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { PainelEu } from "@/app/api/painel/eu/route";
import { toApiError, useApi } from "@/components/academy/use-api";
import { Card, Failed, LoadingBlock } from "@/components/painel/bits";
import { refreshEu, usePainelEu } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjetoContabil } from "@/lib/hj/contabilidade";
import type { EquipeAdmin, EquipePainel } from "@/lib/hj/types";

import { Assistente } from "./assistente";
import { MovimentoDialog } from "./movimento-dialog";
import { ContabilidadeProvider, useContabilidade, useEstadoContabil, type Grupo } from "./store";

// A moldura da Contabilidade: descobre quais contabilidades a pessoa pode ver,
// e desenha a barra com o projeto escolhido, o assistente e o "+ Novo" por
// cima de cada tela.

export const GERAL_ID = "geral";

const GERAL: ProjetoContabil = {
  id: GERAL_ID,
  nome: "Time HJ — Geral",
  tipo: "geral",
  programa: null,
  area: null,
  educador: null,
  capitao: null,
  membros: [],
};

export function ContabilidadeFrame({ lado, children }: { lado: "painel" | "admin"; children: ReactNode }) {
  const eu = usePainelEu();
  if (!eu) {
    return <SemEu />;
  }
  return lado === "admin" ? <LadoAdmin eu={eu}>{children}</LadoAdmin> : <LadoPainel eu={eu}>{children}</LadoPainel>;
}

// Sem a sessão a moldura não sabe o que mostrar. Se o pedido falhou, a tela diz
// e deixa tentar de novo, em vez de ficar carregando para sempre.
function SemEu() {
  const [erro, setErro] = useState<unknown>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    refreshEu().catch((error: unknown) => {
      if (vivo) {
        setErro(error ?? new Error("sem sessão"));
      }
    });
    return () => {
      vivo = false;
    };
  }, [tentativa]);

  if (erro) {
    return (
      <Failed
        error={toApiError(erro)}
        onRetry={() => {
          setErro(null);
          setTentativa((atual) => atual + 1);
        }}
      />
    );
  }
  return <LoadingBlock />;
}

type EquipesReply = { projeto: { id: string; nome: string } | null; equipes: EquipeAdmin[] };

function LadoAdmin({ eu, children }: { eu: PainelEu; children: ReactNode }) {
  const { data, error, loading, reload } = useApi<EquipesReply>("/api/admin/hj/equipes");
  const estado = useEstadoContabil();
  const veTudo = eu.papeis.administrador || estado.veTodas.includes(eu.id);

  const { projetos, grupos } = useMemo(() => {
    const equipes = (data?.equipes ?? []).filter((equipe) => veTudo || equipe.educador?.id === eu.id);
    const lista: ProjetoContabil[] = equipes.map((equipe) => ({
      id: equipe.id,
      nome: equipe.nome,
      tipo: "equipe",
      programa: equipe.programa,
      area: equipe.area?.local.nome ?? null,
      educador: equipe.educador?.nome ?? null,
      capitao: equipe.capitao?.nome ?? null,
      membros: equipe.membros.map((membro) => membro.nome),
    }));
    // uma área vira um conjunto quando junta mais de uma equipe, sem ser todas
    const porArea = new Map<string, Grupo>();
    for (const equipe of equipes) {
      for (const area of [equipe.area?.regiao, equipe.area?.pais, equipe.area?.local]) {
        if (!area) {
          continue;
        }
        const grupo = porArea.get(area.id) ?? { id: area.id, nome: area.nome, projetoIds: [] };
        grupo.projetoIds.push(equipe.id);
        porArea.set(area.id, grupo);
      }
    }
    const vistos = new Set<string>();
    const conjuntos = [...porArea.values()].filter((grupo) => {
      const chave = [...grupo.projetoIds].sort().join(",");
      if (grupo.projetoIds.length < 2 || grupo.projetoIds.length >= equipes.length || vistos.has(chave)) {
        return false;
      }
      vistos.add(chave);
      return true;
    });
    return { projetos: veTudo ? [...lista, GERAL] : lista, grupos: conjuntos };
  }, [data, veTudo, eu.id]);

  if (loading && !data) {
    return <LoadingBlock />;
  }
  if (error) {
    return <Failed error={error} onRetry={reload} />;
  }
  if (!projetos.length) {
    return (
      <Aviso titulo="Nenhuma contabilidade para você ainda">
        Você vê a contabilidade das equipes de que é educador. Quando uma equipe for ligada a você, ela aparece aqui.
      </Aviso>
    );
  }
  return (
    <ContabilidadeProvider lado="admin" eu={eu} projetos={projetos} grupos={grupos}>
      <Moldura>{children}</Moldura>
    </ContabilidadeProvider>
  );
}

function LadoPainel({ eu, children }: { eu: PainelEu; children: ReactNode }) {
  if (!eu.papeis.capitao || !eu.equipe) {
    return (
      <Aviso titulo="A contabilidade fica com o capitão da equipe">
        Os seus gastos do dia entram pelo relatório de RM: transporte, alimentação e o que mais houver. Depois de validado, o capitão vê tudo na
        contabilidade da equipe.
        <span className="mt-4 block">
          <Button asChild className="rounded-full">
            <Link href="/painel/arrecadacao">Abrir o relatório do dia</Link>
          </Button>
        </span>
      </Aviso>
    );
  }
  return <DoCapitao eu={eu}>{children}</DoCapitao>;
}

function DoCapitao({ eu, children }: { eu: PainelEu; children: ReactNode }) {
  const { data, error, loading, reload } = useApi<EquipePainel>("/api/painel/equipe");
  const equipe = eu.equipe;
  const projetos = useMemo<ProjetoContabil[]>(
    () =>
      equipe
        ? [
            {
              id: equipe.id,
              nome: equipe.nome,
              tipo: "equipe",
              programa: equipe.programa,
              area: null,
              educador: equipe.educador?.nome ?? null,
              capitao: equipe.capitao?.nome ?? null,
              membros: (data?.membros ?? []).map((membro) => membro.nome),
            },
          ]
        : [],
    [equipe, data],
  );
  const grupos = useMemo<Grupo[]>(() => [], []);

  if (loading && !data) {
    return <LoadingBlock />;
  }
  if (error) {
    return <Failed error={error} onRetry={reload} />;
  }
  return (
    <ContabilidadeProvider lado="painel" eu={eu} projetos={projetos} grupos={grupos}>
      <Moldura>{children}</Moldura>
    </ContabilidadeProvider>
  );
}

function Aviso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <h1 className="font-display text-2xl font-semibold text-primary-deep">{titulo}</h1>
      <div className="mt-2 text-muted-foreground">{children}</div>
    </Card>
  );
}

function Moldura({ children }: { children: ReactNode }) {
  const { editor, abrirEditor, setAssistenteAberto } = useContabilidade();
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Escopo />
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => setAssistenteAberto(true)}>
            <Sparkles className="h-4 w-4" aria-hidden />
            Assistente
          </Button>
          <Button type="button" className="rounded-full" onClick={() => abrirEditor()}>
            <Plus className="h-4 w-4" aria-hidden />
            Novo
          </Button>
        </div>
      </div>
      {children}
      {editor ? <MovimentoDialog key={editor.chave} rascunho={editor.rascunho} aoSalvar={editor.aoSalvar} /> : null}
      <Assistente />
    </div>
  );
}

// O projeto que se está olhando. Quem cuida de mais de uma equipe escolhe
// aqui uma delas, uma área, ou todas juntas.
function Escopo() {
  const { projetos, grupos, escopo, setEscopo, escopoNome, doEscopo, combinado } = useContabilidade();
  const Icone = combinado ? Layers : doEscopo[0]?.tipo === "geral" ? Landmark : UsersRound;
  const chip = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-deep">
        <Icone className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-sm font-semibold leading-tight text-primary-deep">{escopoNome}</span>
        <span className="block truncate text-[11px] leading-tight text-muted-foreground">
          {combinado ? `${doEscopo.length} contabilidades juntas` : (doEscopo[0]?.programa ?? "Contabilidade geral")}
        </span>
      </span>
    </>
  );
  const forma = "inline-flex h-11 max-w-full items-center gap-2.5 rounded-full border border-border/70 bg-card py-1 pl-1.5 pr-4";

  if (projetos.length < 2) {
    return <div className={forma}>{chip}</div>;
  }

  const equipes = projetos.filter((projeto) => projeto.tipo === "equipe");
  const geral = projetos.find((projeto) => projeto.tipo === "geral");
  const item = (id: string, nome: string, Icon: typeof Layers, detalhe?: string | null) => (
    <DropdownMenuItem key={id} onSelect={() => setEscopo(id)} className="gap-2.5 rounded-lg py-2">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{nome}</span>
        {detalhe ? <span className="block truncate text-[11px] text-muted-foreground">{detalhe}</span> : null}
      </span>
      {escopo === id ? <Check className="h-4 w-4 text-primary" aria-hidden /> : null}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={`${forma} cursor-pointer pr-3 transition-colors hover:bg-muted/60`} aria-label="Escolher a contabilidade">
          {chip}
          <ChevronDown className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[70vh] w-72 overflow-y-auto rounded-2xl p-1.5">
        {item("todos", "Todos os projetos", Layers, `${projetos.length} contabilidades juntas`)}
        {grupos.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Áreas</DropdownMenuLabel>
            {grupos.map((grupo) => item(`area:${grupo.id}`, grupo.nome, MapPinned, `${grupo.projetoIds.length} equipes`))}
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Equipes</DropdownMenuLabel>
        {equipes.map((projeto) => item(projeto.id, projeto.nome, UsersRound, [projeto.area, projeto.capitao].filter(Boolean).join(" · ") || projeto.programa))}
        {geral ? (
          <>
            <DropdownMenuSeparator />
            {item(geral.id, geral.nome, Landmark, "Caixa central do projeto")}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
