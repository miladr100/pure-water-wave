"use client";

import { ArrowDown, Loader2, Paperclip, Trash2, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fmtMoeda, MEIO_NOME, MOEDAS, parseValor, valorParaCampo, type Comprovante, type Meio, type Moeda, type Movimento, type MovimentoNovo } from "@/lib/hj/contabilidade";
import { addDays } from "@/lib/hj/dates";
import { cn } from "@/lib/utils";

import { campo, corDe, ICONES, Segmentado } from "./pieces";
import { urlComprovante, useContabilidade, type Rascunho } from "./store";

const DATA_MINIMA = "2020-01-01";
const erroDe = (error: unknown, padrao: string) => (error instanceof Error && error.message ? error.message : padrao);

// O formulário de um movimento: gasto, entrada ou transferência. Serve para
// lançar um novo, para conferir o que o assistente propôs e para editar.

type Tipo = "saida" | "entrada" | "transferencia";

const TIPOS: { value: Tipo; label: string }[] = [
  { value: "saida", label: "Gasto" },
  { value: "entrada", label: "Entrada" },
  { value: "transferencia", label: "Transferência" },
];

const MEIOS: { value: Meio; label: string }[] = [
  { value: "dinheiro", label: MEIO_NOME.dinheiro },
  { value: "conta", label: MEIO_NOME.conta },
];

const FEITO: Record<Tipo, string> = {
  saida: "Gasto registrado",
  entrada: "Entrada registrada",
  transferencia: "Transferência registrada",
};

