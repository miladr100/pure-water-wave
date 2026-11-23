// Contabilidade das equipes (Bonn Yoo e Wang Song, 14/11/2026): cada equipe
// é um "projeto" com movimentos em uma ou mais moedas. Os saldos nunca são
// convertidos nem somados entre moedas — cada moeda tem o seu.
//
// Este arquivo é só tipos e contas, sem banco: o primeiro desenho roda com
// dados gerados no navegador (ver contabilidade-mock.ts).

export const MOEDAS = {
  BRL: { nome: "Real", simbolo: "R$", decimais: 2 },
  USD: { nome: "Dólar", simbolo: "US$", decimais: 2 },
  EUR: { nome: "Euro", simbolo: "€", decimais: 2 },
  KRW: { nome: "Won coreano", simbolo: "₩", decimais: 0 },
  BOB: { nome: "Boliviano", simbolo: "Bs", decimais: 2 },
} as const;

export type Moeda = keyof typeof MOEDAS;
export const MOEDA_ORDEM: Moeda[] = ["BRL", "USD", "EUR", "KRW", "BOB"];

// Dinheiro em espécie ou o que está na conta (Pix, transferência, cartão) —
// as duas colunas da planilha da educadora.
export type Meio = "dinheiro" | "conta";
export const MEIO_NOME: Record<Meio, string> = { dinheiro: "Dinheiro", conta: "Pix / conta" };

export type TipoMovimento = "saida" | "entrada" | "transferencia" | "ajuste";
export type Origem = "manual" | "relatorio" | "assistente" | "mcp";

export type Movimento = {
  id: string;
  projetoId: string;
  tipo: TipoMovimento;
  // sempre positivo; só o ajuste guarda a diferença com sinal
  valorMinor: number;
  moeda: Moeda;
  meio: Meio;
  categoriaId: string | null;
  data: string;
  descricao: string;
  responsavel: string;
  origem: Origem;
  // marcado para conferir depois (falta o comprovante, valor a confirmar…)
  pendente: boolean;
  comprovante: string | null;
  // transferência: o lado que recebe (outra moeda = câmbio; outro meio = depósito)
  para?: { moeda: Moeda; meio: Meio; valorMinor: number };
  // ordem dentro do dia
  seq: number;
};

export type MovimentoNovo = Omit<Movimento, "id" | "seq">;

export type IconeCategoria =
  | "onibus"
  | "pacote"
  | "talheres"
  | "moedas"
  | "cartao"
  | "aperto"
  | "saude"
  | "cama"
  | "pontos"
  | "presente"
  | "banco"
  | "etiqueta"
  | "rm";

export type Categoria = {
  id: string;
  nome: string;
  tipo: "saida" | "entrada";
  icone: IconeCategoria;
  // posição fixa na paleta dos gráficos (1–8); 0 = cinza, entra em "Outros"
  cor: number;
  fixa?: boolean;
};

// As categorias de gasto são as da lista da educadora Bonn Yoo, na mesma ordem.
export const CATEGORIAS_BASE: Categoria[] = [
  { id: "transporte", nome: "Transporte", tipo: "saida", icone: "onibus", cor: 1, fixa: true },
  { id: "material", nome: "Compra de material - RM", tipo: "saida", icone: "pacote", cor: 2, fixa: true },
  { id: "alimentacao", nome: "Alimentação", tipo: "saida", icone: "talheres", cor: 3, fixa: true },
  { id: "ajuda", nome: "Ajuda de custo", tipo: "saida", icone: "moedas", cor: 4, fixa: true },
  { id: "cartao", nome: "Cartão de crédito", tipo: "saida", icone: "cartao", cor: 5, fixa: true },
  { id: "emprestimo", nome: "Empréstimo", tipo: "saida", icone: "aperto", cor: 6, fixa: true },
  { id: "cuidados", nome: "Cuidados pessoais", tipo: "saida", icone: "saude", cor: 7, fixa: true },
  { id: "estadia", nome: "Estadia", tipo: "saida", icone: "cama", cor: 8, fixa: true },
  { id: "outros", nome: "Outros", tipo: "saida", icone: "pontos", cor: 0, fixa: true },
  { id: "rm", nome: "Restauração Material", tipo: "entrada", icone: "rm", cor: 1, fixa: true },
  { id: "doacao", nome: "Doação", tipo: "entrada", icone: "presente", cor: 2, fixa: true },
  { id: "emprestimo-recebido", nome: "Empréstimo recebido", tipo: "entrada", icone: "banco", cor: 3, fixa: true },
  { id: "outras-entradas", nome: "Outras entradas", tipo: "entrada", icone: "pontos", cor: 0, fixa: true },
];

