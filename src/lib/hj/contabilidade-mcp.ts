import { Types } from "mongoose";

import type { PanelContext } from "@/lib/hj/data";
import { isIsoDay } from "@/lib/hj/dates";
import { HjContabMovimento } from "@/models/hj-contab-movimento";

import {
  fmtMoeda,
  MOEDA_ORDEM,
  MOEDAS,
  ordenar,
  parseValor,
  porCategoria,
  resumo,
  saldos,
  semAcento,
  type Categoria,
  type Moeda,
  type Movimento,
  type ProjetoContabil,
} from "./contabilidade";
import {
  criarMovimento,
  guardarComprovante,
  lerConfig,
  livrosPermitidos,
  moedasDoLivro,
  movimentosDosLivros,
  validarMovimento,
} from "./contabilidade-server";

// The tools an agent (Claude, ChatGPT…) gets through the Contabilidade's MCP
// connector. Same books, same checks as the screens: everything goes through
// contabilidade-server.ts. The agent reads and adds; it never deletes, and it
// never changes what came from an RM report (Victor, 25/11/2026: the
// connector is for educators and up).

export const MCP_INSTRUCOES = [
  "Contabilidade do Time HJ (Pure Water Wave): os livros de cada equipe do projeto de RM e o livro geral.",
  "Cada moeda tem o seu saldo; nunca converta nem some moedas diferentes. Valores em unidades da moeda (12.5 = doze e cinquenta).",
  "Comece com listar_contabilidades (ids dos livros, moedas e saldos) e listar_categorias.",
  "lancar_movimentos lança um ou vários movimentos; confirme com a pessoa valor, categoria, livro e data antes de lançar. Nunca invente um valor.",
  "O que vem de um relatório de RM validado já está nos livros: não o lance de novo.",
  "Não há como apagar pelo agente: para corrigir, a pessoa usa o painel.",
].join("\n");

type Ferramenta = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  escreve?: boolean;
};

const livroProp = { type: "string", description: "id do livro (de listar_contabilidades). Sem ele, todos os livros que você vê." };

