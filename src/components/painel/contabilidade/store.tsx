"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import type { PainelEu } from "@/app/api/painel/eu/route";
import { api, ApiError } from "@/lib/academy/api-client";
import {
  MOEDA_ORDEM,
  ordenar,
  type Agente,
  type Categoria,
  type Comprovante,
  type ContabilidadeReply,
  type Moeda,
  type Movimento,
  type MovimentoNovo,
  type ProjetoContabil,
} from "@/lib/hj/contabilidade";

// A Contabilidade no navegador: os livros, os movimentos e os ajustes vêm do
// servidor (/api/painel/contabilidade) e cada mudança vai para lá antes de
// aparecer. Só a contabilidade escolhida no seletor fica neste navegador.

export const BASE_API = "/api/painel/contabilidade";

// Um valor guardado no navegador, lido por `useSyncExternalStore`.
function criarLoja<T>(key: string, vazio: T, ler: (raw: unknown) => T) {
  const listeners = new Set<() => void>();
  let lido: string | null | undefined;
  let valor = vazio;
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

const lojaEscopo = criarLoja<string>("pww_contabilidade_escopo", "", (raw) => (typeof raw === "string" ? raw : ""));

// multipart (arquivos), com as mesmas respostas de erro de `api`
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", credentials: "same-origin", body: form });
  } catch {
    throw new ApiError(0, { error: "Sem conexão" });
  }
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiError(response.status, data);
  }
  return data as T;
}

// Fotos grandes de celular viram um JPEG de até 1600 px antes de subir: o
// comprovante continua legível e o envio cabe no limite.
export async function encolherFoto(arquivo: File): Promise<File> {
  if (!arquivo.type.startsWith("image/") || arquivo.size < 600_000) {
    return arquivo;
  }
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], arquivo.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : arquivo;
  } catch {
    return arquivo;
  }
}

export const urlComprovante = (comprovante: Comprovante) => `${BASE_API}/comprovantes/${comprovante.id}`;

// Um conjunto de equipes que se olha junto: uma área de missão.
export type Grupo = { id: string; nome: string; projetoIds: string[] };

// O que o formulário de movimento recebe para abrir: nada (novo), um rascunho
// do assistente, ou um movimento existente (com `id`).
export type Rascunho = Partial<Movimento>;

