"use client";

import { Check, Copy, Plus, Send, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { describeError } from "@/components/academy/use-api";
import { useApi } from "@/components/academy/use-api";
import { useLocale } from "@/components/academy/locale-provider";
import { Card, EstadoChip, Eyebrow, Failed, LoadingBlock, MoneyInput, Reais, centsOf } from "@/components/painel/bits";
import { CatIcone } from "@/components/painel/contabilidade/pieces";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SessionPayload } from "@/lib/academy/auth";
import { api } from "@/lib/academy/api-client";
import { CATEGORIAS_DESPESA, categoriaDespesa } from "@/lib/hj/contabilidade";
import { fmtDia, fmtDiaNumero, isIsoDay } from "@/lib/hj/dates";
import { fmtReais, liquido } from "@/lib/hj/rm";
import type { MeusRelatorios, RelatorioRow, RmResumo } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

// One line of the day's expenses: a category of the accounting list and what was typed.
type Despesa = { categoria: string; valor: string };

type Form = { dinheiro: string; pix: string; despesas: Despesa[]; itens: string; contatos: string; observacoes: string };

// What almost every day has (Bonn Yoo, 14/11/2026); the rest of the list is added when needed.
const SEMPRE = ["transporte", "alimentacao"];

const reais = (cents: number) => (cents === 0 ? "" : cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ","));

function despesasOf(row: RelatorioRow | null): Despesa[] {
  const itens = row?.despesasItens ?? [];
  const ids = [...SEMPRE, ...itens.map((item) => item.categoria).filter((id) => !SEMPRE.includes(id))];
  return ids.map((categoria) => ({ categoria, valor: reais(itens.find((item) => item.categoria === categoria)?.valorCents ?? 0) }));
}

const blank: Form = { dinheiro: "", pix: "", despesas: despesasOf(null), itens: "", contatos: "", observacoes: "" };

function formOf(row: RelatorioRow | null): Form {
  if (!row) return blank;
  return {
    dinheiro: reais(row.dinheiroCents),
    pix: reais(row.pixCents),
    despesas: despesasOf(row),
    itens: row.itens ? String(row.itens) : "",
    contatos: row.contatos ? String(row.contatos) : "",
    observacoes: row.observacoes,
  };
}