export const FERRAMENTAS: Ferramenta[] = [
  {
    name: "listar_contabilidades",
    description: "Os livros que você vê (equipes e o geral), com as moedas e os saldos de cada um.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "listar_categorias",
    description: "As categorias de gasto e de entrada (id e nome).",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "consultar_saldos",
    description: "O saldo de cada moeda, separado em dinheiro e Pix / conta. Opcionalmente até um dia.",
    inputSchema: { type: "object", properties: { livroId: livroProp, ate: { type: "string", description: "AAAA-MM-DD" } } },
    annotations: { readOnlyHint: true },
  },
  {
    name: "listar_movimentos",
    description: "Movimentos do mais novo para o mais antigo, com filtros.",
    inputSchema: {
      type: "object",
      properties: {
        livroId: livroProp,
        de: { type: "string", description: "AAAA-MM-DD" },
        ate: { type: "string", description: "AAAA-MM-DD" },
        tipo: { type: "string", enum: ["saida", "entrada", "transferencia", "ajuste"] },
        categoriaId: { type: "string" },
        texto: { type: "string", description: "procura na descrição e no responsável" },
        limite: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "resumo_por_categoria",
    description: "Total de gastos (ou de entradas) por categoria num mês ou num ano, numa moeda.",
    inputSchema: {
      type: "object",
      properties: {
        livroId: livroProp,
        periodo: { type: "string", description: "AAAA-MM (um mês) ou AAAA (um ano)" },
        tipo: { type: "string", enum: ["saida", "entrada"], default: "saida" },
        moeda: { type: "string", enum: Object.keys(MOEDAS), default: "BRL" },
      },
      required: ["periodo"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "lancar_movimentos",
    description:
      "Lança até 30 movimentos (gasto, entrada ou transferência) em nome da pessoa. Ficam marcados como “Agente”. Confirme com a pessoa antes.",
    inputSchema: {
      type: "object",
      properties: {
        movimentos: {
          type: "array",
          minItems: 1,
          maxItems: 30,
          items: {
            type: "object",
            properties: {
              livroId: { type: "string" },
              tipo: { type: "string", enum: ["saida", "entrada", "transferencia"] },
              valor: { type: "number", description: "em unidades da moeda; numa transferência, o que sai" },
              moeda: { type: "string", enum: Object.keys(MOEDAS), default: "BRL" },
              meio: { type: "string", enum: ["dinheiro", "conta"], description: "dinheiro em espécie, ou Pix / conta" },
              categoriaId: { type: "string", description: "obrigatória em gasto e entrada (listar_categorias)" },
              data: { type: "string", description: "AAAA-MM-DD; sem ela, hoje" },
              descricao: { type: "string" },
              responsavel: { type: "string", description: "quem pagou ou recebeu; sem ele, você" },
              pendente: { type: "boolean", description: "marcar para conferir depois" },
              para: {
                type: "object",
                description: "só transferência: para onde foi",
                properties: { moeda: { type: "string", enum: Object.keys(MOEDAS) }, meio: { type: "string", enum: ["dinheiro", "conta"] }, valor: { type: "number", description: "quanto chegou, se for outra moeda" } },
                required: ["meio"],
              },
            },
            required: ["livroId", "tipo", "valor", "meio"],
          },
        },
      },
      required: ["movimentos"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    escreve: true,
  },
  {
    name: "anexar_comprovante",
    description: "Anexa a foto (JPEG, PNG, WebP) ou o PDF de um comprovante, em base64, a um movimento lançado à mão, pelo assistente ou por um agente.",
    inputSchema: {
      type: "object",
      properties: {
        movimentoId: { type: "string" },
        base64: { type: "string" },
        nome: { type: "string" },
      },
      required: ["movimentoId", "base64"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    escreve: true,
  },
];

export class ErroFerramenta extends Error {}

type Ambiente = { context: PanelContext; escopos: string[] };

const valorEmMinor = (valor: unknown, moeda: Moeda) =>
  typeof valor === "number" && valor > 0 ? parseValor(valor.toFixed(MOEDAS[moeda].decimais).replace(".", ","), moeda) : null;

const moedaDe = (raw: unknown): Moeda => (typeof raw === "string" && Object.hasOwn(MOEDAS, raw) ? (raw as Moeda) : "BRL");

const valorMaior = (minor: number, moeda: Moeda) => minor / 10 ** MOEDAS[moeda].decimais;

function linhaMov(mov: Movimento, livros: ProjetoContabil[], categoria: (id: string | null) => Categoria | undefined) {
  return {
    id: mov.id,
    livro: livros.find((livro) => livro.id === mov.projetoId)?.nome ?? mov.projetoId,
    livroId: mov.projetoId,
    data: mov.data,
    tipo: mov.tipo,
    valor: valorMaior(mov.valorMinor, mov.moeda),
    moeda: mov.moeda,
    texto: fmtMoeda(mov.valorMinor, mov.moeda),
    meio: mov.meio,
    categoria: categoria(mov.categoriaId)?.nome ?? null,
    descricao: mov.descricao,
    responsavel: mov.responsavel,
    origem: mov.origem,
    pendente: mov.pendente,
    comprovante: Boolean(mov.comprovante),
    ...(mov.para ? { para: { moeda: mov.para.moeda, meio: mov.para.meio, valor: valorMaior(mov.para.valorMinor, mov.para.moeda) } } : {}),
  };
}

export async function chamarFerramenta(nome: string, args: Record<string, unknown>, { context, escopos }: Ambiente): Promise<unknown> {
  const ferramenta = FERRAMENTAS.find((item) => item.name === nome);
  if (!ferramenta) {
    throw new ErroFerramenta(`Ferramenta desconhecida: ${nome}`);
  }
  if (ferramenta.escreve && !escopos.includes("write")) {
    throw new ErroFerramenta("Este agente foi conectado só para leitura.");
  }
  const livros = await livrosPermitidos(context);
  if (!livros.length) {
    throw new ErroFerramenta("Você não vê nenhuma contabilidade.");
  }
  const config = await lerConfig();
  const categoria = (id: string | null) => (id ? config.categorias.find((item) => item.id === id) : undefined);
  const escolher = (raw: unknown) => {
    if (raw === undefined || raw === null || raw === "") {
      return livros.map((livro) => livro.id);
    }
    const livro = livros.find((item) => item.id === raw);
    if (!livro) {
      throw new ErroFerramenta("Livro não encontrado entre os que você vê. Use listar_contabilidades.");
    }
    return [livro.id];
  };

  switch (nome) {
    case "listar_contabilidades": {
      const movimentos = await movimentosDosLivros(livros.map((livro) => livro.id));
      return {
        hoje: context.hoje,
        livros: livros.map((livro) => {
          const meus = movimentos.filter((mov) => mov.projetoId === livro.id);
          const moedas = moedasDoLivro(livro.id, meus, config.moedas);
          return {
            id: livro.id,
            nome: livro.nome,
            tipo: livro.tipo,
            programa: livro.programa,
            capitao: livro.capitao,
            educador: livro.educador,
            moedas,
            saldos: saldos(meus, moedas).map((saldo) => ({
              moeda: saldo.moeda,
              total: valorMaior(saldo.total, saldo.moeda),
              dinheiro: valorMaior(saldo.dinheiro, saldo.moeda),
              conta: valorMaior(saldo.conta, saldo.moeda),
              texto: fmtMoeda(saldo.total, saldo.moeda),
            })),
          };
        }),
      };
    }
    case "listar_categorias":
      return {
        gastos: config.categorias.filter((item) => item.tipo === "saida").map(({ id, nome: n }) => ({ id, nome: n })),
        entradas: config.categorias.filter((item) => item.tipo === "entrada").map(({ id, nome: n }) => ({ id, nome: n })),
      };
    case "consultar_saldos": {
      const ids = escolher(args.livroId);
      const ate = typeof args.ate === "string" && isIsoDay(args.ate) ? args.ate : undefined;
      const movimentos = await movimentosDosLivros(ids);
      const moedas = MOEDA_ORDEM.filter((moeda) => ids.some((id) => moedasDoLivro(id, movimentos, config.moedas).includes(moeda)));
      return {
        livros: ids.map((id) => livros.find((livro) => livro.id === id)?.nome),
        ate: ate ?? context.hoje,
        saldos: saldos(movimentos, moedas, ate).map((saldo) => ({
          moeda: saldo.moeda,
          total: valorMaior(saldo.total, saldo.moeda),
          dinheiro: valorMaior(saldo.dinheiro, saldo.moeda),
          conta: valorMaior(saldo.conta, saldo.moeda),
          texto: fmtMoeda(saldo.total, saldo.moeda),
        })),
      };
    }
    case "listar_movimentos": {
      const ids = escolher(args.livroId);
      const texto = typeof args.texto === "string" ? semAcento(args.texto) : "";
      const limite = typeof args.limite === "number" ? Math.min(200, Math.max(1, Math.round(args.limite))) : 50;
      const todos = ordenar(await movimentosDosLivros(ids)).filter(
        (mov) =>
          (typeof args.de !== "string" || mov.data >= args.de) &&
          (typeof args.ate !== "string" || mov.data <= args.ate) &&
          (typeof args.tipo !== "string" || mov.tipo === args.tipo) &&
          (typeof args.categoriaId !== "string" || mov.categoriaId === args.categoriaId) &&
          (!texto || semAcento(`${mov.descricao} ${mov.responsavel}`).includes(texto)),
      );
      return { total: todos.length, movimentos: todos.slice(0, limite).map((mov) => linhaMov(mov, livros, categoria)) };
    }
    case "resumo_por_categoria": {
      const ids = escolher(args.livroId);
      const periodo = typeof args.periodo === "string" ? args.periodo : "";
      if (!/^\d{4}(-\d{2})?$/.test(periodo)) {
        throw new ErroFerramenta("periodo deve ser AAAA-MM ou AAAA");
      }
      const tipo = args.tipo === "entrada" ? "entrada" : "saida";
      const moeda = moedaDe(args.moeda);
      const dentro = (dia: string) => dia.startsWith(periodo);
      const movimentos = await movimentosDosLivros(ids);
      const total = resumo(movimentos, moeda, dentro);
      return {
        periodo,
        moeda,
        entradas: valorMaior(total.entradas, moeda),
        gastos: valorMaior(total.saidas, moeda),
        balanco: valorMaior(total.balanco, moeda),
        porCategoria: porCategoria(movimentos, tipo, moeda, dentro, categoria).map((fatia) => ({
          categoria: fatia.categoria.nome,
          categoriaId: fatia.categoria.id,
          valor: valorMaior(fatia.valor, moeda),
          texto: fmtMoeda(fatia.valor, moeda),
          movimentos: fatia.quantos,
        })),
      };
    }
    case "lancar_movimentos": {
      const lista = Array.isArray(args.movimentos) ? (args.movimentos as Record<string, unknown>[]).slice(0, 30) : [];
      if (!lista.length) {
        throw new ErroFerramenta("Mande pelo menos um movimento.");
      }
      // tudo conferido antes de gravar: ou entram todos, ou nenhum
      const validados = [];
      for (const [index, raw] of lista.entries()) {
        const moeda = moedaDe(raw.moeda);
        const valorMinor = valorEmMinor(raw.valor, moeda);
        if (!valorMinor) {
          throw new ErroFerramenta(`Movimento ${index + 1}: valor inválido.`);
        }
        const paraRaw = raw.para && typeof raw.para === "object" ? (raw.para as Record<string, unknown>) : null;
        const paraMoeda = paraRaw ? moedaDe(paraRaw.moeda ?? moeda) : moeda;
        const para = paraRaw
          ? { moeda: paraMoeda, meio: paraRaw.meio as "dinheiro" | "conta", valorMinor: paraMoeda === moeda ? valorMinor : (valorEmMinor(paraRaw.valor, paraMoeda) ?? 0) }
          : undefined;
        const validado = await validarMovimento(
          {
            projetoId: typeof raw.livroId === "string" ? raw.livroId : "",
            tipo: raw.tipo as Movimento["tipo"],
            valorMinor,
            moeda,
            meio: raw.meio as "dinheiro" | "conta",
            categoriaId: typeof raw.categoriaId === "string" ? raw.categoriaId : null,
            data: typeof raw.data === "string" ? raw.data : context.hoje,
            descricao: typeof raw.descricao === "string" ? raw.descricao : "",
            responsavel: typeof raw.responsavel === "string" ? raw.responsavel : "",
            pendente: raw.pendente === true,
            ...(para ? { para } : {}),
          },
          { livros, categorias: config.categorias, hoje: context.hoje, responsavelPadrao: context.user.fullName },
        );
        if (!validado.ok) {
          throw new ErroFerramenta(`Movimento ${index + 1}: ${validado.error}.`);
        }
        if (validado.value.tipo === "ajuste") {
          throw new ErroFerramenta(`Movimento ${index + 1}: o agente não faz ajuste de saldo.`);
        }
        validados.push(validado.value);
      }
      const criados = [];
      for (const value of validados) {
        criados.push(await criarMovimento(value, "mcp", context.user._id));
      }
      return { lancados: criados.length, movimentos: criados.map((mov) => linhaMov(mov, livros, categoria)) };
    }
    case "anexar_comprovante": {
      const id = typeof args.movimentoId === "string" ? args.movimentoId : "";
      if (!Types.ObjectId.isValid(id)) {
        throw new ErroFerramenta("movimentoId inválido (o que veio de um relatório de RM não leva comprovante).");
      }
      const doc = await HjContabMovimento.findById(id).lean();
      if (!doc || doc.removidoEm || !livros.some((livro) => livro.id === doc.livroId)) {
        throw new ErroFerramenta("Movimento não encontrado.");
      }
      const base64 = typeof args.base64 === "string" ? args.base64.replace(/^data:[^;]+;base64,/, "") : "";
      const salvo = await guardarComprovante({
        livroId: doc.livroId,
        nome: typeof args.nome === "string" ? args.nome : "comprovante",
        bytes: Buffer.from(base64, "base64"),
        autorId: context.user._id,
      });
      if ("ok" in salvo) {
        throw new ErroFerramenta(salvo.error);
      }
      await HjContabMovimento.updateOne({ _id: doc._id }, { $set: { comprovanteId: new Types.ObjectId(salvo.id) } });
      return { ok: true, comprovante: salvo.nome };
    }
    default:
      throw new ErroFerramenta(`Ferramenta desconhecida: ${nome}`);
  }
}
