import { daysApart } from "@/lib/hj/dates";
import {
  CONFERENCIAS_SISTEMA1,
  type ConvidadoAlerta,
  type ConvidadoDatas,
  type ConvidadoEtapa,
} from "@/lib/hj/types";

// The guest journey's rules (docs/painel/P4-testemunho.md): what needs
// attention and what the natural next step is. Everything here is a plain
// function of the guest's milestones so the screens and the tests agree.

export const ETAPA_LABELS: Record<ConvidadoEtapa, string> = {
  pre_gateway: "Pré-Gateway",
  gateway: "Gateway",
  sistema1: "Sistema 1",
  sistema2: "Sistema 2",
  jardim: "Jardim",
};

export const ETAPA_ORDEM: ConvidadoEtapa[] = ["pre_gateway", "gateway", "sistema1", "sistema2", "jardim"];

export const DIAS_SEM_CONTATO = 7;
export const DIAS_GATEWAY_PARADO = 14;
export const DIAS_SISTEMA1_PARADO = 21;

type Jornada = {
  etapa: ConvidadoEtapa;
  conferencias: number;
  ultimoContato: string | null;
  datas: ConvidadoDatas;
};

export function alertaDe(guest: Jornada, hoje: string): ConvidadoAlerta | null {
  if (guest.etapa === "jardim") {
    return null;
  }

  // Three weeks of silence in Sistema 1 is its own alert; a week anywhere
  // is "sem contato".
  if (guest.etapa === "sistema1" && guest.ultimoContato && daysApart(guest.ultimoContato, hoje) >= DIAS_SISTEMA1_PARADO) {
    return { tipo: "sistema1_parado", texto: `Sistema 1 parado há ${daysApart(guest.ultimoContato, hoje)} dias` };
  }

  if (guest.ultimoContato && daysApart(guest.ultimoContato, hoje) >= DIAS_SEM_CONTATO) {
    const dias = daysApart(guest.ultimoContato, hoje);
    return { tipo: "sem_contato", texto: `sem contato há ${dias} dias` };
  }

  if (guest.etapa === "gateway") {
    if (!guest.datas.fichaAssinada) {
      return { tipo: "ficha_pendente", texto: "ficha pendente" };
    }
    if (guest.datas.gateway && daysApart(guest.datas.gateway, hoje) >= DIAS_GATEWAY_PARADO) {
      return {
        tipo: "gateway_parado",
        texto: `Gateway há ${daysApart(guest.datas.gateway, hoje)} dias`,
      };
    }
  }

  return null;
}

export function sugestoesPara(guest: Jornada): string[] {
  const out: string[] = [];
  switch (guest.etapa) {
    case "pre_gateway":
      out.push("Combinar a data do Gateway");
      if (!guest.ultimoContato) {
        out.push("Registrar o primeiro contato");
      }
      break;
    case "gateway":
      if (!guest.datas.fichaAssinada) {
        out.push("Assinar a ficha de inscrição");
      }
      out.push("Convidar para a primeira conferência do Sistema 1");
      break;
    case "sistema1": {
      const faltam = Math.max(0, CONFERENCIAS_SISTEMA1 - guest.conferencias);
      if (faltam > 0) {
        out.push(`Próxima conferência (${guest.conferencias + 1} de ${CONFERENCIAS_SISTEMA1})`);
      } else {
        out.push("Concluir o Sistema 1 e combinar o Sistema 2");
      }
      break;
    }
    case "sistema2":
      out.push("Acompanhar o Sistema 2 até o Jardim");
      break;
    case "jardim":
      break;
  }
  return out;
}

export function proximaEtapa(etapa: ConvidadoEtapa): ConvidadoEtapa | null {
  const index = ETAPA_ORDEM.indexOf(etapa);
  return index >= 0 && index < ETAPA_ORDEM.length - 1 ? ETAPA_ORDEM[index + 1] : null;
}

// ---------- the four indicators Rev. Kim asks for ----------
//
// Yeseong (14/11/2026): a team is read by four numbers — Kit 1 (studying
// Sistema 1), fichas assinadas, Kit 2 (Sistema 2) and confirmed for Jardim.
// They are cumulative: a guest in Jardim counts in all four. When the four
// are close the work is healthy; a big drop between two neighbours is a
// "ponto de atenção" the educator should look into.

export type Indicadores = { kit1: number; fichas: number; kit2: number; jardim: number };

type Marcos = { etapa: ConvidadoEtapa; datas: ConvidadoDatas };

export function indicadoresDe(guests: Marcos[]): Indicadores {
  const out: Indicadores = { kit1: 0, fichas: 0, kit2: 0, jardim: 0 };
  for (const guest of guests) {
    const index = ETAPA_ORDEM.indexOf(guest.etapa);
    if (index >= ETAPA_ORDEM.indexOf("sistema1")) out.kit1 += 1;
    if (guest.datas.fichaAssinada) out.fichas += 1;
    if (index >= ETAPA_ORDEM.indexOf("sistema2")) out.kit2 += 1;
    if (guest.etapa === "jardim") out.jardim += 1;
  }
  return out;
}

export function somaIndicadores(into: Indicadores, from: Indicadores) {
  into.kit1 += from.kit1;
  into.fichas += from.fichas;
  into.kit2 += from.kit2;
  into.jardim += from.jardim;
}

// A step is worth checking from this many guests; below it the numbers
// are too small to mean anything.
export const ATENCAO_MINIMO = 3;
// …and worth flagging when the next indicator keeps less than this share.
export const ATENCAO_RAZAO = 0.3;

export type PontoDeAtencao = { de: keyof Indicadores; para: keyof Indicadores; texto: string };

const INDICADOR_LABEL: Record<keyof Indicadores, string> = { kit1: "Kit 1", fichas: "fichas assinadas", kit2: "Kit 2", jardim: "confirmados para o Jardim" };

export function pontoDeAtencao(ind: Indicadores): PontoDeAtencao | null {
  const passos: [keyof Indicadores, keyof Indicadores][] = [
    ["kit1", "fichas"],
    ["fichas", "kit2"],
    ["kit2", "jardim"],
  ];
  for (const [de, para] of passos) {
    if (ind[de] >= ATENCAO_MINIMO && ind[para] < ind[de] * ATENCAO_RAZAO) {
      return { de, para, texto: `${ind[de]} em ${INDICADOR_LABEL[de]}, ${ind[para]} ${ind[para] === 1 ? "em" : "em"} ${INDICADOR_LABEL[para]}` };
    }
  }
  return null;
}
