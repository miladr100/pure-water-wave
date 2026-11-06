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

  if (guest.etapa === "sistema1" && guest.ultimoContato) {
    const parado = daysApart(guest.ultimoContato, hoje);
    if (parado >= DIAS_SISTEMA1_PARADO) {
      return { tipo: "sistema1_parado", texto: `Sistema 1 parado há ${parado} dias` };
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
