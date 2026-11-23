// O assistente da Contabilidade entende frases como "gastei 18 de ônibus e 32
// no almoço" e devolve propostas de movimento para a pessoa confirmar. No
// protótipo a leitura é feita por regras; em produção quem lê é o modelo, com
// as mesmas propostas de saída.

import { addDays, isIsoDay } from "@/lib/hj/dates";

import { parseValor, semAcento, type Categoria, type Meio, type Moeda } from "./contabilidade";

export type Proposta = {
  tipo: "saida" | "entrada";
  valorMinor: number;
  moeda: Moeda;
  meio: Meio;
  categoriaId: string;
  data: string;
  descricao: string;
  // o assistente não teve certeza da categoria, do valor ou do dia: a pessoa
  // confere antes de salvar
  revisar: boolean;
};

const PALAVRAS: [string, string[]][] = [
  ["transporte", ["onibus", "uber", "99", "metro", "passagem", "passagens", "gasolina", "combustivel", "taxi", "transporte", "pedagio", "estacionamento", "trem", "van", "bilhete"]],
  ["alimentacao", ["almoco", "janta", "jantar", "cafe", "lanche", "mercado", "supermercado", "comida", "restaurante", "padaria", "alimentacao", "marmita", "agua", "refeicao", "pizza"]],
  ["material", ["material", "mercadoria", "lote", "produto", "produtos"]],
  ["ajuda", ["ajuda"]],
  ["cartao", ["cartao", "fatura"]],
  ["emprestimo", ["emprestimo", "emprestimos", "emprestei", "emprestamos", "emprestado", "emprestados", "emprestou", "emprestaram"]],
  ["cuidados", ["farmacia", "remedio", "medico", "dentista", "cabelo", "higiene", "sabonete", "shampoo", "consulta", "cuidados"]],
  ["estadia", ["estadia", "hospedagem", "aluguel", "hotel", "pousada", "diaria", "diarias"]],
];

const PALAVRAS_ENTRADA: [string, string[]][] = [
  ["rm", ["rm", "arrecadacao", "arrecadamos", "arrecadei", "restauracao"]],
  ["doacao", ["doacao", "doacoes", "oferta", "ofertas", "doou", "doaram"]],
  ["emprestimo-recebido", ["devolveu", "devolucao", "devolveram", "emprestimo", "emprestimos", "emprestado", "emprestados", "emprestou", "emprestaram"]],
];
// "devolução de 50 do uber", "recebi 30 do almoço": a entrada que fala de um
// gasto fica para conferir (os produtos da RM não: são o que se vende)
const DE_GASTO = PALAVRAS.filter(([id]) => id !== "material" && id !== "emprestimo").flatMap(([, palavras]) => palavras);

type Sentido = "saida" | "entrada";

const VERBOS: [Sentido, string[]][] = [
  ["saida", ["gastei", "gastamos", "paguei", "pagamos", "comprei", "compramos", "dei", "demos", "doei", "doamos", "ofertei", "ofertamos", "transferi", "transferimos", "enviei", "enviamos", "mandei", "mandamos", "emprestei", "emprestamos", "devolvi", "devolvemos", "reembolsei", "reembolsamos", "estornei", "estornamos"]],
  ["entrada", ["recebi", "recebemos", "entrou", "entraram", "arrecadei", "arrecadamos", "ganhei", "ganhamos", "devolveu", "devolveram", "vendi", "vendemos", "doou", "doaram", "me pagou", "me pagaram", "me deu", "me deram", "me passou", "me mandou", "me enviou", "me transferiu", "me emprestou", "me emprestaram", "nos emprestou", "nos emprestaram", "reembolsou", "reembolsaram", "estornou", "estornaram"]],
];
// sem verbo no trecho, estas palavras já dizem que o dinheiro entrou
// ("restauração material" é a arrecadação da RM, não a compra de material)
const NOMES_ENTRADA = ["entrada", "entradas", "venda", "vendas", "arrecadacao", "devolucao", "reembolso", "reembolsos", "estorno", "estornos", "reembolsado", "reembolsada", "reembolsados", "reembolsadas", "estornado", "estornada", "restauracao material"];
const RM_NOME = /\brestauracao\s+material\b/;
// com uma destas ao lado, "restauração material" tanto é a compra como a arrecadação
const DE_COMPRA = [...(PALAVRAS.find(([id]) => id === "material")?.[1] ?? []), "compra", "compras"];
// "fiz uma doação", "fizemos um pix": quem faz, dá
const FAZER = ["fiz", "fizemos"];
// a doação e a oferta entram quando ninguém diz que as fez
const NOMES_RECEBIDOS = ["doacao", "doacoes", "oferta", "ofertas"];

// "won", "bob" e "bs" também são nomes de gente ("o Hyo Won", "o Bob"): só
// são a moeda junto do número ou depois de "em"
const COM_NUMERO = String.raw`(?:\d|\dk|\b(?:mil|milhao|milhoes))\s*`;
const MOEDA_PALAVRA: [Moeda, RegExp][] = [
  ["USD", /us\$|u\$s?|\bdolar(es)?\b|\busd\b|\bdol\b/],
  ["EUR", /€|\beuros?\b|\beur\b/],
  ["KRW", new RegExp(String.raw`₩|\bkrw\b|${COM_NUMERO}wons?\b|\bem\s+wons?\b|\bwons?\s*\d`)],
  ["BOB", new RegExp(String.raw`\bbolivianos?\b|${COM_NUMERO}(?:bob|bs)\b|\bem\s+(?:bob|bs)\b|\b(?:bob|bs\.?)\s*\d`)],
  ["BRL", /r\$|\breais\b|\breal\b|\bbrl\b/],
];
// "Bob 35", "Won 100": antes do número tanto é a moeda como o nome de alguém
const MOEDA_OU_NOME = /\b(?:bob|wons?)\s*\d/;
// moedas que os livros não têm: o valor fica para a pessoa conferir
const MOEDA_DE_FORA = /\b(?:pesos?|guaranis?|soles|libras?|ienes?|yuans?|francos?)\b|[£¥]/;

