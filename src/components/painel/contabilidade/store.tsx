"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import type { PainelEu } from "@/app/api/painel/eu/route";
import {
  CATEGORIAS_BASE,
  MOEDA_ORDEM,
  MOEDAS,
  ORIGEM_NOME,
  ordenar,
  type Categoria,
  type Moeda,
  type Movimento,
  type MovimentoNovo,
  type ProjetoContabil,
} from "@/lib/hj/contabilidade";
import { gerarMovimentos } from "@/lib/hj/contabilidade-mock";
import { todayInBrazil } from "@/lib/hj/dates";

// Primeiro desenho da Contabilidade: os movimentos são gerados no navegador a
// partir das equipes reais, e o que a pessoa lança, edita ou apaga fica
// guardado só neste navegador. Nada disto toca o banco ainda.

export type Agente = { id: string; nome: string; desde: string };

export type Estado = {
  adicionados: Movimento[];
  editados: Record<string, Movimento>;
  removidos: string[];
  // categorias criadas pela equipe, além das da lista fixa
  categorias: Categoria[];
  // moedas ligadas à mão em cada projeto (as que têm movimento aparecem sozinhas)
  moedas: Record<string, Moeda[]>;
  // educadores que o administrador deixou ver todas as contabilidades
  veTodas: string[];
  agentes: Agente[];
};

const VAZIO: Estado = {
  adicionados: [],
  editados: {},
  removidos: [],
  categorias: [],
  moedas: {},
  veTodas: [],
  agentes: [{ id: "claude", nome: "Claude", desde: "2026-11-10" }],
};