export function MovimentoDialog({ rascunho, aoSalvar }: { rascunho: Rascunho; aoSalvar?: (mov: Movimento) => void }) {
  const { doEscopo, combinado, moedas, categorias, pessoas, eu, hoje, salvar, remover, restaurar, fecharEditor, abrirEditor, enviarComprovante } = useContabilidade();
  const editando = Boolean(rascunho.id);
  const arquivo = useRef<HTMLInputElement>(null);

  const [tipo, setTipo] = useState<Tipo>(rascunho.tipo === "entrada" || rascunho.tipo === "transferencia" ? rascunho.tipo : "saida");
  const [projetoId, setProjetoId] = useState(rascunho.projetoId ?? (combinado ? "" : (doEscopo[0]?.id ?? "")));
  const [moeda, setMoeda] = useState<Moeda>(rascunho.moeda ?? "BRL");
  const [valor, setValor] = useState(rascunho.valorMinor ? valorParaCampo(Math.abs(rascunho.valorMinor), rascunho.moeda ?? "BRL") : "");
  const [meio, setMeio] = useState<Meio>(rascunho.meio ?? "dinheiro");
  const [categoriaId, setCategoriaId] = useState(rascunho.categoriaId ?? "");
  const [paraMoeda, setParaMoeda] = useState<Moeda>(rascunho.para?.moeda ?? rascunho.moeda ?? "BRL");
  const [paraMeio, setParaMeio] = useState<Meio>(rascunho.para?.meio ?? ((rascunho.meio ?? "dinheiro") === "dinheiro" ? "conta" : "dinheiro"));
  const [paraValor, setParaValor] = useState(rascunho.para ? valorParaCampo(rascunho.para.valorMinor, rascunho.para.moeda) : "");
  const [data, setData] = useState(rascunho.data ?? hoje);
  const [descricao, setDescricao] = useState(rascunho.descricao ?? "");
  const [responsavel, setResponsavel] = useState(rascunho.responsavel ?? eu.nome);
  const [comprovante, setComprovante] = useState<Comprovante | null>(rascunho.comprovante ?? null);
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pendente, setPendente] = useState(rascunho.pendente ?? false);

  const opcoesMoeda = moedas.includes(moeda) ? moedas : [...moedas, moeda];
  const doTipo = categorias.filter((item) => item.tipo === tipo);
  const nomes = pessoas(projetoId);
  const quem = nomes.includes(responsavel) ? nomes : [responsavel, ...nomes];
  const ontem = addDays(hoje, -1);

  const valorMinor = parseValor(valor, moeda);
  const cambio = tipo === "transferencia" && paraMoeda !== moeda;
  const recebido = cambio ? parseValor(paraValor, paraMoeda) : valorMinor;
  const mesmoLugar = tipo === "transferencia" && paraMoeda === moeda && paraMeio === meio;
  const categoriaOk = tipo === "transferencia" || doTipo.some((item) => item.id === categoriaId);
  const valido = Boolean(projetoId && valorMinor && categoriaOk && data >= DATA_MINIMA && data <= hoje && (tipo !== "transferencia" || (recebido && !mesmoLugar)));

  function trocarTipo(next: Tipo) {
    setTipo(next);
    setCategoriaId("");
  }

  function montar(): MovimentoNovo | null {
    if (!valido || !valorMinor) {
      return null;
    }
    const nome = categorias.find((item) => item.id === categoriaId)?.nome;
    return {
      projetoId,
      tipo,
      valorMinor,
      moeda,
      meio,
      categoriaId: tipo === "transferencia" ? null : categoriaId,
      data,
      descricao: descricao.trim() || (tipo === "transferencia" ? (cambio ? "Câmbio" : "Transferência") : (nome ?? "Movimento")),
      responsavel,
      origem: rascunho.origem ?? "manual",
      pendente,
      comprovante,
      ...(tipo === "transferencia" && recebido ? { para: { moeda: paraMoeda, meio: paraMeio, valorMinor: recebido } } : {}),
    };
  }

  async function submit(event: FormEvent, outro = false) {
    event.preventDefault();
    const novo = montar();
    if (!novo || salvando || enviando) {
      return;
    }
    setSalvando(true);
    try {
      const salvo = await salvar(novo, rascunho.id);
      aoSalvar?.(salvo);
      toast.success(editando ? "Movimento atualizado" : FEITO[tipo]);
      if (outro) {
        abrirEditor({ tipo, projetoId, moeda, meio, data, responsavel });
      } else {
        fecharEditor();
      }
    } catch (error) {
      toast.error(erroDe(error, "Não foi possível salvar o movimento"));
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!rascunho.id) {
      return;
    }
    try {
      const apagado = await remover(rascunho.id);
      fecharEditor();
      toast(
        "Movimento excluído",
        apagado
          ? {
              action: {
                label: "Desfazer",
                onClick: () => {
                  restaurar(apagado).catch(() => toast.error("Não foi possível desfazer"));
                },
              },
            }
          : undefined,
      );
    } catch (error) {
      toast.error(erroDe(error, "Não foi possível excluir"));
    }
  }

  async function anexar(arquivoEscolhido: File | undefined) {
    if (!arquivoEscolhido) {
      return;
    }
    if (!projetoId) {
      toast.error("Escolha a equipe antes de anexar o comprovante.");
      return;
    }
    setEnviando(true);
    try {
      setComprovante(await enviarComprovante(arquivoEscolhido, projetoId));
    } catch (error) {
      toast.error(erroDe(error, "Não foi possível anexar o comprovante"));
    } finally {
      setEnviando(false);
    }
  }

  // "1 US$ = R$ 5,42": a cotação que sai dos dois valores digitados
  let cotacao: string | null = null;
  if (cambio && valorMinor && recebido) {
    const saiu = valorMinor / 10 ** MOEDAS[moeda].decimais;
    const chegou = recebido / 10 ** MOEDAS[paraMoeda].decimais;
    const [forte, fraca, taxa] = saiu >= chegou ? [paraMoeda, moeda, saiu / chegou] : [moeda, paraMoeda, chegou / saiu];
    cotacao = `1 ${MOEDAS[forte].simbolo} = ${fmtMoeda(Math.round(taxa * 10 ** MOEDAS[fraca].decimais), fraca)}`;
  }

  const seletorMoeda = (id: string, value: Moeda, onChange: (moeda: Moeda) => void, opcoes: Moeda[]) =>
    opcoes.length > 1 ? (
      <select
        id={id}
        aria-label="Moeda"
        value={value}
        onChange={(event) => onChange(event.target.value as Moeda)}
        className="h-9 cursor-pointer rounded-full border border-border/70 bg-secondary px-3 text-sm font-semibold text-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {opcoes.map((item) => (
          <option key={item} value={item}>
            {MOEDAS[item].simbolo} · {MOEDAS[item].nome}
          </option>
        ))}
      </select>
    ) : (
      <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-primary-deep">{MOEDAS[value].simbolo}</span>
    );

  const caixaValor = "rounded-2xl border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring";
  const entradaValor =
    "min-w-0 flex-1 bg-transparent text-right font-display font-semibold tabular-nums text-primary-deep outline-none placeholder:text-muted-foreground/40";

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : fecharEditor())}>
      <DialogContent className="max-h-[92vh] grid-cols-[minmax(0,1fr)] overflow-y-auto overflow-x-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar movimento" : "Novo movimento"}</DialogTitle>
          <DialogDescription className="sr-only">Registre um gasto, uma entrada ou uma transferência.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <Segmentado full label="Tipo de movimento" value={tipo} onChange={trocarTipo} options={TIPOS} />

          {combinado || !projetoId ? (
            <div className="grid gap-1.5">
              <Label htmlFor="mv-projeto">Equipe</Label>
              <select id="mv-projeto" className={campo} value={projetoId} onChange={(event) => setProjetoId(event.target.value)}>
                <option value="">Escolha a contabilidade…</option>
                {doEscopo.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className={caixaValor}>
            <label htmlFor="mv-valor" className="text-xs font-semibold text-muted-foreground">
              {tipo === "transferencia" ? "Quanto sai" : "Valor"}
            </label>
            <div className="mt-1 flex items-center gap-3">
              {seletorMoeda("mv-moeda", moeda, setMoeda, opcoesMoeda)}
              <input
                id="mv-valor"
                inputMode="decimal"
                autoComplete="off"
                autoFocus={!editando}
                placeholder={MOEDAS[moeda].decimais ? "0,00" : "0"}
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                className={cn(entradaValor, "text-4xl")}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>{tipo === "transferencia" ? "Sai de" : tipo === "entrada" ? "Entrou em" : "Pago com"}</Label>
            <Segmentado full label="Meio" value={meio} onChange={setMeio} options={MEIOS} />
          </div>

          {tipo === "transferencia" ? (
            <div className="grid gap-3 rounded-2xl bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ArrowDown className="h-4 w-4" aria-hidden />
                Vai para
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {seletorMoeda("mv-para-moeda", paraMoeda, setParaMoeda, opcoesMoeda.includes(paraMoeda) ? opcoesMoeda : [...opcoesMoeda, paraMoeda])}
                <Segmentado label="Meio de destino" value={paraMeio} onChange={setParaMeio} options={MEIOS} className="bg-card" />
              </div>
              {cambio ? (
                <div className={caixaValor}>
                  <label htmlFor="mv-recebido" className="text-xs font-semibold text-muted-foreground">
                    Quanto chega
                  </label>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-sm font-semibold text-muted-foreground">{MOEDAS[paraMoeda].simbolo}</span>
                    <input
                      id="mv-recebido"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={MOEDAS[paraMoeda].decimais ? "0,00" : "0"}
                      value={paraValor}
                      onChange={(event) => setParaValor(event.target.value)}
                      className={cn(entradaValor, "text-2xl")}
                    />
                  </div>
                  {cotacao ? <p className="mt-1 text-right text-xs text-muted-foreground">Cotação: {cotacao}</p> : null}
                </div>
              ) : null}
              {mesmoLugar ? <p className="text-xs font-medium text-destructive">Escolha um destino diferente da origem.</p> : null}
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <div className="flex flex-wrap gap-2">
                {doTipo.map((item) => {
                  const Icon = ICONES[item.icone];
                  const ativa = item.id === categoriaId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={ativa}
                      onClick={() => setCategoriaId(item.id)}
                      className={cn(
                        "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60",
                        ativa && "border-primary bg-secondary font-semibold text-primary-deep",
                      )}
                    >
                      <Icon className="h-4 w-4" style={{ color: tipo === "saida" ? corDe(item) : undefined }} aria-hidden />
                      {item.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="mv-data">Data</Label>
              <div className="flex items-center gap-1.5">
                {[
                  { dia: hoje, nome: "Hoje" },
                  { dia: ontem, nome: "Ontem" },
                ].map((atalho) => (
                  <button
                    key={atalho.dia}
                    type="button"
                    aria-pressed={data === atalho.dia}
                    onClick={() => setData(atalho.dia)}
                    className={cn(
                      "h-11 cursor-pointer rounded-xl border border-input bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary-deep",
                      data === atalho.dia && "border-primary bg-secondary font-semibold text-primary-deep",
                    )}
                  >
                    {atalho.nome}
                  </button>
                ))}
                <input id="mv-data" type="date" min={DATA_MINIMA} max={hoje} value={data} onChange={(event) => setData(event.target.value)} className={cn(campo, "min-w-0 flex-1 px-2")} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mv-responsavel">Responsável</Label>
              <select id="mv-responsavel" className={campo} value={responsavel} onChange={(event) => setResponsavel(event.target.value)}>
                {quem.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="mv-descricao">Observação</Label>
            <input
              id="mv-descricao"
              className={campo}
              maxLength={120}
              placeholder={tipo === "entrada" ? "De onde veio" : tipo === "transferencia" ? "Ex.: depósito do dinheiro da semana" : "O que foi pago"}
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              ref={arquivo}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(event) => {
                void anexar(event.target.files?.[0]);
                // sem isto, escolher de novo o mesmo arquivo não avisa
                event.target.value = "";
              }}
            />
            {comprovante ? (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-secondary py-1 pl-3 pr-1 text-sm font-medium text-primary-deep">
                <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <a href={urlComprovante(comprovante)} target="_blank" rel="noreferrer" className="truncate underline-offset-2 hover:underline">
                  {comprovante.nome}
                </a>
                <button
                  type="button"
                  aria-label="Tirar o comprovante"
                  onClick={() => setComprovante(null)}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full hover:bg-card"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={enviando} onClick={() => arquivo.current?.click()}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Paperclip className="h-4 w-4" aria-hidden />}
                {enviando ? "Enviando…" : "Anexar comprovante"}
              </Button>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <Switch checked={pendente} onCheckedChange={setPendente} />
              Conferir depois
            </label>
          </div>

          <DialogFooter className="sticky -bottom-6 z-10 -mx-6 -mb-6 gap-2 border-t border-border/60 bg-background px-6 py-4 sm:items-center sm:justify-between">
            {editando ? (
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive sm:mr-auto" onClick={() => void excluir()}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Excluir
              </Button>
            ) : (
              <Button type="button" variant="ghost" disabled={!valido || salvando || enviando} className="sm:mr-auto" onClick={(event) => void submit(event, true)}>
                Salvar e adicionar outro
              </Button>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={fecharEditor}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!valido || salvando || enviando}>
                {salvando ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
