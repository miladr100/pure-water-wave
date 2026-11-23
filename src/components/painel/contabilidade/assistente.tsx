"use client";

import { Camera, Check, Mic, Paperclip, Pencil, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fmtMes, fmtMoeda, MEIO_NOME, MOEDAS, mesDe, saldos, somaMes } from "@/lib/hj/contabilidade";
import { interpretar, perguntaDe, type Pergunta, type Proposta } from "@/lib/hj/contabilidade-assistente";
import { INICIO_DEMO } from "@/lib/hj/contabilidade-mock";
import { addDays, fmtDia } from "@/lib/hj/dates";
import { cn } from "@/lib/utils";

import { CatIcone, corEntrada, Etiqueta } from "./pieces";
import { useContabilidade } from "./store";

// O assistente: a pessoa escreve (ou fala, ou fotografa o comprovante) e ele
// devolve cartões de movimento para confirmar. Também responde perguntas sobre
// o saldo e os gastos. Neste protótipo a leitura é feita por regras no próprio
// navegador; foto e áudio são simulados.

type Cartao = Proposta & {
  id: string;
  estado: "aberta" | "confirmada" | "descartada";
  comprovante: string | null;
  // a contabilidade em que foi salvo: o seletor pode mudar depois
  salvoEm?: string;
};
type Mensagem = { id: number; de: "eu" | "assistente"; texto?: string; cartoes?: Cartao[]; anexo?: string };

const SUGESTOES = [
  "Gastei 18 de ônibus e 32 no almoço",
  "Recebi 200 de doação no pix",
  "Quanto gastamos em transporte este mês?",
  "Qual é o saldo?",
];

const DITADO = "Ontem paguei 45 de gasolina no pix e 12,50 de lanche";