const VALOR = /\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?/;
const VALORES = new RegExp(VALOR.source, "g");
const DATA = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
// "do dia 12": o dia do mês
// ("meio-dia 25" e "bom dia 25" não: aí o número é o valor)
const DIA_DO_MES = /\b(?:(?:do|no|de|em)\s+)?(?<!\b(?:meio|bom)[\s-])dia\s+(\d{1,2})\b[º°]?(?![/.,]\d)/;
// "às 14h", "14h30", "14:30", "2 horas": hora não é valor
const HORAS = /(?:\bas\s+)?\b\d{1,2}(?:\s*(?:horas?|hrs?|hs|h)(?:\d{2})?|:\d{2})\b/g;
const DATAS = new RegExp(DATA.source, "g");
const DIAS_DO_MES = new RegExp(DIA_DO_MES.source, "g");
const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
// o mês por extenso ou só nas três primeiras letras ("5 de out")
const MES = MESES.map((mes) => `${mes.slice(0, 3)}(?:${mes.slice(3)})?`).join("|");
const mesDe = (escrito: string) => String(MESES.findIndex((mes) => mes.startsWith(escrito.slice(0, 3))) + 1);
// "dia 5 de outubro", "no dia 5 do mês de outubro", "em 5 de outubro de 2026"
const DIA_DE_MES = new RegExp(
  String.raw`\b(?:(?:(?:do|no|de|em)\s+)?(?<!\b(?:meio|bom)[\s-])dia|em)\s+(\d{1,2})[º°]?\s+(?:de|do\s+mes\s+de)\s+(${MES})\b(?:\s+de\s+(\d{4})\b)?`,
);
const DIAS_DE_MES = new RegExp(DIA_DE_MES.source, "g");
// "dia 2 do mês passado"
const DO_MES_PASSADO = /^\s+d[eo]\s+mes\s+passado\b/;
// "em outubro", "no mês de outubro": o mês sem o dia fica para conferir
const MES_SOLTO = new RegExp(String.raw`\b(?:em|durante|no\s+mes\s+de)\s+(?:${MESES.join("|")})\b`);
// "sábado", "na sexta", "segunda-feira passada": o último que passou
const DIAS_SEMANA = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const SEMANA = String.raw`(${DIAS_SEMANA.join("|")})([\s-]feira)?(\s+passad[oa])?`;
// ("segunda parcela" e "quarta vez" não são dias)
const DIA_SEMANA = new RegExp(
  String.raw`\b(?:(n[oa]|ness[ea]|nest[ea]|ess[ea]|est[ea]|ultim[oa]|d[eoa])\s+)?${SEMANA}\b(?!\s+(?:parcela|via|vez|prestacao|mensalidade|fase|etapa|parte|compra|viagem|semana|quinzena)\b)`,
);
// com estas palavras antes, "segunda" é o dia e não o ordinal
const ANTES_DE_DIA = /^(?:n[oa]|ness[ea]|nest[ea]|ess[ea]|est[ea]|ultim[oa])$/;
const NUMEROS = new Map([
  ["um", 1],
  ["uma", 1],
  ["dois", 2],
  ["duas", 2],
  ["tres", 3],
  ["quatro", 4],
  ["cinco", 5],
  ["seis", 6],
  ["sete", 7],
  ["oito", 8],
  ["nove", 9],
  ["dez", 10],
]);
const HA_DIAS = String.raw`(\d{1,3}|${[...NUMEROS.keys()].join("|")})\s+(dia|semana)s?`;
// "faz dois dias", "há 3 dias", "2 semanas atrás"
const DIA_ATRAS = new RegExp(String.raw`\b(?:(?:faz|fazem|ha)\s+${HA_DIAS}(?:\s+atras)?|${HA_DIAS}\s+atras)\b`);
const DIAS_ATRAS = new RegExp(DIA_ATRAS.source, "g");
// dias que não dá para saber ("semana passada", "outro dia", "amanhã"): fica
// o de hoje, e a pessoa confere
const DIA_VAGO = new RegExp(
  String.raw`\b(?:(?:n[oa]s?|ness[ea]s?|nest[ea]s?|d[eoa]s?|ha|faz)\s+)?(?:(?:semana|quinzena)\s+(?:passada|retrasada)|(?:mes|ano)\s+(?:passado|retrasado)|(?:semana|quinzena|mes|ano)\s+que\s+vem|proxim[oa]s?\s+(?:semanas?|quinzena|mes|meses|ano|dias?)|n?es[st][ea]\s+(?:semana|quinzena|mes|ano)|(?:comeco|inicio|meio|meados|fim|final)\s+d[eoa]\s+(?:mes|semana|quinzena|ano|${MESES.join("|")})|ultim[oa]s?\s+(?:semanas?|mes|meses|dias)|outro\s+dia|(?:esses|estes|uns|alguns)\s+dias(?:\s+atras)?|(?:um|algum|muito|pouco)\s+tempo(?:\s+atras)?|depois\s+de\s+amanha|amanha|(?:dias|semanas|meses|tempo)\s+atras|recentemente)\b`,
);
// "12 reais e 50 centavos" é um valor só, e "50 centavos" também é um valor
const COM_CENTAVOS = /(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:reais|real|dolares|dolar|euros?|bolivianos?)?\s+(?:e|com)\s+(\d{1,2})\s*centavos?\b/;
const SO_CENTAVOS = /\b(\d{1,4})\s*centavos?\b/;
// "10 mil", "2k", "1 milhão", "2 mil e 500", "2 mil e meio": o número vale com o múltiplo
const MULTIPLO = /(\d+(?:[.,]\d{1,2})?)(?:\s*(mil|milhao|milhoes)|k)\b(?:\s+e\s+(\d{3}|mei[oa])\b)?/;
// "7 e meio" são 7,50
const E_MEIO = /(\d+)\s*(?:reais|real|dolares|dolar|euros?|bolivianos?)?\s+e\s+mei[oa]\b/;
// "ônibus 4 e 50", "12 reais e 50": falado, o "e" junta os reais e os centavos
const E_CENTAVOS = /(?<![\d.,/:])(\d+)(\s*(?:reais|real|dolares|dolar|euros?|bolivianos?))?\s+e\s+(\d{2})(?![\d/:]|[.,]\d)/;
// os dois lados desse "e": um inteiro no fim, dois algarismos no começo
const INTEIRO_NO_FIM = /(?<![\d.,/:])\d+(?:\s*(?:reais|real|dolares|dolar|euros?|bolivianos?))?$/;
const DOIS_NO_COMECO = /^\d{2}(?![\d/:]|[.,]\d)(?!\s*(?:centavos?|mil|milhao|milhoes|k)\b)/;