// As categorias que o membro preenche no relatório diário de RM.
export const CATEGORIAS_DESPESA = CATEGORIAS_BASE.filter((item) => item.tipo === "saida");

export const categoriaDespesa = (id: string) => CATEGORIAS_DESPESA.find((item) => item.id === id) ?? CATEGORIAS_DESPESA[CATEGORIAS_DESPESA.length - 1];

export type ProjetoContabil = {
  id: string;
  nome: string;
  tipo: "equipe" | "geral";
  programa: string | null;
  area: string | null;
  educador: string | null;
  capitao: string | null;
  membros: string[];
};

// ---- formatos -------------------------------------------------------------

const NBSP = " ";

export function fmtMoeda(minor: number, moeda: Moeda, options: { sinal?: boolean; curto?: boolean } = {}) {
  const { simbolo, decimais } = MOEDAS[moeda];
  const digits = options.curto ? 0 : decimais;
  const text = (Math.abs(minor) / 10 ** decimais).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const sign = minor < 0 ? "−" : options.sinal && minor > 0 ? "+" : "";
  return `${sign}${simbolo}${NBSP}${text}`;
}

// Acima disto o número é um erro de digitação, não um valor (em centavos; em
// won, que não tem centavos, em unidades).
export const VALOR_MAXIMO = 1_000_000_000;

// "1.234,56", "1234.56", "12,5" e "12" valem; devolve null quando não é um
// valor ou passa do máximo.
export function parseValor(text: string, moeda: Moeda): number | null {
  const raw = text.replace(/[^\d.,]/g, "");
  if (!/\d/.test(raw)) {
    return null;
  }
  const comma = raw.lastIndexOf(",");
  const dot = raw.lastIndexOf(".");
  let normal: string;
  if (comma >= 0) {
    normal = `${raw.slice(0, comma).replace(/[.,]/g, "")}.${raw.slice(comma + 1)}`;
  } else if (dot >= 0 && raw.length - dot - 1 !== 3) {
    normal = `${raw.slice(0, dot).replace(/\./g, "")}.${raw.slice(dot + 1)}`;
  } else {
    normal = raw.replace(/\./g, "");
  }
  const value = Number(normal);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  const minor = Math.round(value * 10 ** MOEDAS[moeda].decimais);
  return minor > VALOR_MAXIMO ? null : minor;
}

// O valor sem símbolo e sem ponto de milhar, como numa planilha: "1234,56".
export function valorSimples(minor: number, moeda: Moeda) {
  const { decimais } = MOEDAS[moeda];
  return (minor / 10 ** decimais).toFixed(decimais).replace(".", ",");
}

