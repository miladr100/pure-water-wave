"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { Card, Failed, LoadingBlock, fmtRelativeDay } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelEu, usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import { todayInBrazil } from "@/lib/hj/dates";
import { ETAPA_LABELS, ETAPA_ORDEM } from "@/lib/hj/testemunho";
import type { ConvidadoEtapa, ConvidadoRow } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EtapaChip({ etapa }: { etapa: ConvidadoEtapa }) {
  const tone = etapa === "jardim" ? "mint" : etapa === "pre_gateway" ? "muted" : "primary";
  return <Chip tone={tone}>{ETAPA_LABELS[etapa]}</Chip>;
}

// The guests a person follows: the list with its filters and the "Novo
// convidado" dialog. In the administration the same screen shows every
// guest in the educator's scope, with the team each one belongs to.
export function ConvidadosScreen({ base }: { base: "/painel/testemunho" | "/admin/testemunho" }) {
  const t = usePainelMessages();
  const eu = usePainelEu();
  const admin = base === "/admin/testemunho";
  const [escopo, setEscopo] = useState<"meus" | "todos">(admin ? "todos" : "meus");
  const list = useApi<{ convidados: ConvidadoRow[] }>(`/api/painel/convidados?escopo=${escopo}`);
  const [busca, setBusca] = useState("");
  const [etapa, setEtapa] = useState<ConvidadoEtapa | "">("");
  const [soAlertas, setSoAlertas] = useState(false);
  const hoje = todayInBrazil();

  const canSeeTeam = Boolean(eu?.papeis.capitao || eu?.papeis.educador || eu?.papeis.administrador);

  const rows = useMemo(() => {
    const all = list.data?.convidados ?? [];
    const query = busca.trim().toLowerCase();
    return all.filter(
      (row) =>
        (!query || row.nome.toLowerCase().includes(query) || row.responsavel.nome.toLowerCase().includes(query)) &&
        (!etapa || row.etapa === etapa) &&
        (!soAlertas || row.alerta),
    );
  }, [list.data, busca, etapa, soAlertas]);

  const porEtapa = useMemo(() => {
    const counts = Object.fromEntries(ETAPA_ORDEM.map((item) => [item, 0])) as Record<ConvidadoEtapa, number>;
    for (const row of list.data?.convidados ?? []) counts[row.etapa] += 1;
    return counts;
  }, [list.data]);

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow={t.nav.testemunho}
        title={t.testemunho.title}
        description={list.data ? t.inicio.guests(list.data.convidados.length) : undefined}
        actions={
          <>
            {canSeeTeam && !admin ? (
              <div className="inline-flex rounded-full bg-muted p-0.5">
                {(["meus", "todos"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setEscopo(item)}
                    className={cn("h-9 rounded-full px-4 text-[13px] font-semibold text-muted-foreground", escopo === item && "bg-card text-primary-deep shadow-sm")}
                  >
                    {item === "meus" ? t.testemunho.mine : t.testemunho.team}
                  </button>
                ))}
              </div>
            ) : null}
            <NovoConvidado onCreated={() => list.reload()} />
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {ETAPA_ORDEM.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setEtapa(etapa === item ? "" : item)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              etapa === item ? "border-primary bg-secondary text-primary-deep" : "border-border bg-card text-muted-foreground hover:text-primary-deep",
            )}
          >
            {ETAPA_LABELS[item]} <span className="tabular-nums">{porEtapa[item]}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSoAlertas(!soAlertas)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            soAlertas ? "border-coral bg-coral/10 text-coral" : "border-border bg-card text-muted-foreground hover:text-primary-deep",
          )}
        >
          {t.testemunho.onlyAlerts}
        </button>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder={t.common.search} className="h-10 rounded-full pl-9" aria-label={t.common.search} />
        </div>
      </div>

      {list.error ? (
        <Failed error={list.error} onRetry={list.reload} />
      ) : list.loading || !list.data ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">{t.testemunho.empty}</p>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`${base}/${row.id}`} className="flex h-full flex-col gap-2 rounded-3xl border border-border/60 bg-card p-4 text-foreground shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg font-semibold text-primary-deep">{row.nome}</p>
                  <EtapaChip etapa={row.etapa} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.etapa === "sistema1" ? `${t.testemunho.conferences(row.conferencias)} · ` : ""}
                  {row.ultimoContato ? t.testemunho.lastContact(fmtRelativeDay(row.ultimoContato, hoje)) : t.testemunho.noContact}
                </p>
                {escopo === "todos" || admin ? (
                  <p className="text-xs text-muted-foreground">
                    {t.testemunho.responsible}: {row.responsavel.nome}
                    {row.equipe ? ` · ${row.equipe.nome}` : ""}
                  </p>
                ) : null}
                {row.alerta ? <p className="text-sm font-medium text-coral">{row.alerta.texto}</p> : row.proximoObjetivo ? <p className="text-sm text-muted-foreground">→ {row.proximoObjetivo}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function NovoConvidado({ onCreated }: { onCreated: (row: ConvidadoRow) => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", cidade: "", origem: "", etapa: "pre_gateway" as ConvidadoEtapa, primeiroContato: todayInBrazil(), proximoObjetivo: "", notas: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const reply = await api<{ convidado: ConvidadoRow }>("/api/painel/convidados", {
        method: "POST",
        body: { ...form, datas: { primeiroContato: form.primeiroContato } },
      });
      toast.success(t.testemunho.created);
      setOpen(false);
      setForm({ nome: "", telefone: "", cidade: "", origem: "", etapa: "pre_gateway", primeiroContato: todayInBrazil(), proximoObjetivo: "", notas: "" });
      onCreated(reply.convidado);
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="h-4 w-4" />
          {t.testemunho.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.testemunho.newGuest}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">{t.testemunho.name}</Label>
            <Input id="nome" required autoFocus value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">{t.testemunho.phone}</Label>
              <Input id="telefone" inputMode="tel" value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cidade">{t.testemunho.city}</Label>
              <Input id="cidade" value={form.cidade} onChange={(event) => setForm({ ...form, cidade: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="origem">{t.testemunho.origin}</Label>
              <Input id="origem" value={form.origem} onChange={(event) => setForm({ ...form, origem: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="etapa">{t.testemunho.stage}</Label>
              <select id="etapa" className={cn(selectClass, "w-full")} value={form.etapa} onChange={(event) => setForm({ ...form, etapa: event.target.value as ConvidadoEtapa })}>
                {ETAPA_ORDEM.map((item) => (
                  <option key={item} value={item}>
                    {ETAPA_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="primeiroContato">{t.testemunho.firstContact}</Label>
              <Input id="primeiroContato" type="date" max={todayInBrazil()} value={form.primeiroContato} onChange={(event) => setForm({ ...form, primeiroContato: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proximoObjetivo">{t.testemunho.nextGoal}</Label>
              <Input id="proximoObjetivo" value={form.proximoObjetivo} onChange={(event) => setForm({ ...form, proximoObjetivo: event.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notas">{t.testemunho.notes}</Label>
            <Textarea id="notas" rows={2} value={form.notas} onChange={(event) => setForm({ ...form, notas: event.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || form.nome.trim().length < 2}>
              {busy ? t.common.saving : t.testemunho.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