// The RM report: the WhatsApp message's fields, one day at a time. `?dia=`
// opens a past day (to correct one the captain sent back).
export function RelatorioScreen({ session }: { session: SessionPayload }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const mine = useApi<MeusRelatorios>("/api/painel/relatorios");
  const [form, setForm] = useState<Form>(blank);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const hoje = mine.data?.projeto?.hoje ?? "";
  const diaParam = params.get("dia");
  const dia = diaParam && isIsoDay(diaParam) ? diaParam : hoje;
  const existing = useMemo(() => mine.data?.relatorios.find((row) => row.data === dia) ?? null, [mine.data, dia]);
  const rm: RmResumo | null = mine.data?.rm ?? null;

  // The form follows the day on screen: a new day (or a fresh answer for
  // the same day) replaces what was typed. Adjusted during render, the way
  // React derives state from props, so no effect is involved.
  const formKey = existing ? `${existing.id}:${existing.enviadoEm}` : `novo:${dia}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  if (mine.data && loadedKey !== formKey) {
    setLoadedKey(formKey);
    setForm(formOf(existing));
  }

  if (mine.error) {
    return <Failed error={mine.error} onRetry={mine.reload} />;
  }
  if (mine.loading || !mine.data) {
    return <LoadingBlock />;
  }

  const { projeto, relatorios } = mine.data;
  if (!projeto) {
    return (
      <>
        <PainelHeading title={t.relatorio.title} />
        <Card>{t.common.noProject}</Card>
      </>
    );
  }

  const dinheiro = centsOf(form.dinheiro);
  const pix = centsOf(form.pix);
  const despesasCents = form.despesas.map((item) => centsOf(item.valor));
  const despesas = despesasCents.some((value) => value === null) ? null : despesasCents.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const despesasItens = form.despesas
    .map((item, index) => ({ categoria: item.categoria, valorCents: despesasCents[index] ?? 0 }))
    .filter((item) => item.valorCents > 0);
  const outrasCategorias = CATEGORIAS_DESPESA.filter((item) => !form.despesas.some((row) => row.categoria === item.id));
  const temExtras = form.despesas.some((item) => !SEMPRE.includes(item.categoria));
  const setDespesa = (categoria: string, valor: string) =>
    setForm({ ...form, despesas: form.despesas.map((item) => (item.categoria === categoria ? { ...item, valor } : item)) });
  const invalid = dinheiro === null || pix === null || despesas === null;
  const liquidoCents = invalid ? 0 : liquido(dinheiro, pix, despesas);
  const locked = existing?.estado === "validado";
  const descanso = projeto.diasDescanso.includes(dia);

  const whatsapp = [
    `RM ${fmtDiaNumero(dia)} – ${session.fullName}`,
    `Dinheiro: ${fmtReais(dinheiro ?? 0, { centavos: true })}`,
    `Pix: ${fmtReais(pix ?? 0, { centavos: true })}`,
    `Despesas: ${fmtReais(despesas ?? 0, { centavos: true })}`,
    ...despesasItens.map((item) => `  · ${categoriaDespesa(item.categoria).nome}: ${fmtReais(item.valorCents, { centavos: true })}`),
    `Líquido: ${fmtReais(liquidoCents, { centavos: true })}`,
    form.itens || form.contatos ? `Itens: ${form.itens || 0} · Contatos: ${form.contatos || 0}` : null,
    form.observacoes ? `Obs: ${form.observacoes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (invalid) {
      toast.error("Confira os valores: use números como 350 ou 1.250");
      return;
    }
    setSending(true);
    try {
      const reply = await api<{ relatorio: RelatorioRow; reenviado: boolean }>("/api/painel/relatorios", {
        method: "POST",
        body: {
          data: dia,
          dinheiroCents: dinheiro,
          pixCents: pix,
          despesasItens,
          itens: Number(form.itens) || 0,
          contatos: Number(form.contatos) || 0,
          observacoes: form.observacoes,
        },
      });
      toast.success(reply.reenviado ? t.relatorio.resent : t.relatorio.sent);
      mine.reload();
      if (diaParam) router.replace("/painel/arrecadacao");
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setSending(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(whatsapp);
      setCopied(true);
      toast.success(t.relatorio.copied);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.common.error);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PainelHeading
        eyebrow={`${t.nav.arrecadacao} · ${projeto.nome}`}
        title={t.relatorio.title}
        description={projeto.ativo ? `${fmtDia(dia, "longo")} · ${t.common.day(projeto.diaAtual, projeto.totalDias)}${descanso ? ` · ${t.common.rest}` : ""}` : `${fmtDia(dia, "longo")} · ${t.relatorio.projectOffShort}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {projeto.ativo ? (
        <Card>
          {existing ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <EstadoChip estado={existing.estado} />
              {existing.estado === "devolvido" ? (
                <span className="text-foreground">
                  {t.relatorio.returnedReason}: <q>{existing.motivoDevolucao}</q>
                </span>
              ) : existing.estado === "validado" ? (
                <span className="text-muted-foreground">{t.relatorio.alreadyValidated}</span>
              ) : null}
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">{t.relatorio.description}</p>
          )}

          <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={locked || sending} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dinheiro">{t.relatorio.dinheiro}</Label>
                <MoneyInput id="dinheiro" value={form.dinheiro} onChange={(dinheiro) => setForm({ ...form, dinheiro })} invalid={dinheiro === null} autoFocus={!existing} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pix">{t.relatorio.pix}</Label>
                <MoneyInput id="pix" value={form.pix} onChange={(pix) => setForm({ ...form, pix })} invalid={pix === null} />
              </div>
            </fieldset>
            <p className="text-xs text-muted-foreground">{t.relatorio.numbersHint}</p>

            <fieldset disabled={locked || sending} className="min-w-0 rounded-2xl border border-border/70 px-3 pb-3 pt-3.5 sm:px-4">
              <legend className="sr-only">{t.relatorio.despesasTitle}</legend>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-primary-deep">{t.relatorio.despesasTitle}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{fmtReais(despesas ?? 0, { centavos: true })}</span>
              </div>
              <ul className="mt-1 divide-y divide-border/60">
                {form.despesas.map((item, index) => {
                  const categoria = categoriaDespesa(item.categoria);
                  return (
                    <li key={item.categoria} className="flex items-center gap-2 py-2.5 sm:gap-3">
                      <CatIcone tipo="saida" categoria={categoria} className="h-8 w-8 rounded-xl sm:h-9 sm:w-9" />
                      <Label htmlFor={`despesa-${item.categoria}`} className="min-w-0 flex-1 break-words text-sm font-medium leading-snug">
                        {categoria.nome}
                      </Label>
                      <div className="w-28 shrink-0 sm:w-40">
                        <MoneyInput
                          id={`despesa-${item.categoria}`}
                          value={item.valor}
                          onChange={(valor) => setDespesa(item.categoria, valor)}
                          invalid={despesasCents[index] === null}
                        />
                      </div>
                      {SEMPRE.includes(item.categoria) ? (
                        temExtras ? <span className="w-8 shrink-0" aria-hidden /> : null
                      ) : (
                        <button
                          type="button"
                          aria-label={t.relatorio.removeDespesa(categoria.nome)}
                          onClick={() => setForm({ ...form, despesas: form.despesas.filter((row) => row.categoria !== item.categoria) })}
                          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary-deep disabled:pointer-events-none disabled:opacity-50"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {!locked && outrasCategorias.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="-ml-2 mt-1 rounded-full text-primary-deep">
                      <Plus className="h-4 w-4" aria-hidden />
                      {t.relatorio.addDespesa}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 rounded-2xl p-1.5">
                    {outrasCategorias.map((categoria) => (
                      <DropdownMenuItem
                        key={categoria.id}
                        onSelect={() => setForm({ ...form, despesas: [...form.despesas, { categoria: categoria.id, valor: "" }] })}
                        className="cursor-pointer gap-3 rounded-xl px-2 py-1.5"
                      >
                        <CatIcone tipo="saida" categoria={categoria} className="h-8 w-8 rounded-xl" />
                        <span className="min-w-0 flex-1 text-sm font-medium">{categoria.nome}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">{t.relatorio.despesasHint}</p>
            </fieldset>

            <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3">
              <span className="text-sm font-medium text-primary-deep">{t.relatorio.liquido}</span>
              <span className={cn("font-display text-2xl font-semibold tabular-nums", liquidoCents < 0 ? "text-destructive" : "text-primary-deep")}>
                {fmtReais(liquidoCents, { centavos: true })}
              </span>
            </div>

            <fieldset disabled={locked || sending} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="itens">{t.relatorio.itens}</Label>
                <Input id="itens" inputMode="numeric" value={form.itens} onChange={(event) => setForm({ ...form, itens: event.target.value.replace(/\D/g, "") })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contatos">{t.relatorio.contatos}</Label>
                <Input id="contatos" inputMode="numeric" value={form.contatos} onChange={(event) => setForm({ ...form, contatos: event.target.value.replace(/\D/g, "") })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="observacoes">{t.relatorio.observacoes}</Label>
                <Textarea id="observacoes" rows={2} value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} className="rounded-xl" />
              </div>
            </fieldset>

            {!locked ? (
              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="h-11 rounded-full px-6" disabled={sending || invalid}>
                  <Send className="h-4 w-4" />
                  {sending ? t.relatorio.sending : existing ? t.relatorio.resend : t.relatorio.send}
                </Button>
                <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => void copy()}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {t.relatorio.copy}
                </Button>
              </div>
            ) : null}
          </form>
        </Card>
        ) : (
          <Card className="self-start text-sm text-muted-foreground">{t.relatorio.projectOff}</Card>
        )}

        <div className="space-y-6">
          {rm ? (
            <Card className="space-y-3">
              <Eyebrow>{t.inicio.goal}</Eyebrow>
              <p className="font-display text-3xl font-semibold text-primary-deep tabular-nums">{fmtReais(rm.metaCents)}</p>
              <p className="text-sm text-muted-foreground">{t.inicio.goalHint(fmtReais(rm.mediaCents), fmtReais(rm.recordeCents))}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.inicio.totalProject}</span>
                <Reais cents={rm.totalCents} className="font-bold" />
              </div>
            </Card>
          ) : null}

          <Card>
            <Eyebrow className="mb-3">{t.relatorio.history}</Eyebrow>
            {relatorios.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.relatorio.noHistory}</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {relatorios.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => router.replace(row.data === hoje ? "/painel/arrecadacao" : `/painel/arrecadacao?dia=${row.data}`)}
                      className={cn("flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm", row.data === dia && "text-primary-deep")}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn("w-24 whitespace-nowrap tabular-nums", row.data === dia && "font-semibold")}>{fmtDia(row.data)}</span>
                        <EstadoChip estado={row.estado} />
                      </span>
                      <Reais cents={row.liquidoCents} className="font-semibold" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