// o que marca um número como o valor: a moeda colada nele, ou o "por" antes
// (mais abaixo), que também diz que ele é o total
const MOEDA_ANTES = /(?:r\$|us\$|u\$s|\$|€|₩)\s*$/;
const MOEDA_DEPOIS = /^\s*(?:reais|real|dolares|dolar|euros?|wons?|bolivianos?|usd|dol|brl|eur|krw|bob|bs)\b/;
const VERBO_ANTES = /\b(?:gastei|gastamos|paguei|pagamos|recebi|recebemos|entrou|entraram|ganhei|ganhamos)\s*$/;
// "2 passagens", "3 meses": um inteiro antes de um plural é quantidade, não
// valor; "30 dos 50", "20 mais 15" e "18 onibus" terminam em "s" e não são plural
const QUANTIDADE_DEPOIS = /^\s+(?!(?:dos|das|nos|nas|aos|os|as|mais|menos|pelos|pelas|uns|umas|depois|antes|mas|vezes|onibus|gas|tenis|lapis|pras|pros|apos)\b)[a-z]+s\b/;
// "as ofertas do dia 12": o número depois de "dia" é o dia, não o valor
const DIA_ANTES = /(?<!\b(?:meio|bom)[\s-])\bdia\s*$/;
// "almoço às 14": o número depois de "às" é a hora
const HORA_ANTES = /\bas\s*$/;
const PRECO_ANTES = /\b(?:por|deu|deram|custou|custaram|saiu|sairam|total|total de|valor de|no valor de)\s*(?:r\$|us\$|u\$s|\$|€|₩)?\s*$/;

// "por 1 almoço", "por 5 km": depois do "por", o inteiro antes de um nome
// conta coisas; antes de uma palavra de ligação ("por 30 no pix") é o preço
const POR_ANTES = /\bpor\s*$/;
const NOME_DEPOIS = /^\s+(?!(?:de|do|da|dos|das|no|na|nos|nas|em|com|para|pra|pro|pras|pros|por|pelo|pela|pelos|pelas|a|o|ao|aos|as|os|e|ou|cada|hoje|ontem|anteontem|mais|menos|mas|que|pix|dinheiro|cartao|total|tudo|so|la|ja|aqui|tambem|mesmo|apenas|via|sem)\b)[a-z]/;
// "60 dividido por 3", "rachado em 4": o número é por quantos se divide
const DIVIDIR = "(?:dividid[oa]s?|dividimos|dividi|dividir|rachad[oa]s?|rachamos|rachei)";
const DIVISOR_ANTES = new RegExp("\\b" + DIVIDIR + "\\s+(?:por|em|entre|com)\\s*$");
const DIVIDIDO = new RegExp("\\b" + DIVIDIR + "\\b");
// "por 30 cada", "30 por pessoa": é o preço de um, e o total a pessoa confere
const UNITARIO = /\bcada\b|\ba unidade\b|\bpor (?:pessoa|cabeca)\b/;

// onde a mensagem se parte em movimentos: linha, ";", "+" e o "e" que ainda
// tem um número depois (menos o de "12 reais e 50 centavos")
// (nem o de "2 mil e 500", nem o de "7 e meio")
const SEPARA = /\n|;|(?<!\bmil\s*(?=\s*e\s+\d{3}\b))\s+e\s+(?=[^\d]*\d)(?!\d{1,2}\s*centavos?\b)(?!mei[oa]\b)|\s*\+\s*/g;

const SIMBOLOS = /\bu\$s\b|\b(?:us|r|u)\$/g;
const LIMPAR = /\b(bom dia|boa tarde|boa noite|dei|demos|doei|doamos|ofertei|ofertamos|transferi|transferimos|enviei|enviamos|mandei|mandamos|devolvi|devolvemos|fiz|fizemos|gastei|gastamos|paguei|pagamos|comprei|compramos|recebi|recebemos|entrou|foi|foram|hoje|ontem|anteontem|reais|real|dolares|dolar|euros|euro|wons|won|no pix|por pix|pix|em dinheiro|dinheiro|na conta|transferencia|no total|total|cada|tudo)\b/g;
// o que não fica na ponta de uma descrição: preposição solta e pontuação
const PONTA_INICIO = /^(?:(?:de|do|da|com|em|no|na|para|pra|pro|por|e)(?=\s|$)|[\s.,;:!?-])/i;
const PONTA_FIM = /(?:(?:^|\s)(?:de|do|da|com|em|no|na|para|pra|pro|por|e)|[\s.,;:!?-])$/i;