// Um valor guardado no navegador, lido por `useSyncExternalStore`: o servidor
// desenha o estado vazio e o navegador adota o que está salvo sem um
// `setState` dentro de um efeito.
function criarLoja<T>(key: string, vazio: T, ler: (raw: unknown) => T) {
  const listeners = new Set<() => void>();
  let lido: string | null | undefined;
  let valor = vazio;
  // sem acesso ao armazenamento, o valor vive só enquanto a página está aberta
  let memoria: string | null = null;

  function texto() {
    if (memoria !== null) {
      return memoria;
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function get() {
    const atual = texto();
    if (atual !== lido) {
      lido = atual;
      try {
        valor = atual ? ler(JSON.parse(atual)) : vazio;
      } catch {
        valor = vazio;
      }
    }
    return valor;
  }

  function set(next: T) {
    const serial = JSON.stringify(next);
    try {
      window.localStorage.setItem(key, serial);
      memoria = null;
    } catch {
      memoria = serial;
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  }

  return { get, set, subscribe, vazio: () => vazio };
}

// O que está guardado pode ser de outra versão ou ter sido mexido à mão: só
// entra o que tem a forma esperada, e uma tela não quebra por um item torto.
const objeto = (raw: unknown): raw is Record<string, unknown> => typeof raw === "object" && raw !== null && !Array.isArray(raw);
const lista = <T,>(raw: unknown, serve: (item: unknown) => item is T): T[] => (Array.isArray(raw) ? raw.filter(serve) : []);
const ehTexto = (raw: unknown): raw is string => typeof raw === "string";
const ehMoeda = (raw: unknown): raw is Moeda => typeof raw === "string" && Object.hasOwn(MOEDAS, raw);
const ehMeio = (raw: unknown) => raw === "dinheiro" || raw === "conta";
const ehMovimento = (raw: unknown): raw is Movimento =>
  objeto(raw) &&
  ehTexto(raw.id) &&
  ehTexto(raw.projetoId) &&
  (raw.tipo === "saida" || raw.tipo === "entrada" || raw.tipo === "transferencia" || raw.tipo === "ajuste") &&
  ehTexto(raw.origem) &&
  Object.hasOwn(ORIGEM_NOME, raw.origem) &&
  ehTexto(raw.data) &&
  ehTexto(raw.descricao) &&
  ehTexto(raw.responsavel) &&
  ehMoeda(raw.moeda) &&
  ehMeio(raw.meio) &&
  Number.isFinite(raw.valorMinor) &&
  Number.isFinite(raw.seq) &&
  (raw.para === undefined || (objeto(raw.para) && ehMoeda(raw.para.moeda) && ehMeio(raw.para.meio) && Number.isFinite(raw.para.valorMinor)));
const ehCategoria = (raw: unknown): raw is Categoria =>
  objeto(raw) && ehTexto(raw.id) && ehTexto(raw.nome) && (raw.tipo === "saida" || raw.tipo === "entrada") && ehTexto(raw.icone) && Number.isFinite(raw.cor);
const ehAgente = (raw: unknown): raw is Agente => objeto(raw) && ehTexto(raw.id) && ehTexto(raw.nome) && ehTexto(raw.desde);

function lerEstado(raw: unknown): Estado {
  if (!objeto(raw)) {
    return VAZIO;
  }
  return {
    adicionados: lista(raw.adicionados, ehMovimento),
    editados: Object.fromEntries(Object.entries(objeto(raw.editados) ? raw.editados : {}).filter((par): par is [string, Movimento] => ehMovimento(par[1]))),
    removidos: lista(raw.removidos, ehTexto),
    categorias: lista(raw.categorias, ehCategoria),
    moedas: Object.fromEntries(Object.entries(objeto(raw.moedas) ? raw.moedas : {}).map(([id, moedas]) => [id, lista(moedas, ehMoeda)])),
    veTodas: lista(raw.veTodas, ehTexto),
    agentes: Array.isArray(raw.agentes) ? lista(raw.agentes, ehAgente) : VAZIO.agentes,
  };
}

const lojaEstado = criarLoja<Estado>("pww_contabilidade_v1", VAZIO, lerEstado);
const lojaEscopo = criarLoja<string>("pww_contabilidade_escopo", "", (raw) => (typeof raw === "string" ? raw : ""));

export function useEstadoContabil() {
  return useSyncExternalStore(lojaEstado.subscribe, lojaEstado.get, lojaEstado.vazio);
}

export function atualizarEstado(change: (estado: Estado) => Estado) {
  lojaEstado.set(change(lojaEstado.get()));
}

// Um conjunto de equipes que se olha junto: uma área de missão.
export type Grupo = { id: string; nome: string; projetoIds: string[] };

// O que o formulário de movimento recebe para abrir: nada (novo), um rascunho
// do assistente, ou um movimento existente (com `id`).
export type Rascunho = Partial<Movimento>;

type Contexto = {
  lado: "painel" | "admin";
  // onde a Contabilidade mora deste lado: /painel/contabilidade ou /admin/contabilidade
  base: string;
  eu: PainelEu;
  hoje: string;
  administrador: boolean;
  // todos os projetos que a pessoa pode ver
  projetos: ProjetoContabil[];
  grupos: Grupo[];
  escopo: string;
  setEscopo: (escopo: string) => void;
  escopoNome: string;
  // os projetos do escopo escolhido; mais de um = visão combinada
  doEscopo: ProjetoContabil[];
  combinado: boolean;
  // movimentos do escopo, do mais novo para o mais antigo
  movimentos: Movimento[];
  moedas: Moeda[];
  categorias: Categoria[];
  categoria: (id: string | null) => Categoria | undefined;
  projeto: (id: string) => ProjetoContabil | undefined;
  // quem pode aparecer como responsável por um lançamento
  pessoas: (projetoId: string) => string[];
  estado: Estado;
  salvar: (novo: MovimentoNovo, id?: string) => Movimento;
  remover: (id: string) => Movimento | null;
  restaurar: (mov: Movimento) => void;
  // `aoSalvar`: quem abriu o formulário fica sabendo do movimento salvo
  editor: { chave: number; rascunho: Rascunho; aoSalvar?: (mov: Movimento) => void } | null;
  abrirEditor: (rascunho?: Rascunho, aoSalvar?: (mov: Movimento) => void) => void;
  fecharEditor: () => void;
  assistenteAberto: boolean;
  setAssistenteAberto: (aberto: boolean) => void;
};

const ContabilidadeContext = createContext<Contexto | null>(null);

export function useContabilidade() {
  const value = useContext(ContabilidadeContext);
  if (!value) {
    throw new Error("useContabilidade fora da Contabilidade");
  }
  return value;
}

let contador = 0;

export function ContabilidadeProvider({
  lado,
  eu,
  projetos,
  grupos,
  children,
}: {
  lado: "painel" | "admin";
  eu: PainelEu;
  projetos: ProjetoContabil[];
  grupos: Grupo[];
  children: ReactNode;
}) {
  const estado = useEstadoContabil();
  const escopoSalvo = useSyncExternalStore(lojaEscopo.subscribe, lojaEscopo.get, lojaEscopo.vazio);
  const [editor, setEditor] = useState<Contexto["editor"]>(null);
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const hoje = todayInBrazil();

  const gerados = useMemo(() => projetos.flatMap((projeto) => gerarMovimentos(projeto, hoje)), [projetos, hoje]);

  // os gerados com as edições deste navegador por cima
  const todos = useMemo(() => {
    const visiveis = new Set(projetos.map((projeto) => projeto.id));
    const removidos = new Set(estado.removidos);
    const base = gerados.filter((mov) => !removidos.has(mov.id)).map((mov) => estado.editados[mov.id] ?? mov);
    return [...base, ...estado.adicionados].filter((mov) => visiveis.has(mov.projetoId));
  }, [gerados, estado.removidos, estado.editados, estado.adicionados, projetos]);

  const escopo = useMemo(() => {
    if (projetos.length === 1) {
      return projetos[0].id;
    }
    const existe =
      escopoSalvo === "todos" ||
      grupos.some((grupo) => `area:${grupo.id}` === escopoSalvo) ||
      projetos.some((projeto) => projeto.id === escopoSalvo);
    return existe ? escopoSalvo : "todos";
  }, [escopoSalvo, grupos, projetos]);

  const doEscopo = useMemo(() => {
    if (escopo === "todos") {
      return projetos;
    }
    const grupo = grupos.find((item) => `area:${item.id}` === escopo);
    if (grupo) {
      return projetos.filter((projeto) => grupo.projetoIds.includes(projeto.id));
    }
    return projetos.filter((projeto) => projeto.id === escopo);
  }, [escopo, grupos, projetos]);

  const movimentos = useMemo(() => {
    const ids = new Set(doEscopo.map((projeto) => projeto.id));
    return ordenar(todos.filter((mov) => ids.has(mov.projetoId)));
  }, [todos, doEscopo]);

  const moedas = useMemo(() => {
    const usadas = new Set<Moeda>(["BRL"]);
    for (const mov of movimentos) {
      usadas.add(mov.moeda);
      if (mov.para) {
        usadas.add(mov.para.moeda);
      }
    }
    for (const projeto of doEscopo) {
      for (const moeda of estado.moedas[projeto.id] ?? []) {
        usadas.add(moeda);
      }
    }
    return MOEDA_ORDEM.filter((moeda) => usadas.has(moeda));
  }, [movimentos, doEscopo, estado.moedas]);

  const categorias = useMemo(() => [...CATEGORIAS_BASE, ...estado.categorias], [estado.categorias]);
  const categoria = useCallback((id: string | null) => (id ? categorias.find((item) => item.id === id) : undefined), [categorias]);
  const projeto = useCallback((id: string) => projetos.find((item) => item.id === id), [projetos]);

  const pessoas = useCallback(
    (projetoId: string) => {
      const item = projetos.find((candidate) => candidate.id === projetoId);
      const nomes = [eu.nome, item?.capitao, ...(item?.membros ?? []), item?.educador].filter((nome): nome is string => Boolean(nome));
      return [...new Set(nomes)];
    },
    [projetos, eu.nome],
  );

  const salvar = useCallback(
    (novo: MovimentoNovo, id?: string) => {
      if (id) {
        const anterior = todos.find((mov) => mov.id === id);
        const editado: Movimento = { ...novo, id, seq: anterior?.seq ?? 0 };
        atualizarEstado((atual) =>
          atual.adicionados.some((mov) => mov.id === id)
            ? { ...atual, adicionados: atual.adicionados.map((mov) => (mov.id === id ? editado : mov)) }
            : { ...atual, editados: { ...atual.editados, [id]: editado } },
        );
        return editado;
      }
      contador += 1;
      // depois de tudo o que já foi lançado: a ordem dentro do dia é a de chegada
      const seq = lojaEstado.get().adicionados.reduce((maior, mov) => Math.max(maior, mov.seq), 1_000_000) + 1;
      const criado: Movimento = { ...novo, id: `novo:${Date.now().toString(36)}-${contador}`, seq };
      atualizarEstado((atual) => ({ ...atual, adicionados: [...atual.adicionados, criado] }));
      return criado;
    },
    [todos],
  );

  const remover = useCallback(
    (id: string) => {
      const mov = todos.find((item) => item.id === id) ?? null;
      atualizarEstado((atual) =>
        atual.adicionados.some((item) => item.id === id)
          ? { ...atual, adicionados: atual.adicionados.filter((item) => item.id !== id) }
          : { ...atual, removidos: [...atual.removidos, id] },
      );
      return mov;
    },
    [todos],
  );

  const restaurar = useCallback((mov: Movimento) => {
    atualizarEstado((atual) =>
      mov.id.startsWith("novo:")
        ? { ...atual, adicionados: [...atual.adicionados.filter((item) => item.id !== mov.id), mov] }
        : { ...atual, removidos: atual.removidos.filter((id) => id !== mov.id) },
    );
  }, []);

  const abrirEditor = useCallback((rascunho: Rascunho = {}, aoSalvar?: (mov: Movimento) => void) => {
    contador += 1;
    setEditor({ chave: contador, rascunho, aoSalvar });
  }, []);
  const fecharEditor = useCallback(() => setEditor(null), []);

  const escopoNome =
    doEscopo.length === 1
      ? doEscopo[0].nome
      : escopo === "todos"
        ? "Todos os projetos"
        : (grupos.find((grupo) => `area:${grupo.id}` === escopo)?.nome ?? "Todos os projetos");

  const value: Contexto = {
    lado,
    base: lado === "admin" ? "/admin/contabilidade" : "/painel/contabilidade",
    eu,
    hoje,
    administrador: eu.papeis.administrador,
    projetos,
    grupos,
    escopo,
    setEscopo: lojaEscopo.set,
    escopoNome,
    doEscopo,
    combinado: doEscopo.length > 1,
    movimentos,
    moedas,
    categorias,
    categoria,
    projeto,
    pessoas,
    estado,
    salvar,
    remover,
    restaurar,
    editor,
    abrirEditor,
    fecharEditor,
    assistenteAberto,
    setAssistenteAberto,
  };

  return <ContabilidadeContext.Provider value={value}>{children}</ContabilidadeContext.Provider>;
}
