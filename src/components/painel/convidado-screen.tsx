"use client";

import { ArrowLeft, Check, FileSignature, Heart, MessageCircle, Pencil, StickyNote, Waves } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { Card, Eyebrow, Failed, LoadingBlock, fmtRelativeDay } from "@/components/painel/bits";
import { EtapaChip } from "@/components/painel/convidados-screen";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import { fmtDia, todayInBrazil } from "@/lib/hj/dates";
import { ETAPA_LABELS, ETAPA_ORDEM, proximaEtapa } from "@/lib/hj/testemunho";
import { CONFERENCIAS_SISTEMA1, type AcontecimentoTipo, type ConvidadoDatas, type ConvidadoDetalhe, type ConvidadoEtapa } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

const TIPO_ICON: Record<AcontecimentoTipo, typeof Heart> = {
  contato: MessageCircle,
  gateway: Waves,
  conferencia: Heart,
  ficha: FileSignature,
  etapa: Check,
  nota: StickyNote,
};

const DATE_LABELS: Record<keyof ConvidadoDatas, string> = {
  primeiroContato: "Primeiro contato",
  gateway: "Gateway",
  fichaAssinada: "Ficha assinada",
  inicioSistema1: "Início do Sistema 1",
  fimSistema1: "Fim do Sistema 1",
  inicioSistema2: "Início do Sistema 2",
  jardim: "Jardim",
};