// O valor num campo de texto, sem o símbolo: "1.234,56".
export function valorParaCampo(minor: number, moeda: Moeda) {
  const { decimais } = MOEDAS[moeda];
  return (minor / 10 ** decimais).toLocaleString("pt-BR", { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const mesDe = (dia: string) => dia.slice(0, 7);

export function fmtMes(mes: string, estilo: "longo" | "curto" = "longo") {
  const [ano, numero] = mes.split("-").map(Number);
  const nome = MESES[numero - 1] ?? mes;
  return estilo === "curto" ? nome.slice(0, 3) : `${nome[0].toUpperCase()}${nome.slice(1)} de ${ano}`;
}

export function somaMes(mes: string, quantos: number) {
  const [ano, numero] = mes.split("-").map(Number);
  const total = ano * 12 + (numero - 1) + quantos;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function diasDoMes(mes: string) {
  const [ano, numero] = mes.split("-").map(Number);
  return new Date(Date.UTC(ano, numero, 0)).getUTCDate();
}

export const semAcento = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// ---- contas ---------------------------------------------------------------

type Efeito = { moeda: Moeda; meio: Meio; delta: number };

export function efeitos(mov: Movimento): Efeito[] {
  if (mov.tipo === "entrada" || mov.tipo === "ajuste") {
    return [{ moeda: mov.moeda, meio: mov.meio, delta: mov.valorMinor }];
  }
  if (mov.tipo === "saida") {
    return [{ moeda: mov.moeda, meio: mov.meio, delta: -mov.valorMinor }];
  }
  const para = mov.para ?? { moeda: mov.moeda, meio: mov.meio, valorMinor: mov.valorMinor };
  return [
    { moeda: mov.moeda, meio: mov.meio, delta: -mov.valorMinor },
    { moeda: para.moeda, meio: para.meio, delta: para.valorMinor },
  ];
}

export type Saldo = { moeda: Moeda; dinheiro: number; conta: number; total: number };

// Um saldo por moeda, com o que está em dinheiro e o que está na conta.
export function saldos(movimentos: Movimento[], moedas: Moeda[], ate?: string): Saldo[] {
  const map = new Map<Moeda, Saldo>(moedas.map((moeda) => [moeda, { moeda, dinheiro: 0, conta: 0, total: 0 }]));
  for (const mov of movimentos) {
    if (ate && mov.data > ate) {
      continue;
    }
    for (const efeito of efeitos(mov)) {
      const saldo = map.get(efeito.moeda) ?? { moeda: efeito.moeda, dinheiro: 0, conta: 0, total: 0 };
      saldo[efeito.meio] += efeito.delta;
      saldo.total += efeito.delta;
      map.set(efeito.moeda, saldo);
    }
  }
  return MOEDA_ORDEM.flatMap((moeda) => {
    const saldo = map.get(moeda);
    return saldo ? [saldo] : [];
  });
}

// O saldo de uma moeda só. `saldos` devolve todas as moedas que tiveram
// movimento, na ordem fixa, então a primeira nem sempre é a pedida.
export function saldoDe(movimentos: Movimento[], moeda: Moeda, ate?: string): Saldo {
  return saldos(movimentos, [moeda], ate).find((saldo) => saldo.moeda === moeda) ?? { moeda, dinheiro: 0, conta: 0, total: 0 };
}

// O saldo de uma moeda ao final de cada dia com movimento.
export function saldoPorDia(movimentos: Movimento[], moeda: Moeda) {
  const porDia = new Map<string, number>();
  for (const mov of movimentos) {
    for (const efeito of efeitos(mov)) {
      if (efeito.moeda === moeda) {
        porDia.set(mov.data, (porDia.get(mov.data) ?? 0) + efeito.delta);
      }
    }
  }
  const out = new Map<string, number>();
  let corrente = 0;
  for (const dia of [...porDia.keys()].sort()) {
    corrente += porDia.get(dia) ?? 0;
    out.set(dia, corrente);
  }
  return out;
}

// O saldo ao final de um dia qualquer: o do último dia com movimento até ele.
export function saldoNoDia(porDia: Map<string, number>, dia: string) {
  let saldo = 0;
  for (const [data, valor] of porDia) {
    if (data > dia) {
      break;
    }
    saldo = valor;
  }
  return saldo;
}

export type Resumo = { entradas: number; saidas: number; balanco: number };

// Entradas e saídas de um período numa moeda. Transferências e ajustes não
// são nem entrada nem gasto.
export function resumo(movimentos: Movimento[], moeda: Moeda, dentro: (dia: string) => boolean): Resumo {
  let entradas = 0;
  let saidas = 0;
  for (const mov of movimentos) {
    if (mov.moeda !== moeda || !dentro(mov.data)) {
      continue;
    }
    if (mov.tipo === "entrada") {
      entradas += mov.valorMinor;
    } else if (mov.tipo === "saida") {
      saidas += mov.valorMinor;
    }
  }
  return { entradas, saidas, balanco: entradas - saidas };
}

export type FatiaCategoria = { categoria: Categoria; valor: number; quantos: number };

// Total por categoria, do maior para o menor.
export function porCategoria(
  movimentos: Movimento[],
  tipo: "saida" | "entrada",
  moeda: Moeda,
  dentro: (dia: string) => boolean,
  categoriaDe: (id: string | null) => Categoria | undefined,
): FatiaCategoria[] {
  const map = new Map<string, FatiaCategoria>();
  for (const mov of movimentos) {
    if (mov.tipo !== tipo || mov.moeda !== moeda || !dentro(mov.data)) {
      continue;
    }
    const categoria = categoriaDe(mov.categoriaId) ?? categoriaDe(tipo === "saida" ? "outros" : "outras-entradas");
    if (!categoria) {
      continue;
    }
    const fatia = map.get(categoria.id) ?? { categoria, valor: 0, quantos: 0 };
    fatia.valor += mov.valorMinor;
    fatia.quantos += 1;
    map.set(categoria.id, fatia);
  }
  return [...map.values()].sort((a, b) => b.valor - a.valor);
}

export function ordenar(movimentos: Movimento[]) {
  return [...movimentos].sort((a, b) => (a.data === b.data ? b.seq - a.seq : a.data < b.data ? 1 : -1));
}

// ---- exportação -----------------------------------------------------------

const TIPO_NOME: Record<TipoMovimento, string> = {
  saida: "Gasto",
  entrada: "Entrada",
  transferencia: "Transferência",
  ajuste: "Ajuste de saldo",
};

export const ORIGEM_NOME: Record<Origem, string> = {
  manual: "Manual",
  relatorio: "Relatório de RM",
  assistente: "Assistente",
  mcp: "Agente",
};

// CSV com as colunas da planilha da equipe (Data, Categoria, Responsável,
// Dinheiro, PIX, Valor, Dólar, Observação), pronto para colar nela. Os valores
// levam sinal (o que saiu é negativo), para a soma da coluna dar o saldo.
export function csvDe(
  movimentos: Movimento[],
  categoriaDe: (id: string | null) => Categoria | undefined,
  projetoDe: (id: string) => ProjetoContabil | undefined,
) {
  // um texto que começa com =, +, - ou @ viraria fórmula ao abrir na planilha
  const texto = (text: string) => (/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);
  const celula = (text: string) => (/[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
  const linhas = [
    ["Data", "Equipe", "Tipo", "Categoria", "Responsável (Registrou)", "Dinheiro (R$)", "PIX (R$)", "Valor (R$)", "Dólar ($)", "Outra moeda", "Observação", "Origem"],
  ];
  for (const mov of [...movimentos].sort((a, b) => (a.data === b.data ? a.seq - b.seq : a.data < b.data ? -1 : 1))) {
    const seus = efeitos(mov);
    // quanto o movimento mexeu numa moeda (e num meio); vazio quando não mexeu
    const delta = (moeda: Moeda, meio?: Meio) => {
      const partes = seus.filter((efeito) => efeito.moeda === moeda && (!meio || efeito.meio === meio));
      return partes.length ? valorSimples(partes.reduce((soma, efeito) => soma + efeito.delta, 0), moeda) : "";
    };
    const outras = MOEDA_ORDEM.filter((moeda) => moeda !== "BRL" && moeda !== "USD")
      // a moeda na frente: "-18000 KRW" começaria com um sinal e viraria fórmula
      .flatMap((moeda) => (delta(moeda) ? [`${moeda} ${delta(moeda)}`] : []))
      .join(" / ");
    const destino = mov.para ? ` → ${fmtMoeda(mov.para.valorMinor, mov.para.moeda)} (${MEIO_NOME[mov.para.meio].toLowerCase()})` : "";
    linhas.push([
      `${mov.data.slice(8, 10)}/${mov.data.slice(5, 7)}/${mov.data.slice(0, 4)}`,
      texto(projetoDe(mov.projetoId)?.nome ?? ""),
      TIPO_NOME[mov.tipo],
      texto(categoriaDe(mov.categoriaId)?.nome ?? ""),
      texto(mov.responsavel),
      delta("BRL", "dinheiro"),
      delta("BRL", "conta"),
      delta("BRL"),
      delta("USD"),
      outras,
      texto(`${mov.descricao}${destino}${mov.pendente ? " (a conferir)" : ""}`),
      ORIGEM_NOME[mov.origem],
    ]);
  }
  return `﻿${linhas.map((linha) => linha.map(celula).join(";")).join("\r\n")}\r\n`;
}