// A frase em minúsculas e sem acentos, com cada letra no lugar que tem na
// original: o que se acha numa posição daqui vale na mesma posição de lá.
function plano(text: string) {
  let saida = "";
  for (const letra of text) {
    const simples = semAcento(letra);
    saida += simples.length === letra.length ? simples : letra;
  }
  return saida;
}

// Troca um pedaço por espaços, sem mexer no lugar do resto.
function cobrir(text: string, inicio: number, fim: number) {
  return `${text.slice(0, inicio)}${" ".repeat(fim - inicio)}${text.slice(fim)}`;
}

const apagar = (achado: string) => " ".repeat(achado.length);

function posicaoDe(text: string, palavra: string) {
  const achado = new RegExp(`(^|[^a-z0-9])${palavra}($|[^a-z0-9])`).exec(text);
  return achado ? achado.index + achado[1].length : -1;
}

function temPalavra(text: string, palavra: string) {
  return posicaoDe(text, palavra) >= 0;
}

function capitalizar(text: string) {
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : text;
}

function aparar(text: string) {
  let saida = text;
  for (let antes = ""; antes !== saida; ) {
    antes = saida;
    saida = saida.replace(PONTA_INICIO, "").replace(PONTA_FIM, "");
  }
  return saida;
}

// "peguei um empréstimo", "tomamos 500 emprestado": o dinheiro entrou
const PEGAR_EMPRESTIMO = /\b(?:peguei|pegamos|tomei|tomamos|pedi|pedimos|consegui|conseguimos)\b.*\bemprest(?:imos?|ad[oa]s?)\b/;
// "empréstimo de 200 do João", "fiz um empréstimo", "o João emprestou 200":
// sem verbo que diga o lado, tanto vai como vem
const EMPRESTIMO = /\bemprest(?:imos?|ad[oa]s?|ou|aram)\b/;

// O lado que o verbo do trecho diz; entre os verbos vale o primeiro ("recebi
// de volta os 30 que paguei" é entrada, "dei 50 de oferta" é saída).
function verboDe(texto: string): Sentido | null {
  let primeiro: { em: number; sentido: Sentido } | null = null;
  for (const [sentido, verbos] of VERBOS) {
    for (const verbo of verbos) {
      const em = posicaoDe(texto, verbo);
      if (em >= 0 && (!primeiro || em < primeiro.em)) {
        primeiro = { em, sentido };
      }
    }
  }
  const pegar = PEGAR_EMPRESTIMO.exec(texto);
  if (pegar && (!primeiro || pegar.index < primeiro.em)) {
    return "entrada";
  }
  return primeiro?.sentido ?? null;
}

// De que lado o dinheiro foi: o que o verbo diz ou, sem verbo, "venda" e
// "reembolso" dizem que entrou, "fiz" (uma doação, um pix) que saiu, e
// "oferta" e "doação" sozinhas, que entrou. null: o trecho não diz.
function sentidoDe(texto: string): Sentido | null {
  const verbo = verboDe(texto);
  if (verbo) {
    return verbo;
  }
  const tem = (nomes: string[]) => nomes.some((nome) => temPalavra(texto, nome));
  if (tem(NOMES_ENTRADA)) {
    return "entrada";
  }
  if (tem(FAZER)) {
    return "saida";
  }
  return tem(NOMES_RECEBIDOS) ? "entrada" : null;
}

// A moeda que o trecho escreve; null quando não escreve nenhuma.
function moedaDe(texto: string): Moeda | null {
  return MOEDA_PALAVRA.find(([, regra]) => regra.test(texto))?.[0] ?? null;
}

// O meio que o trecho escreve; null quando não escreve nenhum.
function meioDe(texto: string): Meio | null {
  if (/\bdinheiro\b|especie/.test(texto)) {
    return "dinheiro";
  }
  // "no débito", "no crédito" são o cartão; "20 de crédito no celular" não
  return /\bpix\b|\bconta\b|transfer|cartao|deposit|\bboleto\b|\bted\b|\b(?:no|pelo|via|por|em)\s+(?:debito|credito)\b/.test(texto) ? "conta" : null;
}