export function Assistente() {
  const { assistenteAberto, setAssistenteAberto, eu, hoje, doEscopo, escopoNome, movimentos, moedas, categorias, categoria, projeto, salvar, abrirEditor } =
    useContabilidade();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [destinoId, setDestinoId] = useState("");
  const conta = useRef(0);
  const fim = useRef<HTMLDivElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);

  const destino = doEscopo.some((projeto) => projeto.id === destinoId) ? destinoId : (doEscopo[0]?.id ?? "");
  const primeiroNome = eu.nome.split(" ")[0];

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens, pensando]);

  function nova(mensagem: Omit<Mensagem, "id">) {
    conta.current += 1;
    const id = conta.current;
    setMensagens((atual) => [...atual, { ...mensagem, id }]);
  }

  function cartoesDe(propostas: Proposta[], comprovante: string | null = null): Cartao[] {
    return propostas.map((proposta) => {
      conta.current += 1;
      return { ...proposta, id: `c${conta.current}`, estado: "aberta", comprovante };
    });
  }

  function responderPergunta(pergunta: Pergunta): string {
    if (pergunta.kind === "saldo") {
      const linhas = saldos(movimentos, moedas)
        .filter((saldo) => saldo.moeda === "BRL" || saldo.total !== 0)
        .map((saldo) => `${fmtMoeda(saldo.total, saldo.moeda)} (${fmtMoeda(saldo.dinheiro, saldo.moeda)} em dinheiro, ${fmtMoeda(saldo.conta, saldo.moeda)} em Pix / conta)`);
      return `Saldo de ${escopoNome} hoje:\n${linhas.join("\n")}`;
    }
    const mes = mesDe(hoje);
    const dentro = (dia: string) =>
      pergunta.periodo === "hoje"
        ? dia === hoje
        : pergunta.periodo === "ano"
          ? dia.slice(0, 4) === hoje.slice(0, 4)
          : mesDe(dia) === (pergunta.periodo === "mes_passado" ? somaMes(mes, -1) : mes);
    const quando =
      pergunta.periodo === "hoje"
        ? "Hoje"
        : pergunta.periodo === "ano"
          ? `Em ${hoje.slice(0, 4)}`
          : `Em ${fmtMes(pergunta.periodo === "mes_passado" ? somaMes(mes, -1) : mes)}`;
    const achados = movimentos.filter(
      (mov) => mov.tipo === pergunta.tipo && mov.moeda === "BRL" && dentro(mov.data) && (!pergunta.categoriaId || mov.categoriaId === pergunta.categoriaId),
    );
    const total = achados.reduce((soma, mov) => soma + mov.valorMinor, 0);
    const oQue = pergunta.categoriaId ? ` em ${categoria(pergunta.categoriaId)?.nome ?? "essa categoria"}` : "";
    const verbo = pergunta.tipo === "entrada" ? "entraram" : "saíram";
    if (!achados.length) {
      return `${quando} não há ${pergunta.tipo === "entrada" ? "entradas" : "gastos"}${oQue} em ${escopoNome}.`;
    }
    return `${quando} ${verbo} ${fmtMoeda(total, "BRL")}${oQue} em ${escopoNome}, em ${achados.length} ${achados.length === 1 ? "movimento" : "movimentos"}.`;
  }

  function responder(mensagem: string) {
    const pergunta = perguntaDe(mensagem);
    if (pergunta) {
      nova({ de: "assistente", texto: responderPergunta(pergunta) });
      return;
    }
    const propostas = interpretar(mensagem, hoje, categorias, { inicio: INICIO_DEMO });
    if (!propostas.length) {
      nova({ de: "assistente", texto: "Não encontrei um valor nessa mensagem. Tente algo como “gastei 18 de ônibus e 32 no almoço”." });
      return;
    }
    nova({
      de: "assistente",
      texto: propostas.length === 1 ? "Entendi assim. Confira e confirme:" : `Encontrei ${propostas.length} movimentos. Confira cada um:`,
      cartoes: cartoesDe(propostas),
    });
  }

  function enviar(mensagem: string) {
    const limpa = mensagem.trim();
    if (!limpa || pensando) {
      return;
    }
    nova({ de: "eu", texto: limpa });
    setTexto("");
    setPensando(true);
    window.setTimeout(() => {
      setPensando(false);
      responder(limpa);
    }, 500);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    enviar(texto);
  }

  // No protótipo, qualquer foto vira o mesmo cupom lido.
  function anexar(nome: string | undefined) {
    if (!nome || pensando) {
      return;
    }
    nova({ de: "eu", anexo: nome });
    setPensando(true);
    window.setTimeout(() => {
      setPensando(false);
      nova({
        de: "assistente",
        texto: "Li o comprovante. O valor e a data vieram do cupom; confira a categoria:",
        cartoes: cartoesDe(
          [{ tipo: "saida", valorMinor: 4790, moeda: "BRL", meio: "conta", categoriaId: "alimentacao", data: hoje, descricao: "Supermercado Bom Preço", revisar: true }],
          nome,
        ),
      });
    }, 900);
  }

  function ditar() {
    if (ouvindo || pensando) {
      return;
    }
    setOuvindo(true);
    window.setTimeout(() => {
      setOuvindo(false);
      setTexto(DITADO);
    }, 1200);
  }

  function marcar(id: string, mudou: Partial<Cartao>) {
    setMensagens((atual) =>
      atual.map((mensagem) =>
        mensagem.cartoes ? { ...mensagem, cartoes: mensagem.cartoes.map((cartao) => (cartao.id === id ? { ...cartao, ...mudou } : cartao)) } : mensagem,
      ),
    );
  }

  function rascunhoDe(cartao: Cartao) {
    return {
      projetoId: destino,
      tipo: cartao.tipo,
      valorMinor: cartao.valorMinor,
      moeda: cartao.moeda,
      meio: cartao.meio,
      categoriaId: cartao.categoriaId,
      data: cartao.data,
      descricao: cartao.descricao,
      responsavel: eu.nome,
      origem: "assistente" as const,
      pendente: false,
      comprovante: cartao.comprovante,
    };
  }

  function confirmar(cartao: Cartao) {
    salvar(rascunhoDe(cartao));
    marcar(cartao.id, { estado: "confirmada", salvoEm: doEscopo.find((projeto) => projeto.id === destino)?.nome ?? escopoNome });
  }

  // O cartão continua aberto enquanto o formulário não salva: quem cancela lá
  // volta a ter aqui o Confirmar e o Editar. Salvo, o cartão mostra o que ficou.
  function editar(cartao: Cartao) {
    abrirEditor(rascunhoDe(cartao), (mov) =>
      marcar(cartao.id, {
        estado: "confirmada",
        salvoEm: projeto(mov.projetoId)?.nome ?? escopoNome,
        valorMinor: mov.valorMinor,
        moeda: mov.moeda,
        meio: mov.meio,
        data: mov.data,
        descricao: mov.descricao,
        comprovante: mov.comprovante ?? null,
        ...(mov.tipo === "saida" || mov.tipo === "entrada" ? { tipo: mov.tipo, categoriaId: mov.categoriaId ?? cartao.categoriaId } : {}),
      }),
    );
  }

  const selectDestino = "h-9 min-w-0 flex-1 rounded-full border border-input bg-card px-3 text-sm font-medium text-foreground";
  const iconeBotao =
    "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary-deep disabled:pointer-events-none disabled:opacity-40";

  return (
    <Sheet open={assistenteAberto} onOpenChange={setAssistenteAberto}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="space-y-0.5 border-b border-border/60 px-5 py-4 pr-12 text-left">
          <SheetTitle className="flex items-center gap-2 font-display text-xl font-semibold text-primary-deep">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            Assistente
          </SheetTitle>
          <SheetDescription>Escreva, fale ou fotografe o comprovante. Nada é salvo sem você confirmar.</SheetDescription>
        </SheetHeader>

        {doEscopo.length > 1 ? (
          <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-5 py-2.5">
            <label htmlFor="assistente-destino" className="shrink-0 text-xs font-semibold text-muted-foreground">
              Lançar em
            </label>
            <select id="assistente-destino" className={selectDestino} value={destino} onChange={(event) => setDestinoId(event.target.value)}>
              {doEscopo.map((projeto) => (
                <option key={projeto.id} value={projeto.id}>
                  {projeto.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {mensagens.length === 0 ? (
            <div className="pt-4">
              <p className="font-display text-2xl font-semibold leading-tight text-primary-deep">Olá, {primeiroNome}.</p>
              <p className="mt-1 text-muted-foreground">Diga um gasto ou envie um comprovante. Eu preencho o movimento e você confirma.</p>
              <div className="mt-5 flex flex-col items-start gap-2">
                {SUGESTOES.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() => enviar(sugestao)}
                    className="cursor-pointer rounded-2xl border border-border/70 bg-card px-3.5 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-secondary"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mensagens.map((mensagem) =>
            mensagem.de === "eu" ? (
              <div key={mensagem.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                  {mensagem.anexo ? (
                    <span className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{mensagem.anexo}</span>
                    </span>
                  ) : (
                    mensagem.texto
                  )}
                </div>
              </div>
            ) : (
              <div key={mensagem.id} className="space-y-2.5">
                {mensagem.texto ? <p className="max-w-[92%] whitespace-pre-line text-sm leading-relaxed text-foreground">{mensagem.texto}</p> : null}
                {mensagem.cartoes?.map((cartao) => (
                  <article key={cartao.id} className={cn("rounded-2xl border border-border/70 bg-card p-4", cartao.estado === "descartada" && "opacity-55")}>
                    <div className="flex items-start gap-3">
                      <CatIcone tipo={cartao.tipo} categoria={categoria(cartao.categoriaId)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{cartao.tipo === "entrada" ? "Entrada" : "Gasto"}</p>
                        <p className={cn("font-display text-2xl font-semibold tabular-nums", cartao.tipo === "entrada" ? corEntrada : "text-primary-deep")}>
                          {fmtMoeda(cartao.tipo === "entrada" ? cartao.valorMinor : -cartao.valorMinor, cartao.moeda, { sinal: true })}
                        </p>
                      </div>
                      {cartao.revisar && cartao.estado === "aberta" ? <Etiqueta tom="aviso">Revisar</Etiqueta> : null}
                    </div>
                    <dl className="mt-3 divide-y divide-dashed divide-border text-sm">
                      {[
                        ["Descrição", cartao.descricao],
                        ["Categoria", categoria(cartao.categoriaId)?.nome ?? "Outros"],
                        ["Moeda", `${MOEDAS[cartao.moeda].nome} · ${MEIO_NOME[cartao.meio]}`],
                        ["Data", cartao.data === hoje ? "Hoje" : cartao.data === addDays(hoje, -1) ? "Ontem" : fmtDia(cartao.data)],
                        ...(cartao.comprovante ? [["Comprovante", cartao.comprovante]] : []),
                      ].map(([rotulo, valor]) => (
                        <div key={rotulo} className="flex items-baseline justify-between gap-4 py-1.5">
                          <dt className="shrink-0 text-muted-foreground">{rotulo}</dt>
                          <dd className="min-w-0 truncate text-right font-medium text-foreground">{valor}</dd>
                        </div>
                      ))}
                    </dl>
                    {cartao.estado === "aberta" ? (
                      <div className="mt-3 flex items-center gap-2">
                        <Button type="button" size="sm" className="rounded-full" onClick={() => confirmar(cartao)}>
                          <Check className="h-4 w-4" aria-hidden />
                          Confirmar
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => editar(cartao)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Editar
                        </Button>
                        <button type="button" className={cn(iconeBotao, "ml-auto h-8 w-8")} aria-label="Descartar" onClick={() => marcar(cartao.id, { estado: "descartada" })}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        {cartao.estado === "confirmada" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-mint-foreground dark:text-mint" aria-hidden />
                            Salvo em {cartao.salvoEm ?? escopoNome}
                          </>
                        ) : (
                          "Descartado"
                        )}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ),
          )}

          {pensando ? (
            <div className="flex items-center gap-1.5 py-1" role="status" aria-label="O assistente está escrevendo">
              {[0, 1, 2].map((ponto) => (
                <span key={ponto} className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50" style={{ animationDelay: `${ponto * 160}ms` }} />
              ))}
            </div>
          ) : null}
          <div ref={fim} />
        </div>

        <form onSubmit={submit} className="border-t border-border/60 px-3 pb-3 pt-2.5">
          <div className="flex items-center gap-1 rounded-3xl border border-input bg-card py-1 pl-1 pr-1.5 focus-within:ring-2 focus-within:ring-ring">
            <button type="button" className={iconeBotao} aria-label="Anexar comprovante" disabled={pensando} onClick={() => arquivo.current?.click()}>
              <Paperclip className="h-[18px] w-[18px]" />
            </button>
            <button type="button" className={cn(iconeBotao, "sm:hidden")} aria-label="Tirar foto" disabled={pensando} onClick={() => camera.current?.click()}>
              <Camera className="h-[18px] w-[18px]" />
            </button>
            <input
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              placeholder={ouvindo ? "Ouvindo…" : "Gastei 18 de ônibus…"}
              aria-label="Mensagem para o assistente"
              className="h-10 min-w-0 flex-1 bg-transparent px-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {texto.trim() ? (
              <button type="submit" aria-label="Enviar" disabled={pensando} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" className={cn(iconeBotao, ouvindo && "bg-coral/15 text-coral")} aria-label="Ditar" aria-pressed={ouvindo} onClick={ditar}>
                <Mic className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
          <p className="mt-2 px-2 text-center text-[11px] text-muted-foreground">Protótipo: a foto e o áudio são simulados.</p>
          <input ref={arquivo} type="file" accept="image/*,application/pdf" className="hidden" onChange={(event) => { anexar(event.target.files?.[0]?.name); event.target.value = ""; }} />
          <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { anexar(event.target.files?.[0]?.name); event.target.value = ""; }} />
        </form>
      </SheetContent>
    </Sheet>
  );
}