type Contexto = {
  lado: "painel" | "admin";
  base: string;
  eu: PainelEu;
  hoje: string;
  administrador: boolean;
  podeConectar: boolean;
  projetos: ProjetoContabil[];
  grupos: Grupo[];
  escopo: string;
  setEscopo: (escopo: string) => void;
  escopoNome: string;
  doEscopo: ProjetoContabil[];
  combinado: boolean;
  // movimentos do escopo, do mais novo para o mais antigo
  movimentos: Movimento[];
  // o dia mais antigo com movimento no escopo (os seletores de mês param nele)
  inicio: string;
  moedas: Moeda[];
  moedasLigadas: Record<string, Moeda[]>;
  categorias: Categoria[];
  categoriasEmUso: string[];
  veTodas: string[];
  agentes: Agente[];
  assistenteIA: ContabilidadeReply["assistenteIA"];
  categoria: (id: string | null) => Categoria | undefined;
  projeto: (id: string) => ProjetoContabil | undefined;
  pessoas: (projetoId: string) => string[];
  salvar: (novo: MovimentoNovo, id?: string) => Promise<Movimento>;
  remover: (id: string) => Promise<Movimento | null>;
  restaurar: (mov: Movimento) => Promise<void>;
  enviarComprovante: (arquivo: File, livroId: string) => Promise<Comprovante>;
  criarCategoria: (nome: string, tipo: "saida" | "entrada") => Promise<Categoria>;
  apagarCategoria: (id: string) => Promise<void>;
  ligarMoedas: (livroId: string, moedas: Moeda[]) => Promise<void>;
  setVeTodas: (educadorId: string, ve: boolean) => Promise<void>;
  desconectarAgente: (id: string) => Promise<void>;
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

export function ContabilidadeProvider({ eu, dados, children }: { eu: PainelEu; dados: ContabilidadeReply; children: ReactNode }) {
  const { lado, hoje, livros: projetos, grupos } = dados;
  const escopoSalvo = useSyncExternalStore(lojaEscopo.subscribe, lojaEscopo.get, lojaEscopo.vazio);
  const [editor, setEditor] = useState<Contexto["editor"]>(null);
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [todos, setTodos] = useState<Movimento[]>(dados.movimentos);
  const [categorias, setCategorias] = useState<Categoria[]>(dados.categorias);
  const [categoriasEmUso, setCategoriasEmUso] = useState<string[]>(dados.categoriasEmUso);
  const [moedasLigadas, setMoedasLigadas] = useState(dados.moedasLigadas);
  const [veTodas, setVeTodasState] = useState(dados.veTodas);
  const [agentes, setAgentes] = useState(dados.agentes);

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

  const inicio = useMemo(() => movimentos.reduce((menor, mov) => (mov.data < menor ? mov.data : menor), hoje), [movimentos, hoje]);

  const moedas = useMemo(() => {
    const usadas = new Set<Moeda>(["BRL"]);
    for (const mov of movimentos) {
      usadas.add(mov.moeda);
      if (mov.para) {
        usadas.add(mov.para.moeda);
      }
    }
    for (const projeto of doEscopo) {
      for (const moeda of moedasLigadas[projeto.id] ?? []) {
        usadas.add(moeda);
      }
    }
    return MOEDA_ORDEM.filter((moeda) => usadas.has(moeda));
  }, [movimentos, doEscopo, moedasLigadas]);

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

  const salvar = useCallback(async (novo: MovimentoNovo, id?: string) => {
    const body = { ...novo, comprovanteId: novo.comprovante?.id ?? null };
    const { movimento } = id
      ? await api<{ movimento: Movimento }>(`${BASE_API}/movimentos/${id}`, { method: "PATCH", body })
      : await api<{ movimento: Movimento }>(`${BASE_API}/movimentos`, { method: "POST", body });
    setTodos((atual) => [...atual.filter((mov) => mov.id !== movimento.id), movimento]);
    if (movimento.categoriaId?.startsWith("c:")) {
      setCategoriasEmUso((atual) => (atual.includes(movimento.categoriaId as string) ? atual : [...atual, movimento.categoriaId as string]));
    }
    return movimento;
  }, []);

  const remover = useCallback(
    async (id: string) => {
      const mov = todos.find((item) => item.id === id) ?? null;
      await api(`${BASE_API}/movimentos/${id}`, { method: "DELETE" });
      setTodos((atual) => atual.filter((item) => item.id !== id));
      return mov;
    },
    [todos],
  );

  const restaurar = useCallback(async (mov: Movimento) => {
    const { movimento } = await api<{ movimento: Movimento | null }>(`${BASE_API}/movimentos/${mov.id}/restaurar`, { method: "POST" });
    setTodos((atual) => [...atual.filter((item) => item.id !== mov.id), movimento ?? mov]);
  }, []);

  const enviarComprovante = useCallback(async (arquivo: File, livroId: string) => {
    const form = new FormData();
    form.append("arquivo", await encolherFoto(arquivo));
    form.append("livroId", livroId);
    const { comprovante } = await apiForm<{ comprovante: Comprovante }>(`${BASE_API}/comprovantes`, form);
    return comprovante;
  }, []);

  const criarCategoria = useCallback(async (nome: string, tipo: "saida" | "entrada") => {
    const { categoria: nova } = await api<{ categoria: Categoria }>(`${BASE_API}/categorias`, { method: "POST", body: { nome, tipo } });
    setCategorias((atual) => [...atual, nova]);
    return nova;
  }, []);

  const apagarCategoria = useCallback(async (id: string) => {
    await api(`${BASE_API}/categorias?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setCategorias((atual) => atual.filter((item) => item.id !== id));
  }, []);

  const ligarMoedas = useCallback(async (livroId: string, lista: Moeda[]) => {
    const resposta = await api<{ livroId: string; moedas: Moeda[] }>(`${BASE_API}/moedas`, { method: "PUT", body: { livroId, moedas: lista } });
    setMoedasLigadas((atual) => ({ ...atual, [resposta.livroId]: resposta.moedas }));
  }, []);

  const setVeTodas = useCallback(async (educadorId: string, ve: boolean) => {
    const resposta = await api<{ veTodas: string[] }>(`${BASE_API}/acesso`, { method: "PUT", body: { educadorId, ve } });
    setVeTodasState(resposta.veTodas);
  }, []);

  const desconectarAgente = useCallback(async (id: string) => {
    const resposta = await api<{ agentes: Agente[] }>(`${BASE_API}/agentes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setAgentes(resposta.agentes);
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
    administrador: dados.administrador,
    podeConectar: dados.podeConectar,
    projetos,
    grupos,
    escopo,
    setEscopo: lojaEscopo.set,
    escopoNome,
    doEscopo,
    combinado: doEscopo.length > 1,
    movimentos,
    inicio,
    moedas,
    moedasLigadas,
    categorias,
    categoriasEmUso,
    veTodas,
    agentes,
    assistenteIA: dados.assistenteIA,
    categoria,
    projeto,
    pessoas,
    salvar,
    remover,
    restaurar,
    enviarComprovante,
    criarCategoria,
    apagarCategoria,
    ligarMoedas,
    setVeTodas,
    desconectarAgente,
    editor,
    abrirEditor,
    fecharEditor,
    assistenteAberto,
    setAssistenteAberto,
  };

  return <ContabilidadeContext.Provider value={value}>{children}</ContabilidadeContext.Provider>;
}