// One guest: the journey, what to do next, the timeline, and the ways to
// record what happened.
export function ConvidadoScreen({ id, base }: { id: string; base: "/painel/testemunho" | "/admin/testemunho" }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const guest = useApi<{ convidado: ConvidadoDetalhe }>(`/api/painel/convidados/${id}`);
  // A PATCH answers with the whole guest; it stands in for the loaded one
  // until the next load replaces it.
  const [override, setOverride] = useState<{ source: unknown; value: ConvidadoDetalhe } | null>(null);
  const [registro, setRegistro] = useState<AcontecimentoTipo | null>(null);
  const [registroTexto, setRegistroTexto] = useState("");
  const [registroData, setRegistroData] = useState(todayInBrazil());
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const hoje = todayInBrazil();
  const data = override && override.source === guest.data ? override.value : (guest.data?.convidado ?? null);
  const setData = (value: ConvidadoDetalhe) => setOverride({ source: guest.data, value });

  if (guest.error) {
    return <Failed error={guest.error} onRetry={guest.reload} />;
  }
  if (!data) {
    return <LoadingBlock />;
  }

  async function registrar() {
    if (!registro) return;
    setBusy(true);
    try {
      await api(`/api/painel/convidados/${id}/acontecimentos`, {
        method: "POST",
        body: { tipo: registro, texto: registroTexto, data: registroData },
      });
      toast.success(t.testemunho.saved);
      setRegistro(null);
      setRegistroTexto("");
      setRegistroData(todayInBrazil());
      guest.reload();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  async function mover(etapa: ConvidadoEtapa) {
    setBusy(true);
    try {
      const reply = await api<{ convidado: ConvidadoDetalhe }>(`/api/painel/convidados/${id}`, { method: "PATCH", body: { etapa } });
      setData(reply.convidado);
      toast.success(t.testemunho.saved);
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  const proxima = proximaEtapa(data.etapa);
  const stageIndex = ETAPA_ORDEM.indexOf(data.etapa);
  const registros: { tipo: AcontecimentoTipo; label: string }[] = [
    { tipo: "contato", label: t.testemunho.registerContact },
    ...(data.etapa === "pre_gateway" || data.etapa === "gateway" ? [{ tipo: "gateway" as const, label: t.testemunho.registerGateway }] : []),
    ...(!data.datas.fichaAssinada ? [{ tipo: "ficha" as const, label: t.testemunho.registerFicha }] : []),
    ...(data.etapa !== "jardim" && data.conferencias < CONFERENCIAS_SISTEMA1 ? [{ tipo: "conferencia" as const, label: t.testemunho.registerConference }] : []),
    { tipo: "nota", label: t.testemunho.registerNote },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 rounded-full text-muted-foreground">
          <Link href={base}>
            <ArrowLeft className="h-4 w-4" />
            {t.testemunho.title}
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">{data.nome}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[data.telefone, data.cidade, data.origem].filter(Boolean).join(" · ")}
              {data.telefone || data.cidade || data.origem ? " · " : ""}
              {t.testemunho.responsible}: {data.responsavel.nome}
              {data.equipe ? ` (${data.equipe.nome})` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <EtapaChip etapa={data.etapa} />
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              {t.testemunho.edit}
            </Button>
          </div>
        </div>
      </div>

      {data.alerta ? <div className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{data.alerta.texto}</div> : null}

      <Card>
        <Eyebrow className="mb-4">{t.testemunho.journey}</Eyebrow>
        <ol className="grid grid-cols-5 gap-1">
          {ETAPA_ORDEM.map((etapa, index) => {
            const done = index < stageIndex;
            const current = index === stageIndex;
            return (
              <li key={etapa} className="flex flex-col items-center gap-1.5 text-center">
                <span className={cn("h-2 w-full rounded-full", done ? "bg-primary" : current ? "bg-gradient-to-r from-[#009dc9] to-[#0079b9]" : "bg-muted")} />
                <span className={cn("text-[11px] font-semibold leading-tight", current ? "text-primary-deep" : "text-muted-foreground")}>{ETAPA_LABELS[etapa]}</span>
              </li>
            );
          })}
        </ol>
        {data.etapa === "sistema1" ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{t.testemunho.conferences(data.conferencias)}</span>
            </div>
            <div className="grid grid-cols-16 gap-1" style={{ gridTemplateColumns: `repeat(${CONFERENCIAS_SISTEMA1}, minmax(0, 1fr))` }}>
              {Array.from({ length: CONFERENCIAS_SISTEMA1 }, (_, index) => (
                <span key={index} className={cn("h-2 rounded-full", index < data.conferencias ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
          </div>
        ) : null}
        <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {(Object.keys(DATE_LABELS) as (keyof ConvidadoDatas)[])
            .filter((key) => data.datas[key])
            .map((key) => (
              <div key={key} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{DATE_LABELS[key]}</dt>
                <dd className="tabular-nums">{fmtDia(data.datas[key]!)}</dd>
              </div>
            ))}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Último contato</dt>
            <dd>{data.ultimoContato ? `${fmtDia(data.ultimoContato)} (${fmtRelativeDay(data.ultimoContato, hoje)})` : "—"}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="space-y-3">
          <Eyebrow>{t.testemunho.suggestions}</Eyebrow>
          {data.proximoObjetivo ? <p className="font-medium">{data.proximoObjetivo}</p> : null}
          <ul className="space-y-1 text-sm text-muted-foreground">
            {data.sugestoes.map((item) => (
              <li key={item}>→ {item}</li>
            ))}
          </ul>
          {proxima ? (
            <Button type="button" variant="outline" className="rounded-full" disabled={busy} onClick={() => void mover(proxima)}>
              {t.testemunho.moveTo(ETAPA_LABELS[proxima])}
            </Button>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <Eyebrow>{t.testemunho.register}</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {registros.map((item) => {
              const Icon = TIPO_ICON[item.tipo];
              return (
                <Button key={item.tipo} type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setRegistro(item.tipo)}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
          {data.notas ? <p className="whitespace-pre-line text-sm text-muted-foreground">{data.notas}</p> : null}
        </Card>
      </div>

      <Card>
        <Eyebrow className="mb-3">{t.testemunho.timeline}</Eyebrow>
        <ol className="space-y-3">
          {data.acontecimentos.map((item) => {
            const Icon = TIPO_ICON[item.tipo];
            return (
              <li key={item.id} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-deep">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm">{item.texto || ETAPA_LABELS[data.etapa]}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDia(item.data)} · {item.autor.nome}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Dialog open={registro !== null} onOpenChange={(open) => !open && setRegistro(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{registro ? registros.find((item) => item.tipo === registro)?.label ?? t.testemunho.register : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="registro-data">{t.testemunho.date}</Label>
              <Input id="registro-data" type="date" max={hoje} value={registroData} onChange={(event) => setRegistroData(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registro-texto">{t.testemunho.noteText}</Label>
              <Textarea id="registro-texto" rows={3} autoFocus value={registroTexto} onChange={(event) => setRegistroTexto(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setRegistro(null)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={busy || (registro === "nota" && registroTexto.trim() === "")} onClick={() => void registrar()}>
              {t.testemunho.register}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditarConvidado open={editing} onOpenChange={setEditing} guest={data} onSaved={(saved) => setData(saved)} />
    </div>
  );
}

// The dialog's content unmounts when it closes, so the form inside starts
// from the guest's current data at every opening.
function EditarConvidado({ open, onOpenChange, guest, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; guest: ConvidadoDetalhe; onSaved: (guest: ConvidadoDetalhe) => void }) {
  const t = usePainelMessages();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.testemunho.edit}</DialogTitle>
        </DialogHeader>
        <EditarConvidadoForm guest={guest} onSaved={onSaved} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditarConvidadoForm({ guest, onSaved, onClose }: { guest: ConvidadoDetalhe; onSaved: (guest: ConvidadoDetalhe) => void; onClose: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nome: guest.nome, telefone: guest.telefone, cidade: guest.cidade, origem: guest.origem, proximoObjetivo: guest.proximoObjetivo, notas: guest.notas, conferencias: String(guest.conferencias), datas: { ...guest.datas } });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const datas = Object.fromEntries(Object.entries(form.datas).map(([key, value]) => [key, value || null]));
      const reply = await api<{ convidado: ConvidadoDetalhe }>(`/api/painel/convidados/${guest.id}`, {
        method: "PATCH",
        body: { ...form, conferencias: Number(form.conferencias) || 0, datas },
      });
      toast.success(t.testemunho.saved);
      onSaved(reply.convidado);
      onClose();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  return (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="e-nome">{t.testemunho.name}</Label>
              <Input id="e-nome" required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-telefone">{t.testemunho.phone}</Label>
              <Input id="e-telefone" value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-cidade">{t.testemunho.city}</Label>
              <Input id="e-cidade" value={form.cidade} onChange={(event) => setForm({ ...form, cidade: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-origem">{t.testemunho.origin}</Label>
              <Input id="e-origem" value={form.origem} onChange={(event) => setForm({ ...form, origem: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-conf">{t.testemunho.conferences(Number(form.conferencias) || 0)}</Label>
              <Input id="e-conf" inputMode="numeric" value={form.conferencias} onChange={(event) => setForm({ ...form, conferencias: event.target.value.replace(/\D/g, "") })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="e-objetivo">{t.testemunho.nextGoal}</Label>
              <Input id="e-objetivo" value={form.proximoObjetivo} onChange={(event) => setForm({ ...form, proximoObjetivo: event.target.value })} />
            </div>
          </div>
          <Eyebrow>{t.testemunho.stageDates}</Eyebrow>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(DATE_LABELS) as (keyof ConvidadoDatas)[]).map((key) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`e-${key}`} className="text-xs">
                  {DATE_LABELS[key]}
                </Label>
                <Input id={`e-${key}`} type="date" value={form.datas[key] ?? ""} onChange={(event) => setForm({ ...form, datas: { ...form.datas, [key]: event.target.value } })} />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-notas">{t.testemunho.notes}</Label>
            <Textarea id="e-notas" rows={3} value={form.notas} onChange={(event) => setForm({ ...form, notas: event.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </form>
  );
}
