"use client";

import { ArrowDownLeft, ArrowUpRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { Card, Eyebrow, Failed, LoadingBlock, MoneyInput, Reais, centsOf } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/academy/api-client";
import { addDays, fmtDia } from "@/lib/hj/dates";
import { fmtReais } from "@/lib/hj/rm";
import { LANCAMENTO_CATEGORIAS, type CaixaEquipe, type LancamentoBody, type LancamentoCategoria, type LancamentoTipo } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// The team's cash box: balance, in and out, the movements, and the stay
// fee the captain posts per period. The captain and the team's educator
// post; the rest of the team reads. `equipeId` is the educator's pick.
export function CaixaScreen({ equipeId, backHref }: { equipeId?: string; backHref?: string }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const path = `/api/painel/caixa${equipeId ? `?equipe=${equipeId}` : ""}`;
  const caixa = useApi<CaixaEquipe>(path);
  const [adding, setAdding] = useState(false);
  const [staying, setStaying] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  if (caixa.error) {
    if (caixa.error.code === "NO_TEAM") {
      return (
        <div className="space-y-6">
          <PainelHeading eyebrow={t.nav.testemunho} title={t.caixa.title} />
          <Card>
            <p className="text-muted-foreground">{t.caixa.noTeam}</p>
          </Card>
        </div>
      );
    }
    return <Failed error={caixa.error} onRetry={caixa.reload} />;
  }
  if (caixa.loading || !caixa.data) {
    return <LoadingBlock />;
  }
  const data = caixa.data;

  async function remove(id: string) {
    if (!window.confirm(t.caixa.deleteConfirm)) return;
    setBusy(id);
    try {
      await api(`${path}${path.includes("?") ? "&" : "?"}lancamento=${id}`, { method: "DELETE" });
      toast.success(t.caixa.deleted);
      caixa.reload();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {backHref ? (
        <Link href={backHref} className="text-sm text-muted-foreground hover:text-primary-deep">
          ← {t.common.back}
        </Link>
      ) : null}
      <PainelHeading
        eyebrow={`${t.nav.testemunho} · ${data.equipe.nome}`}
        title={t.caixa.title}
        description={data.projeto ? `${data.projeto.nome} · ${fmtDia(data.projeto.inicio)} – ${fmtDia(data.projeto.fim)}` : t.caixa.body}
        actions={
          data.podeLancar ? (
            <>
              <Button variant="outline" className="rounded-full" onClick={() => setStaying(true)} disabled={data.equipe.taxaEstadiaCents <= 0}>
                {t.caixa.postStay}
              </Button>
              <Button className="rounded-full" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4" />
                {t.caixa.newEntry}
              </Button>
            </>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Eyebrow>{t.caixa.balance}</Eyebrow>
          <p className={cn("mt-1 font-display text-3xl font-semibold tabular-nums", data.saldoCents < 0 ? "text-coral" : "text-primary-deep")}>{fmtReais(data.saldoCents)}</p>
          <p className="text-sm text-muted-foreground">
            {data.equipe.membros} {t.admin.members} · {t.admin.captain}: {data.equipe.capitao?.nome ?? t.admin.noCaptain}
          </p>
        </Card>
        <Card>
          <Eyebrow>{t.caixa.in}</Eyebrow>
          <p className="mt-1 font-display text-3xl font-semibold text-mint-foreground tabular-nums">
            <Reais cents={data.entradasCents} />
          </p>
        </Card>
        <Card>
          <Eyebrow>{t.caixa.out}</Eyebrow>
          <p className="mt-1 font-display text-3xl font-semibold text-coral tabular-nums">
            <Reais cents={data.saidasCents} />
          </p>
          <p className="text-sm text-muted-foreground">
            {t.caixa.stayFee}: {data.equipe.taxaEstadiaCents > 0 ? `${fmtReais(data.equipe.taxaEstadiaCents)} / dia` : "—"}
          </p>
        </Card>
      </div>

      {!data.podeLancar ? <p className="text-sm text-muted-foreground">{t.caixa.readOnly}</p> : null}
      {data.podeLancar && data.equipe.taxaEstadiaCents <= 0 ? <p className="text-sm text-muted-foreground">{t.caixa.stayFeeMissing}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="p-0 sm:p-0">
          {data.lancamentos.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">{t.caixa.noEntries}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {data.lancamentos.map((row) => (
                <li key={row.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", row.tipo === "entrada" ? "bg-mint/30 text-mint-foreground" : "bg-coral/15 text-coral")}>
                    {row.tipo === "entrada" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className="font-medium">{t.caixa.categorias[row.categoria]}</span>
                      {row.automatico ? <Chip tone="muted">{t.caixa.automatic}</Chip> : null}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {fmtDia(row.data)}
                      {row.periodo ? ` · ${fmtDia(row.periodo.inicio)} – ${fmtDia(row.periodo.fim)}` : ""}
                      {row.descricao ? ` · ${row.descricao}` : ""} · {row.autor.nome}
                    </span>
                  </span>
                  <span className={cn("font-semibold tabular-nums", row.tipo === "entrada" ? "text-mint-foreground" : "text-coral")}>
                    {row.tipo === "entrada" ? "+" : "−"}
                    {fmtReais(row.valorCents)}
                  </span>
                  {data.podeLancar ? (
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-coral" aria-label={t.caixa.deleted} disabled={busy === row.id} onClick={() => void remove(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <Eyebrow className="mb-3">{t.caixa.byCategory}</Eyebrow>
          {data.porCategoria.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.caixa.noEntries}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.porCategoria.map((item) => (
                <li key={`${item.tipo}:${item.categoria}`} className="flex items-center justify-between gap-2">
                  <span>
                    {t.caixa.categorias[item.categoria]} <span className="text-xs text-muted-foreground">· {t.caixa.tipos[item.tipo].toLowerCase()}</span>
                  </span>
                  <span className={cn("font-semibold tabular-nums", item.tipo === "entrada" ? "text-mint-foreground" : "text-coral")}>{fmtReais(item.valorCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <LancamentoDialog key={adding ? "open" : "closed"} open={adding} path={path} onOpenChange={setAdding} onSaved={() => caixa.reload()} />
      <EstadiaDialog key={staying ? "s-open" : "s-closed"} open={staying} path={path} data={data} onOpenChange={setStaying} onSaved={() => caixa.reload()} />
    </div>
  );
}

function LancamentoDialog({ open, path, onOpenChange, onSaved }: { open: boolean; path: string; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [tipo, setTipo] = useState<LancamentoTipo>("saida");
  const [categoria, setCategoria] = useState<LancamentoCategoria>("alimentacao");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [busy, setBusy] = useState(false);
  const valorCents = centsOf(valor) ?? 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const body: LancamentoBody = { tipo, categoria, valorCents, descricao, ...(data ? { data } : {}) };
      await api(path, { method: "POST", body });
      toast.success(t.caixa.posted);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.caixa.newEntry}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["entrada", "saida"] as LancamentoTipo[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setTipo(item);
                  setCategoria(item === "entrada" ? "rm" : "alimentacao");
                }}
                className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition", tipo === item ? "border-primary bg-secondary text-primary-deep" : "border-border text-muted-foreground")}
              >
                {t.caixa.tipos[item]}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-cat">{t.caixa.category}</Label>
            <select id="lc-cat" className={selectClass} value={categoria} onChange={(event) => setCategoria(event.target.value as LancamentoCategoria)}>
              {LANCAMENTO_CATEGORIAS.filter((item) => (tipo === "entrada" ? ["rm", "doacao", "outro"].includes(item) : item !== "rm")).map((item) => (
                <option key={item} value={item}>
                  {t.caixa.categorias[item]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-valor">{t.caixa.amount}</Label>
            <MoneyInput id="lc-valor" value={valor} onChange={setValor} autoFocus invalid={valor !== "" && valorCents <= 0} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lc-data">{t.caixa.date}</Label>
              <Input id="lc-data" type="date" value={data} onChange={(event) => setData(event.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lc-desc">{t.caixa.description}</Label>
              <Input id="lc-desc" value={descricao} onChange={(event) => setDescricao(event.target.value)} className="h-10 rounded-xl" maxLength={200} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || valorCents <= 0}>
              {busy ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EstadiaDialog({ open, path, data, onOpenChange, onSaved }: { open: boolean; path: string; data: CaixaEquipe; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const hoje = data.projeto?.hoje ?? new Date().toISOString().slice(0, 10);
  const [inicio, setInicio] = useState(addDays(hoje, -6));
  const [fim, setFim] = useState(hoje);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(path, { method: "POST", body: { estadia: { inicio, fim } } });
      toast.success(t.caixa.stayPosted);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.caixa.postStay}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t.caixa.postStayBody(data.equipe.membros, fmtReais(data.equipe.taxaEstadiaCents))}</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="es-inicio">{t.caixa.from}</Label>
              <Input id="es-inicio" type="date" required value={inicio} onChange={(event) => setInicio(event.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="es-fim">{t.caixa.to}</Label>
              <Input id="es-fim" type="date" required value={fim} onChange={(event) => setFim(event.target.value)} className="h-10 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || !inicio || !fim || inicio > fim}>
              {busy ? t.common.saving : t.caixa.postStay}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