// Qual dos números da frase é o valor. "comprei 2 passagens por 30" traz dois:
// sai o que é quantidade ("2 passagens"); do que resta vale o que tem a moeda,
// depois o que vem com "por", depois o que segue o verbo, depois o último.
// `duvida`: o trecho tem outro número e nada diz que o escolhido é o total
// ("3 diárias de 80" tanto pode ser 80 como 240) — a pessoa confere.
function valorEm(texto: string) {
  const composto = COM_CENTAVOS.exec(texto);
  const centavos = composto ? null : SO_CENTAVOS.exec(texto);
  const escrito = composto ?? centavos;
  if (escrito) {
    const inicio = escrito.index;
    const fim = inicio + escrito[0].length;
    const soCentavos = Number(escrito[1]);
    return {
      texto: composto ? `${composto[1]},${composto[2].padStart(2, "0")}` : `${Math.floor(soCentavos / 100)},${String(soCentavos % 100).padStart(2, "0")}`,
      inicio,
      fim,
      duvida: VALOR.test(cobrir(texto, inicio, fim)),
    };
  }
  const multiplo = MULTIPLO.exec(texto);
  if (multiplo) {
    const inicio = multiplo.index;
    const fim = inicio + multiplo[0].length;
    const fator = multiplo[2]?.startsWith("milh") ? 1_000_000 : 1000;
    const resto = !multiplo[3] ? 0 : multiplo[3].startsWith("mei") ? fator / 2 : Number(multiplo[3]);
    const total = Number(multiplo[1].replace(",", ".")) * fator + resto;
    const depois = texto.slice(fim);
    return {
      texto: total.toFixed(2).replace(".", ","),
      inicio,
      fim,
      // "2 mil panfletos" é quantidade, e outro número no trecho deixa a dúvida
      duvida: VALOR.test(cobrir(texto, inicio, fim)) || (!MOEDA_ANTES.test(texto.slice(0, inicio)) && !MOEDA_DEPOIS.test(depois) && QUANTIDADE_DEPOIS.test(depois)),
    };
  }
  const meio = E_MEIO.exec(texto);
  if (meio) {
    const inicio = meio.index;
    const fim = inicio + meio[0].length;
    return {
      texto: `${meio[1]},50`,
      inicio,
      fim,
      // "às 7 e meia" é hora
      duvida: VALOR.test(cobrir(texto, inicio, fim)) || HORA_ANTES.test(texto.slice(0, inicio)),
    };
  }
  const falado = E_CENTAVOS.exec(texto);
  // "50 reais e 20 dólares": cada número com a sua moeda são dois valores
  if (falado && !(falado[2] && MOEDA_DEPOIS.test(texto.slice(falado.index + falado[0].length)))) {
    const inicio = falado.index;
    const fim = inicio + falado[0].length;
    return {
      texto: [falado[1], falado[3]].join(","),
      inicio,
      fim,
      // sem a moeda no meio, "4 e 50" também pode ser dois valores
      duvida: !falado[2] || VALOR.test(cobrir(texto, inicio, fim)),
    };
  }
  const todos = [...texto.matchAll(VALORES)];
  if (!todos.length) {
    return null;
  }
  const antes = (item: RegExpExecArray) => texto.slice(0, item.index);
  const depois = (item: RegExpExecArray) => texto.slice(item.index + item[0].length);
  const comMoeda = (item: RegExpExecArray) => MOEDA_ANTES.test(antes(item)) || MOEDA_DEPOIS.test(depois(item));
  const quantidade = (item: RegExpExecArray) => /^\d+$/.test(item[0]) && !comMoeda(item) && QUANTIDADE_DEPOIS.test(depois(item));
  const contagem = (item: RegExpExecArray) => /^\d+$/.test(item[0]) && !comMoeda(item) && POR_ANTES.test(antes(item)) && NOME_DEPOIS.test(depois(item));
  // quantidade, divisor, dia ou hora: só vale como valor se não houver outro número, e aí a pessoa confere
  const fraco = (item: RegExpExecArray) =>
    quantidade(item) || contagem(item) || DIVISOR_ANTES.test(antes(item)) || DIA_ANTES.test(antes(item)) || HORA_ANTES.test(antes(item));
  // o "por" só diz que o número é o total quando o número é um preço
  const preco = (item: RegExpExecArray) => PRECO_ANTES.test(antes(item)) && !fraco(item);
  const valores = todos.filter((item) => !fraco(item));
  const candidatos = valores.length ? valores : todos;
  const marcados = candidatos.filter(comMoeda);
  const escolhido =
    marcados[0] ??
    candidatos.find(preco) ??
    candidatos.find((item) => VERBO_ANTES.test(antes(item))) ??
    candidatos[candidatos.length - 1];
  return {
    texto: escolhido[0],
    inicio: escolhido.index,
    fim: escolhido.index + escolhido[0].length,
    duvida: fraco(escolhido) || (todos.length > 1 && !preco(escolhido)),
  };
}

