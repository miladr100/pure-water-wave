"use client";

import { Camera, Check, Loader2, Mic, Paperclip, Pencil, Send, Sparkles, Square, SquarePen, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { fmtMes, fmtMoeda, MEIO_NOME, MOEDAS, mesDe, saldos, somaMes, type Comprovante } from "@/lib/hj/contabilidade";
import { interpretar, perguntaDe, type Pergunta, type Proposta } from "@/lib/hj/contabilidade-assistente";
import { addDays, fmtDia } from "@/lib/hj/dates";
import { cn } from "@/lib/utils";

import { PainelFlutuante } from "./flutuante";
import { CatIcone, corEntrada, Etiqueta } from "./pieces";
import { apiForm, BASE_API, encolherFoto, urlComprovante, useContabilidade } from "./store";

// O assistente: a pessoa escreve, fala (nota de voz) ou fotografa o comprovante,
// e o servidor (Claude; o áudio passa antes pelo Whisper) devolve cartões de
// movimento para confirmar, ou responde perguntas sobre os números. Nada é
// salvo sem a pessoa confirmar cada cartão.

type Cartao = Proposta & {
  id: string;
  estado: "aberta" | "salvando" | "confirmada" | "descartada";
  comprovante: Comprovante | null;
  // a contabilidade em que foi salvo: o seletor pode mudar depois
  salvoEm?: string;
};
type Mensagem = { id: number; de: "eu" | "assistente"; texto?: string; cartoes?: Cartao[]; anexo?: string; voz?: boolean };

const SUGESTOES = [
  "Gastei 18 de ônibus e 32 no almoço",
  "Recebi 200 de doação no pix",
  "Quanto gastamos em transporte este mês?",
  "Qual é o saldo?",
];

// a nota de voz para sozinha aos dois minutos
const MAX_GRAVACAO_S = 120;

type Resposta = { texto: string; propostas: Proposta[]; comprovante?: Comprovante; transcricao?: string; semAudio?: boolean };

export function Assistente() {
  const {
    assistenteAberto,
    setAssistenteAberto,
    eu,
    hoje,
    inicio,
    doEscopo,
    escopoNome,
    movimentos,
    moedas,
    categorias,
    categoria,
    projeto,
    salvar,
    abrirEditor,
    assistenteIA,
  } = useContabilidade();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [gravando, setGravando] = useState<number | null>(null);
  const [destinoId, setDestinoId] = useState("");
  const conta = useRef(0);
  const fim = useRef<HTMLDivElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gravador = useRef<{ recorder: MediaRecorder; stream: MediaStream; partes: Blob[]; timer: number } | null>(null);

  const destino = doEscopo.some((item) => item.id === destinoId) ? destinoId : (doEscopo[0]?.id ?? "");
  const primeiroNome = eu.nome.split(" ")[0];
  const podeGravar = assistenteIA.audio && typeof window !== "undefined" && "MediaRecorder" in window && Boolean(navigator.mediaDevices?.getUserMedia);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens, pensando]);

  // fechar o painel no meio de uma gravação solta o microfone
  useEffect(() => {
    if (!assistenteAberto && gravador.current) {
      const atual = gravador.current;
      gravador.current = null;
      window.clearInterval(atual.timer);
      atual.recorder.onstop = null;
      atual.recorder.stop();
      atual.stream.getTracks().forEach((track) => track.stop());
      setGravando(null);
    }
  }, [assistenteAberto]);

  function nova(mensagem: Omit<Mensagem, "id">) {
    conta.current += 1;
    const id = conta.current;
    setMensagens((atual) => [...atual, { ...mensagem, id }]);
  }

  function cartoesDe(propostas: Proposta[], comprovante: Comprovante | null = null): Cartao[] {
    return propostas.map((proposta) => {
      conta.current += 1;
      return { ...proposta, id: `c${conta.current}`, estado: "aberta", comprovante };
    });
  }

  // Sem chave de IA no ambiente, o texto ainda é lido por regras aqui mesmo.
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

  function responderLocal(mensagem: string) {
    const pergunta = perguntaDe(mensagem);
    if (pergunta) {
      nova({ de: "assistente", texto: responderPergunta(pergunta) });
      return;
    }
    const propostas = interpretar(mensagem, hoje, categorias, { inicio });
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

  // Uma volta com o servidor: o texto, a foto ou o áudio vão juntos com a conversa até aqui.
  async function perguntar(partes: { mensagem?: string; foto?: File; audio?: Blob }) {
    const form = new FormData();
    form.append("livroId", destino);
    form.append("livroIds", doEscopo.map((item) => item.id).join(","));
    form.append(
      "historico",
      JSON.stringify(
        mensagens
          .filter((item) => item.texto)
          .slice(-8)
          .map((item) => ({ de: item.de, texto: item.texto })),
      ),
    );
    if (partes.mensagem) {
      form.append("mensagem", partes.mensagem);
    }
    if (partes.foto) {
      form.append("foto", await encolherFoto(partes.foto));
    }
    if (partes.audio) {
      form.append("audio", partes.audio, "nota");
    }
    return apiForm<Resposta>(`${BASE_API}/assistente`, form);
  }

  function mostrar(resposta: Resposta) {
    nova({
      de: "assistente",
      texto: resposta.texto,
      cartoes: resposta.propostas.length ? cartoesDe(resposta.propostas, resposta.comprovante ?? null) : undefined,
    });
  }

  const falhou = (error: unknown) =>
    nova({ de: "assistente", texto: error instanceof Error && error.message ? error.message : "O assistente não respondeu agora. Tente de novo." });

  async function enviar(mensagem: string) {
    const limpa = mensagem.trim();
    if (!limpa || pensando) {
      return;
    }
    nova({ de: "eu", texto: limpa });
    setTexto("");
    if (!assistenteIA.texto) {
      responderLocal(limpa);
      return;
    }
    setPensando(true);
    try {
      mostrar(await perguntar({ mensagem: limpa }));
    } catch (error) {
      falhou(error);
    } finally {
      setPensando(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void enviar(texto);
  }

  async function anexar(foto: File | undefined) {
    if (!foto || pensando) {
      return;
    }
    if (!assistenteIA.foto) {
      nova({ de: "assistente", texto: "A leitura de comprovantes ainda não está ligada neste ambiente. Use “+ Novo” e anexe a foto ao movimento." });
      return;
    }
    nova({ de: "eu", anexo: foto.name || "Foto", texto: texto.trim() || undefined });
    const junto = texto.trim();
    setTexto("");
    setPensando(true);
    try {
      mostrar(await perguntar({ foto, mensagem: junto || undefined }));
    } catch (error) {
      falhou(error);
    } finally {
      setPensando(false);
    }
  }

  async function gravar() {
    if (pensando) {
      return;
    }
    if (gravador.current) {
      parar();
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      nova({ de: "assistente", texto: "Não tenho acesso ao microfone. Libere o microfone para este site e tente de novo, ou escreva." });
      return;
    }
    const tipo = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((item) => MediaRecorder.isTypeSupported(item));
    const recorder = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    const partes: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) {
        partes.push(event.data);
      }
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const audio = new Blob(partes, { type: recorder.mimeType || "audio/webm" });
      void enviarAudio(audio);
    };
    // conta em quartos de segundo: basta para o relógio e para o limite
    let quartos = 0;
    const timer = window.setInterval(() => {
      quartos += 1;
      const segundos = Math.floor(quartos / 4);
      setGravando(segundos);
      if (segundos >= MAX_GRAVACAO_S) {
        parar();
      }
    }, 250);
    gravador.current = { recorder, stream, partes, timer };
    recorder.start();
    setGravando(0);
  }

  function parar() {
    const atual = gravador.current;
    if (!atual) {
      return;
    }
    gravador.current = null;
    window.clearInterval(atual.timer);
    setGravando(null);
    atual.recorder.stop();
  }

  async function enviarAudio(audio: Blob) {
    if (audio.size < 1000) {
      nova({ de: "assistente", texto: "O áudio ficou curto demais. Segure um pouco mais e fale." });
      return;
    }
    setPensando(true);
    try {
      const resposta = await perguntar({ audio });
      if (resposta.transcricao) {
        nova({ de: "eu", texto: resposta.transcricao, voz: true });
      }
      mostrar(resposta);
    } catch (error) {
      falhou(error);
    } finally {
      setPensando(false);
    }
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

  async function confirmar(cartao: Cartao) {
    marcar(cartao.id, { estado: "salvando" });
    try {
      const mov = await salvar(rascunhoDe(cartao));
      marcar(cartao.id, { estado: "confirmada", salvoEm: projeto(mov.projetoId)?.nome ?? escopoNome });
    } catch (error) {
      marcar(cartao.id, { estado: "aberta" });
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar");
    }
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
    !assistenteAberto ? null : (
    <PainelFlutuante
      onFechar={() => setAssistenteAberto(false)}
      titulo={
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-primary-deep">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            Assistente
          </p>
      }
      acoes={
        mensagens.length ? (
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary-deep disabled:opacity-40"
            aria-label="Nova conversa"
            title="Nova conversa"
            disabled={pensando || gravando !== null}
            onClick={() => setMensagens([])}
          >
            <SquarePen className="h-4 w-4" />
          </button>
        ) : null
      }
    >
      {(cheio) => (
      <>

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

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className={cn("space-y-4", cheio && "mx-auto max-w-[680px]")}>
          {mensagens.length === 0 ? (
            <div className="pt-4">
              <p className="font-display text-2xl font-semibold leading-tight text-primary-deep">Olá, {primeiroNome}.</p>
              <p className="mt-1 text-muted-foreground">Diga um gasto, fale ou envie a foto de um comprovante. Eu preencho o movimento e você confirma: nada é salvo sem você.</p>
              <div className="mt-5 flex flex-col items-start gap-2">
                {SUGESTOES.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() => void enviar(sugestao)}
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
                  ) : null}
                  {mensagem.texto ? (
                    <span className={cn("flex items-start gap-2", mensagem.anexo && "mt-1")}>
                      {mensagem.voz ? <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-label="Nota de voz" /> : null}
                      <span>{mensagem.texto}</span>
                    </span>
                  ) : null}
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
                        ...(cartao.comprovante
                          ? [
                              [
                                "Comprovante",
                                <a key="c" href={urlComprovante(cartao.comprovante)} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
                                  {cartao.comprovante.nome}
                                </a>,
                              ] as const,
                            ]
                          : []),
                      ].map(([rotulo, valor]) => (
                        <div key={rotulo} className="flex items-baseline justify-between gap-4 py-1.5">
                          <dt className="shrink-0 text-muted-foreground">{rotulo}</dt>
                          <dd className="min-w-0 truncate text-right font-medium text-foreground">{valor}</dd>
                        </div>
                      ))}
                    </dl>
                    {cartao.estado === "aberta" || cartao.estado === "salvando" ? (
                      <div className="mt-3 flex items-center gap-2">
                        <Button type="button" size="sm" className="rounded-full" disabled={cartao.estado === "salvando"} onClick={() => void confirmar(cartao)}>
                          {cartao.estado === "salvando" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                          Confirmar
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={cartao.estado === "salvando"} onClick={() => editar(cartao)}>
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
        </div>

        <form onSubmit={submit} className={cn("w-full border-t border-border/60 px-3 pb-3 pt-2.5", cheio && "sm:px-[max(0.75rem,calc((100%-680px)/2))]")}>
          <div className="flex items-center gap-1 rounded-3xl border border-input bg-card py-1 pl-1 pr-1.5 focus-within:ring-2 focus-within:ring-ring">
            <button type="button" className={iconeBotao} aria-label="Anexar comprovante" disabled={pensando || gravando !== null} onClick={() => arquivo.current?.click()}>
              <Paperclip className="h-[18px] w-[18px]" />
            </button>
            <button type="button" className={cn(iconeBotao, "sm:hidden")} aria-label="Tirar foto" disabled={pensando || gravando !== null} onClick={() => camera.current?.click()}>
              <Camera className="h-[18px] w-[18px]" />
            </button>
            <input
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              placeholder={gravando !== null ? `Gravando… ${Math.floor(gravando / 60)}:${String(gravando % 60).padStart(2, "0")} — toque no quadrado para enviar` : "Gastei 18 de ônibus…"}
              disabled={gravando !== null}
              aria-label="Mensagem para o assistente"
              className="h-10 min-w-0 flex-1 bg-transparent px-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {texto.trim() ? (
              <button type="submit" aria-label="Enviar" disabled={pensando} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            ) : podeGravar ? (
              <button
                type="button"
                className={cn(iconeBotao, gravando !== null && "bg-coral/15 text-coral")}
                aria-label={gravando !== null ? "Parar e enviar a nota de voz" : "Gravar nota de voz"}
                aria-pressed={gravando !== null}
                disabled={pensando}
                onClick={() => void gravar()}
              >
                {gravando !== null ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-[18px] w-[18px]" />}
              </button>
            ) : null}
          </div>
          {!assistenteIA.texto ? (
            <p className="mt-2 px-2 text-center text-[11px] text-muted-foreground">A IA não está ligada neste ambiente: o texto é lido por regras, sem foto nem áudio.</p>
          ) : null}
          <input
            ref={arquivo}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(event) => {
              void anexar(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <input
            ref={camera}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              void anexar(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </form>
      </>
      )}
    </PainelFlutuante>
    )
  );
}
