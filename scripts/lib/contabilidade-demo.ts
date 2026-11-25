// Dados de demonstração da Contabilidade, gravados no banco por
// scripts/seed-contabilidade.ts: o que a capitã e a educadora lançam à mão
// desde junho. A arrecadação da RM não está aqui: entra sozinha pelos
// relatórios validados.

import { addDays } from "@/lib/hj/dates";

import { diasDoMes, MESES, type Meio, type Moeda, type Movimento, type ProjetoContabil } from "@/lib/hj/contabilidade";

export const INICIO_DEMO = "2026-06-01";

function semente(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A diária da estadia no protótipo. A taxa de verdade fica na equipe, mas o
// capitão não a recebe, e os dois lados têm de ver os mesmos livros.
const TAXA_ESTADIA = 3300;

type Rascunho = Partial<Movimento> & Pick<Movimento, "tipo" | "valorMinor" | "data" | "descricao">;

// `rmDesde`: o primeiro dia do projeto de RM no painel; antes dele a capitã
// lançava a arrecadação da semana à mão, depois ela vem dos relatórios.
export function gerarMovimentos(projeto: ProjetoContabil, hoje: string, rmDesde = hoje): Movimento[] {
  const rand = mulberry(semente(projeto.id));
  const entre = (min: number, max: number) => Math.round(min + rand() * (max - min));
  const um = <T,>(lista: T[]) => lista[Math.floor(rand() * lista.length)];
  const out: Movimento[] = [];
  const caixa: Record<Meio, number> = { dinheiro: 0, conta: 0 };
  const lider = projeto.capitao ?? projeto.educador ?? "Equipe";
  // em ordem própria: cada lado do painel recebe os membros numa ordem
  const pessoas = projeto.membros.length ? [...projeto.membros].sort((a, b) => a.localeCompare(b, "pt-BR")) : [lider];

  const lancar = (mov: Rascunho) => {
    const moeda: Moeda = mov.moeda ?? "BRL";
    let meio: Meio = mov.meio ?? "dinheiro";
    // um gasto sai de onde há saldo
    if (moeda === "BRL" && mov.tipo === "saida" && caixa[meio] < mov.valorMinor) {
      const outro: Meio = meio === "dinheiro" ? "conta" : "dinheiro";
      if (caixa[outro] >= mov.valorMinor) {
        meio = outro;
      }
    }
    if (moeda === "BRL") {
      if (mov.tipo === "transferencia") {
        caixa[meio] -= mov.valorMinor;
        if (mov.para?.moeda === "BRL") {
          caixa[mov.para.meio] += mov.para.valorMinor;
        }
      } else {
        caixa[meio] += mov.tipo === "saida" ? -mov.valorMinor : mov.valorMinor;
      }
    } else if (mov.tipo === "transferencia" && mov.para?.moeda === "BRL") {
      caixa[mov.para.meio] += mov.para.valorMinor;
    }
    out.push({
      id: `${projeto.id}:${out.length + 1}`,
      projetoId: projeto.id,
      moeda,
      categoriaId: null,
      responsavel: lider,
      origem: "manual",
      pendente: false,
      comprovante: null,
      ...mov,
      meio,
      seq: out.length + 1,
    });
  };

  const manual = (mov: Rascunho) => {
    // os dois sorteios saem sempre, para o dia de hoje não mudar os seguintes
    const aConferir = rand() < 0.2;
    lancar({ ...mov, pendente: aConferir && mov.data >= addDays(hoje, -9) });
  };

  if (hoje < INICIO_DEMO) {
    return out;
  }

  if (projeto.tipo === "geral") {
    lancar({ tipo: "ajuste", valorMinor: 1850000, meio: "conta", data: INICIO_DEMO, descricao: "Saldo inicial" });
    lancar({ tipo: "ajuste", valorMinor: 120000, moeda: "USD", data: INICIO_DEMO, descricao: "Saldo inicial" });
    lancar({ tipo: "ajuste", valorMinor: 30000, moeda: "EUR", data: INICIO_DEMO, descricao: "Saldo inicial" });
    lancar({ tipo: "ajuste", valorMinor: 450000, moeda: "KRW", data: INICIO_DEMO, descricao: "Saldo inicial" });
    for (let dia = INICIO_DEMO; dia <= hoje; dia = addDays(dia, 1)) {
      const numero = Number(dia.slice(8, 10));
      const mes = Number(dia.slice(5, 7));
      if (numero === 4 || numero === 19) {
        manual({ tipo: "entrada", valorMinor: entre(18, 60) * 10000, meio: "conta", categoriaId: "doacao", data: dia, descricao: um(["Oferta das famílias", "Doação para o Time HJ", "Oferta especial"]) });
      }
      if (numero === 8) {
        manual({ tipo: "saida", valorMinor: entre(9, 28) * 10000, meio: "conta", categoriaId: "transporte", data: dia, descricao: um(["Passagens — encontro nacional", "Ônibus fretado — workshop", "Passagens dos educadores"]) });
      }
      if (numero === 15) {
        manual({ tipo: "saida", valorMinor: entre(6, 15) * 10000, meio: "conta", categoriaId: "ajuda", data: dia, descricao: "Apoio aos educadores" });
      }
      if (numero === 22) {
        manual({ tipo: "saida", valorMinor: entre(7, 22) * 10000, meio: "conta", categoriaId: "estadia", data: dia, descricao: um(["Hospedagem — workshop", "Aluguel do centro de treinamento"]) });
        manual({ tipo: "saida", valorMinor: entre(4, 12) * 10000, meio: "conta", categoriaId: "alimentacao", data: dia, descricao: "Refeições do workshop" });
      }
      if (numero === 26 && mes % 2 === 0) {
        manual({ tipo: "saida", valorMinor: entre(5, 18) * 10000, meio: "conta", categoriaId: "material", data: dia, descricao: "Material de RM para as equipes" });
      }
      if (numero === 12 && mes % 2 === 1) {
        manual({ tipo: "entrada", valorMinor: entre(2, 8) * 10000, moeda: "USD", categoriaId: "doacao", data: dia, descricao: "Doação do exterior" });
      }
      if (numero === 14 && mes % 3 === 0) {
        manual({ tipo: "entrada", valorMinor: entre(2, 6) * 100000, moeda: "KRW", categoriaId: "doacao", data: dia, descricao: "Oferta da Coreia" });
      }
      if (numero === 20 && mes === 8) {
        manual({ tipo: "entrada", valorMinor: 25000, moeda: "EUR", categoriaId: "doacao", data: dia, descricao: "Doação da Europa" });
      }
      if (numero === 18 && mes % 2 === 0) {
        const dolares = entre(2, 5) * 10000;
        lancar({
          tipo: "transferencia",
          valorMinor: dolares,
          moeda: "USD",
          data: dia,
          descricao: "Câmbio de dólar",
          para: { moeda: "BRL", meio: "conta", valorMinor: Math.round(dolares * (5.3 + rand() * 0.3)) },
        });
      }
    }
    return out;
  }

  lancar({ tipo: "ajuste", valorMinor: entre(20, 60) * 10000, meio: "conta", data: INICIO_DEMO, descricao: "Saldo inicial" });
  lancar({ tipo: "ajuste", valorMinor: entre(3, 9) * 10000, meio: "dinheiro", data: INICIO_DEMO, descricao: "Saldo inicial" });
  const comDolar = rand() < 0.6;

  for (let dia = INICIO_DEMO; dia <= hoje; dia = addDays(dia, 1)) {
    const numero = Number(dia.slice(8, 10));
    const mes = Number(dia.slice(5, 7));
    const semana = new Date(`${dia}T12:00:00Z`).getUTCDay();
    const chance = semana === 0 ? 0 : semana === 1 ? 0.12 : 0.7;

    // o que os membros gastam de bolso e a capitã reembolsa
    for (const membro of pessoas) {
      if (rand() < chance * 0.1) {
        lancar({ tipo: "saida", valorMinor: entre(8, 32) * 100, categoriaId: "transporte", data: dia, descricao: um(["Ônibus", "Metrô", "Uber até o ponto"]), responsavel: membro });
      }
    }

    // o que a capitã lança à mão
    if (numero === 3 || numero === 17) {
      manual({ tipo: "saida", valorMinor: entre(6, 18) * 10000, meio: "conta", categoriaId: "material", data: dia, descricao: um(["Material de RM (lote)", "Reposição de material", "Material de RM — 200 unidades"]) });
    }
    if (numero === 10) {
      for (const membro of pessoas) {
        manual({ tipo: "saida", valorMinor: entre(10, 20) * 1000, meio: "conta", categoriaId: "ajuda", data: dia, descricao: `Ajuda de custo — ${membro.split(" ")[0]}` });
      }
    }
    if (numero === 12) {
      manual({ tipo: "saida", valorMinor: entre(30, 90) * 1000, meio: "conta", categoriaId: "cartao", data: dia, descricao: "Fatura do cartão" });
    }
    if (numero === Math.min(28, diasDoMes(dia.slice(0, 7)))) {
      const diarias = pessoas.length * entre(18, 24);
      manual({ tipo: "saida", valorMinor: diarias * TAXA_ESTADIA, meio: "conta", categoriaId: "estadia", data: dia, descricao: `Estadia de ${MESES[mes - 1]} · ${diarias} diárias` });
    }
    if (rand() < 0.12) {
      manual({ tipo: "saida", valorMinor: entre(20, 120) * 100, categoriaId: "cuidados", data: dia, descricao: um(["Farmácia", "Itens de higiene", "Corte de cabelo", "Consulta médica", "Remédio"]), responsavel: um(pessoas) });
    }
    if (rand() < 0.05) {
      manual({ tipo: "saida", valorMinor: entre(8, 60) * 100, categoriaId: "outros", data: dia, descricao: um(["Estacionamento", "Xerox", "Presente de aniversário", "Lavanderia"]) });
    }
    if (rand() < 0.012) {
      const quem = um(pessoas).split(" ")[0];
      manual({ tipo: "saida", valorMinor: entre(10, 40) * 1000, categoriaId: "emprestimo", data: dia, descricao: `Empréstimo a ${quem}` });
    }
    if (rand() < 0.01) {
      manual({ tipo: "entrada", valorMinor: entre(10, 30) * 1000, categoriaId: "emprestimo-recebido", data: dia, descricao: "Devolução de empréstimo" });
    }
    if (rand() < 0.02) {
      manual({ tipo: "entrada", valorMinor: entre(5, 50) * 1000, meio: "conta", categoriaId: "doacao", data: dia, descricao: um(["Doação de uma família", "Oferta de apoio à equipe"]) });
    }
    if (comDolar && numero === 21 && mes % 2 === 1) {
      manual({ tipo: "entrada", valorMinor: entre(5, 30) * 1000, moeda: "USD", categoriaId: "doacao", data: dia, descricao: "Doação em dólar" });
    }

    if (semana === 6 && dia < rmDesde) {
      lancar({
        tipo: "entrada",
        valorMinor: pessoas.length * entre(250, 400) * 100,
        meio: "dinheiro",
        categoriaId: "rm",
        data: dia,
        descricao: "Arrecadação da RM da semana",
      });
    }

    // o dinheiro juntado vai para a conta
    if (semana === 6 && caixa.dinheiro > 150000) {
      const valor = Math.floor((caixa.dinheiro - entre(30, 60) * 1000) / 5000) * 5000;
      if (valor > 0) {
        lancar({ tipo: "transferencia", valorMinor: valor, meio: "dinheiro", data: dia, descricao: "Depósito do dinheiro na conta", para: { moeda: "BRL", meio: "conta", valorMinor: valor } });
      }
    }
  }
  return out;
}