// O dia escrito com o mês ("12/09", "12/09/2026", "dia 12 de setembro"),
// quando existe e cabe entre o começo dos livros e hoje. Sem o ano, vale o
// deste ano ou, se ainda não chegou, o passado.
function diaMarcado(dia: string, mes: string, ano: string | undefined, hoje: string, inicio: string) {
  const anoHoje = Number(hoje.slice(0, 4));
  const escrito = ano ? Number(ano) : null;
  const anos = escrito === null ? [anoHoje, anoHoje - 1] : [escrito < 100 ? 2000 + escrito : escrito];
  for (const doAno of anos) {
    const data = `${doAno}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    if (isIsoDay(data) && data <= hoje && data >= inicio) {
      return data;
    }
  }
  return null;
}

// `duvida`: o dia escrito não existe ou não cabe nos livros, e ficou o de hoje.
type Dia = { data: string; duvida: boolean };

// "dia 12" é o 12 deste mês ou, se ainda não chegou, o do mês passado;
// "dia 12 do mês passado" é só o do mês passado.
function diaDoMes(numero: number, hoje: string, inicio: string, passado = false) {
  const ano = Number(hoje.slice(0, 4));
  const mes = Number(hoje.slice(5, 7));
  const anterior = mes === 1 ? [ano - 1, 12] : [ano, mes - 1];
  for (const [doAno, doMes] of passado ? [anterior] : [[ano, mes], anterior]) {
    const data = `${doAno}-${String(doMes).padStart(2, "0")}-${String(numero).padStart(2, "0")}`;
    if (isIsoDay(data) && data <= hoje && data >= inicio) {
      return data;
    }
  }
  return null;
}

const ehDiaDoMes = (numero: number) => numero >= 1 && numero <= 31;

// O trecho sem as datas ("12/09", "dia 5 de outubro"), os dias do mês, as
// horas e o "faz 2 dias": esses números não são valores.
function semTempo(texto: string) {
  return texto
    .replace(DATAS, apagar)
    .replace(DIAS_DE_MES, apagar)
    .replace(DIAS_DO_MES, (achado: string, numero: string) => (ehDiaDoMes(Number(numero)) ? apagar(achado) : achado))
    .replace(HORAS, apagar)
    .replace(DIAS_ATRAS, apagar);
}

// há quantos dias: o primeiro que aparecer na lista é o que vale
const PALAVRAS_DIA: [string, number][] = [
  ["antes de ontem", 2],
  ["ante-ontem", 2],
  ["ante ontem", 2],
  ["anteontem", 2],
  ["ontem", 1],
  ["noite passada", 1],
  ["hoje", 0],
];

// O dia de `dias` atrás, quando cabe nos livros.
function diaPassado(dias: number, hoje: string, inicio: string): Dia {
  const data = addDays(hoje, -dias);
  const cabe = data >= inicio;
  return { data: cabe ? data : hoje, duvida: !cabe };
}

// O dia que o trecho traz ("12/09", "dia 5 de outubro", "ontem", "na sexta",
// "faz dois dias") e onde está escrito; null quando não traz nenhum.
function diaEm(texto: string, hoje: string, inicio: string): (Dia & { inicio: number; fim: number }) | null {
  const marcada = DATA.exec(texto);
  if (marcada) {
    const dia = diaMarcado(marcada[1], marcada[2], marcada[3], hoje, inicio);
    return { data: dia ?? hoje, duvida: dia === null, inicio: marcada.index, fim: marcada.index + marcada[0].length };
  }
  const deMes = DIA_DE_MES.exec(texto);
  if (deMes) {
    const dia = diaMarcado(deMes[1], mesDe(deMes[2]), deMes[3], hoje, inicio);
    return { data: dia ?? hoje, duvida: dia === null, inicio: deMes.index, fim: deMes.index + deMes[0].length };
  }
  const doMes = DIA_DO_MES.exec(texto);
  if (doMes && ehDiaDoMes(Number(doMes[1]))) {
    const fim = doMes.index + doMes[0].length;
    const passado = DO_MES_PASSADO.exec(texto.slice(fim));
    const dia = diaDoMes(Number(doMes[1]), hoje, inicio, passado !== null);
    return {
      data: dia ?? hoje,
      // "dia 5 da semana passada" não dá para saber
      duvida: dia === null || (!passado && DIA_VAGO.test(texto)),
      inicio: doMes.index,
      fim: fim + (passado?.[0].length ?? 0),
    };
  }
  for (const [palavra, dias] of PALAVRAS_DIA) {
    const em = posicaoDe(texto, palavra);
    if (em >= 0) {
      return { ...diaPassado(dias, hoje, inicio), inicio: em, fim: em + palavra.length };
    }
  }
  const atras = DIA_ATRAS.exec(texto);
  if (atras) {
    const conta = atras[1] ?? atras[3];
    const dias = (NUMEROS.get(conta) ?? Number(conta)) * ((atras[2] ?? atras[4]) === "semana" ? 7 : 1);
    return { ...diaPassado(dias, hoje, inicio), inicio: atras.index, fim: atras.index + atras[0].length };
  }
  const vago = DIA_VAGO.exec(texto) ?? MES_SOLTO.exec(texto);
  const semana = DIA_SEMANA.exec(texto);
  if (semana) {
    const [escrito, antes, nome, feira, passado] = semana;
    const fim = semana.index + escrito.length;
    const numero = DIAS_SEMANA.indexOf(nome);
    const distancia = (new Date(`${hoje}T00:00:00Z`).getUTCDay() - numero + 7) % 7;
    const dia = diaPassado(distancia || (passado ? 7 : 0), hoje, inicio);
    const incerto =
      // "segunda" e "sexta" também são ordinais
      (numero >= 1 && numero <= 5 && !feira && !passado && !ANTES_DE_DIA.test(antes ?? "")) ||
      // num domingo, "domingo" é hoje ou o que passou
      (distancia === 0 && !passado) ||
      // "sexta da semana passada" não é a última sexta, e "sábado e domingo" são dois dias
      vago !== null ||
      DIA_SEMANA.test(texto.slice(fim));
    return { data: dia.data, duvida: dia.duvida || incerto, inicio: semana.index, fim };
  }
  return vago ? { data: hoje, duvida: true, inicio: vago.index, fim: vago.index + vago[0].length } : null;
}

// `cru` é o trecho como a pessoa escreveu; o lado, o dia herdado e a moeda
// (`padrao`) e o meio vêm do resto da mensagem, para o trecho que não traz os seus.
function proposta(
  cru: string,
  sentido: Sentido,
  herdado: Dia | null,
  hoje: string,
  categorias: Categoria[],
  padrao: Moeda,
  meioPadrao: Meio,
  inicio: string,
): Proposta | null {
  let texto = plano(cru);
  const proprio = diaEm(texto, hoje, inicio);
  const dia = proprio ?? herdado ?? { data: hoje, duvida: false };
  if (proprio) {
    // os números da data não são o valor
    texto = cobrir(texto, proprio.inicio, proprio.fim);
  }
  // nem as horas, nem outra data
  texto = semTempo(texto);

  const achado = valorEm(texto);
  if (!achado) {
    return null;
  }
  const moeda = moedaDe(texto) ?? padrao;
  const valorMinor = parseValor(achado.texto, moeda);
  if (!valorMinor) {
    return null;
  }
  // a categoria sai da frase sem o valor: "gastei 99 no mercado" não é o app 99
  const semNumero = cobrir(texto, achado.inicio, achado.fim);
  const entrada = sentido === "entrada";
  const lista = entrada ? PALAVRAS_ENTRADA : PALAVRAS;
  // "no cartão" é o meio do pagamento, não a categoria da fatura
  const semCartao = semNumero.replace(CARTAO_MEIO, apagar);
  // duas categorias no mesmo trecho ("almoço e uber"): fica a primeira, e a pessoa confere
  const achadas = lista.filter(([, palavras]) => palavras.some((palavra) => temPalavra(semCartao, palavra))).map(([id]) => id);
  const achada: string | undefined = achadas[0];
  const categoriaId = achada ?? (entrada ? "outras-entradas" : "outros");

  // a descrição são as letras que a pessoa escreveu (com os acentos), menos o
  // valor, o dia e os verbos: o que sai vira espaço, e o resto não muda de lugar
  const limpo = semNumero.replace(SIMBOLOS, apagar).replace(LIMPAR, apagar).replace(/[€₩$;]/g, " ");
  let escrito = "";
  for (let indice = 0; indice < cru.length; indice += 1) {
    escrito += /\s/.test(limpo[indice]) ? " " : cru[indice];
  }
  const descricao = aparar(escrito.replace(/\s+/g, " ").trim());
  const nome = categorias.find((item) => item.id === categoriaId)?.nome ?? "Movimento";

  return {
    tipo: sentido,
    valorMinor,
    moeda,
    meio: meioDe(semNumero) ?? meioPadrao,
    categoriaId,
    data: dia.data,
    descricao: capitalizar(descricao) || nome,
    // "por 30 cada", "60 dividido por 3": a conta fica para a pessoa
    revisar:
      achadas.length !== 1 ||
      (entrada && DE_GASTO.some((palavra) => temPalavra(semCartao, palavra))) ||
      dia.duvida || achado.duvida || MOEDA_DE_FORA.test(texto) || MOEDA_OU_NOME.test(texto) || UNITARIO.test(texto) || DIVIDIDO.test(texto),
  };
}

const CARTAO_MEIO = /\b(?:no|pelo|com o|com|via|por)\s+cartao\b/g;

type Trecho = { inicio: number; fim: number };

const temCategoria = (texto: string) => [...PALAVRAS, ...PALAVRAS_ENTRADA].some(([, palavras]) => palavras.some((palavra) => temPalavra(texto, palavra)));

// "ônibus 4 e 50", "12 reais e 50 no lanche": o "e" entre um inteiro e dois
// algarismos junta os reais e os centavos, a não ser que cada lado traga a
// sua categoria ("almoço 30 e 50 de uber")
function centavosFalados(antes: string, corte: string, depois: string) {
  const inteiro = INTEIRO_NO_FIM.exec(antes);
  if (!/^\s+e\s+$/.test(corte) || !inteiro || !DOIS_NO_COMECO.test(depois)) {
    return false;
  }
  // "50 reais e 20 dólares": cada número com a sua moeda são dois valores
  if (/\D$/.test(inteiro[0]) && MOEDA_DEPOIS.test(depois.slice(2))) {
    return false;
  }
  const cabeca = antes.slice(0, inteiro.index);
  if (DIA_ANTES.test(cabeca) || HORA_ANTES.test(cabeca)) {
    return false;
  }
  const resto = depois.slice(2).replace(MOEDA_DEPOIS, "");
  const proximo = resto.search(SEPARA);
  const cauda = proximo < 0 ? resto : resto.slice(0, proximo);
  return !QUANTIDADE_DEPOIS.test(resto) && !(temCategoria(cabeca) && temCategoria(cauda));
}

// O fim do trecho, onde se diz a moeda, o meio e o dia da frase toda:
// "… em dólares", "… ontem à noite no pix", "…, tudo no cartão".
const PALAVRA_FECHO =
  /reais|real|dolares|dolar|euros?|wons?|bolivianos?|pix|dinheiro|especie|cartao(?:\s+de\s+(?:credito|debito))?|credito|debito|boleto|ted|transferencia|deposito|hoje|ontem|anteontem|antes\s+de\s+ontem|ante[\s-]ontem|dia\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|noite\s+passada|noite|tarde|manha|madrugada|cedo/
    .source;
const ITEM_FECHO = String.raw`(?:tudo\s+)?(?:(?:(?:em|no|na|por|de|do|da|via|com|pelo|pela|a)\s+)?(?:${DIA_DE_MES.source}|${MES_SOLTO.source}|${PALAVRA_FECHO}|${SEMANA}|${DIA_VAGO.source}|${DIA_ATRAS.source})|(?:na|pela)\s+conta)`;
const FECHO = new RegExp(String.raw`(?:[\s,]+${ITEM_FECHO})+[\s.,!?]*$`);
// depois do dia só vem fecho ("… ontem à noite no pix"): o dia fala da frase toda
const SO_FECHO = new RegExp(String.raw`^(?:[\s,]+${ITEM_FECHO})*[\s.,!?]*$`);

// Uma mensagem pode trazer vários movimentos: "18 de ônibus e 32 no almoço".
// `inicio` é o primeiro dia dos livros: uma data antes dele não é aceita.
export function interpretar(mensagem: string, hoje: string, categorias: Categoria[], opcoes: { padrao?: Moeda; inicio?: string } = {}): Proposta[] {
  const padrao = opcoes.padrao ?? "BRL";
  const inicio = opcoes.inicio ?? "0000-01-01";
  // em NFC uma letra acentuada é uma letra só, e `plano` fica do mesmo tamanho
  const original = mensagem.normalize("NFC");
  const texto = plano(original);

  // sem as datas e as horas, que não são valores
  const livre = semTempo(texto);
  const partes: Trecho[] = [];
  let cursor = 0;
  for (const corte of texto.matchAll(SEPARA)) {
    if (centavosFalados(livre.slice(cursor, corte.index), corte[0], livre.slice(corte.index + corte[0].length))) {
      continue;
    }
    partes.push({ inicio: cursor, fim: corte.index });
    cursor = corte.index + corte[0].length;
  }
  partes.push({ inicio: cursor, fim: texto.length });

  // um pedaço sem valor pertence ao seguinte ("almoço e janta 50"), e o que
  // sobra no fim, ao anterior; cada trecho é um pedaço inteiro da mensagem
  const trechos: Trecho[] = [];
  let pendente: Trecho | null = null;
  for (const parte of partes) {
    const pedaco = texto.slice(parte.inicio, parte.fim);
    if (!pedaco.trim()) {
      continue;
    }
    const junto: Trecho = { inicio: pendente?.inicio ?? parte.inicio, fim: parte.fim };
    if (VALOR.test(semTempo(pedaco))) {
      trechos.push(junto);
      pendente = null;
    } else {
      pendente = junto;
    }
  }
  if (pendente && trechos.length) {
    trechos[trechos.length - 1].fim = pendente.fim;
  }

  const lidos = trechos.map((trecho) => {
    const pedaco = texto.slice(trecho.inicio, trecho.fim);
    const dia = diaEm(pedaco, hoje, inicio);
    const fecho = FECHO.exec(pedaco);
    // colado ao número ("… e 20 dólares"), o fecho fala só desse valor
    const fim = fecho && !/\d\s*$/.test(pedaco.slice(0, fecho.index)) ? fecho[0] : "";
    // "empréstimo de 200 do João", ou "material para a restauração material":
    // sem verbo, não se sabe de que lado foi
    const semRm = pedaco.replace(RM_NOME, apagar);
    const semLado = verboDe(pedaco) === null && (EMPRESTIMO.test(pedaco) || (semRm !== pedaco && DE_COMPRA.some((palavra) => temPalavra(semRm, palavra))));
    return {
      sentido: sentidoDe(pedaco),
      semLado,
      dia,
      // "… e 32 no almoço ontem": o dia no fim do trecho fala da frase toda
      noFim: dia !== null && SO_FECHO.test(pedaco.slice(dia.fim)),
      moeda: moedaDe(pedaco),
      meio: meioDe(pedaco),
      // "… e 20 de almoço em dólares", "… no pix": também falam da frase toda
      moedaFim: moedaDe(fim),
      meioFim: meioDe(fim),
    };
  });

  // O trecho que não diz o lado, o dia ou a moeda fica com os do trecho
  // anterior ("recebi 50 do João e 30 da Maria", "10 dólares no táxi e 20 no
  // almoço"); sem anterior, é um gasto, e o dia, a moeda e o meio são os que
  // fecham um trecho seguinte ("… e 20 de almoço em dólares"). O meio não
  // passa para o trecho seguinte. Quando outro trecho diz uma moeda ou um
  // meio que este não recebe, ou a categoria não combina com o lado herdado,
  // a proposta sai marcada para revisar.
  const propostas: Proposta[] = [];
  let sentido: Sentido = "saida";
  let dia: Dia | null = null;
  let moeda: Moeda | null = null;
  trechos.forEach((trecho, indice) => {
    const lido = lidos[indice];
    const depois = lidos.slice(indice + 1);
    const seguinte = depois.find((outro) => outro.dia);
    const comMoeda = depois.find((outro) => outro.moeda);
    const comMeio = depois.find((outro) => outro.meio);
    sentido = lido.sentido ?? sentido;
    dia = lido.dia ?? dia ?? (seguinte?.noFim ? seguinte.dia : null);
    const moedaDaqui: Moeda | null = lido.moeda ?? moeda ?? comMoeda?.moedaFim ?? null;
    const meioDaqui = lido.meio ?? comMeio?.meioFim ?? null;
    const incerto =
      lido.semLado ||
      (moedaDaqui === null && comMoeda !== undefined && comMoeda.moeda !== padrao) ||
      (lido.moeda === null && moeda !== null && Boolean(comMoeda?.moedaFim) && comMoeda?.moedaFim !== moeda) ||
      (meioDaqui === null && lidos.some((outro, outroIndice) => outroIndice !== indice && outro.meio === "conta"));
    const item = proposta(original.slice(trecho.inicio, trecho.fim), sentido, dia, hoje, categorias, moedaDaqui ?? padrao, meioDaqui ?? "dinheiro", inicio);
    if (item) {
      propostas.push(incerto ? { ...item, revisar: true } : item);
      moeda = moedaDaqui;
    }
  });
  return propostas;
}

export type Pergunta =
  | { kind: "saldo" }
  | { kind: "total"; tipo: "saida" | "entrada"; categoriaId: string | null; periodo: "hoje" | "mes" | "mes_passado" | "ano" };

// "quanto gastamos em transporte este mês?", "qual é o saldo?"
export function perguntaDe(mensagem: string): Pergunta | null {
  const texto = semAcento(mensagem);
  // "gastei 50 no total" é um lançamento: com um valor e sem "?", as palavras
  // "total" e "saldo" sozinhas não fazem a pergunta
  const solta = mensagem.includes("?") || !/\d/.test(texto);
  if (/quanto (temos|tem|sobrou|resta)\b/.test(texto) || (solta && /\bsaldo\b/.test(texto))) {
    return { kind: "saldo" };
  }
  if (!/\bquantos?\b|\bqual\b|\bquais\b|\bresumo\b/.test(texto) && !(solta && /\btotal\b/.test(texto))) {
    return null;
  }
  const entrada = /receb|entrou|entrad|arrecad|doac/.test(texto);
  const lista = entrada ? PALAVRAS_ENTRADA : PALAVRAS;
  const categoriaId = lista.find(([, palavras]) => palavras.some((palavra) => temPalavra(texto, palavra)))?.[0] ?? null;
  const periodo = /mes passado|ultimo mes/.test(texto) ? "mes_passado" : /\bhoje\b/.test(texto) ? "hoje" : /\bano\b/.test(texto) ? "ano" : "mes";
  return { kind: "total", tipo: entrada ? "entrada" : "saida", categoriaId, periodo };
}
