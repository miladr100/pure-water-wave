"use client";

import { CalendarCheck, CalendarClock, Check, MessageCircle, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { fmtDate } from "@/components/academy/format";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, refreshMe, useApi } from "@/components/academy/use-api";
import { UserAvatar } from "@/components/academy/user-avatar";
import { Card, Failed, LoadingBlock } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import type { ReuniaoEstado, ReuniaoRespostaBody, ReuniaoRow, ReunioesLista } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TONE: Record<ReuniaoEstado, "primary" | "coral" | "mint" | "muted"> = {
  solicitada: "primary",
  confirmada: "mint",
  remarcar: "coral",
  recusada: "muted",
  cancelada: "muted",
  realizada: "muted",
};

const fmtQuando = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

// Meetings with the educator. `papel` decides the side: the member asks
// and follows; the educator answers (Dir. Henrique's ask, 14/11/2026).
export function ReunioesScreen({ papel }: { papel: "membro" | "educador" }) {
  const t = usePainelMessages();
  const { t: ta, language } = useLocale();
  const list = useApi<ReunioesLista>("/api/painel/reunioes");
  const [asking, setAsking] = useState(false);
  const [answering, setAnswering] = useState<ReuniaoRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Opening the page counts as seeing the new ones.
  useEffect(() => {
    const novas = list.data?.reunioes.filter((row) => row.nova) ?? [];
    if (novas.length === 0) return;
    Promise.all(novas.map((row) => api(`/api/painel/reunioes/${row.id}`, { method: "POST" }).catch(() => {}))).then(() => refreshMe().catch(() => {}));
  }, [list.data]);

  if (list.error) {
    return <Failed error={list.error} onRetry={list.reload} />;
  }
  if (list.loading || !list.data) {
    return <LoadingBlock />;
  }
  const { reunioes, educadores } = list.data;
  const abertas = reunioes.filter((row) => row.estado === "solicitada" || row.estado === "remarcar" || row.estado === "confirmada");
  const encerradas = reunioes.filter((row) => !abertas.includes(row));

  async function act(row: ReuniaoRow, body: ReuniaoRespostaBody) {
    setBusy(row.id);
    try {
      await api(`/api/painel/reunioes/${row.id}`, { method: "PATCH", body });
      toast.success(t.reunioes.saved);
      list.reload();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(null);
    }
  }

  function Item({ row }: { row: ReuniaoRow }) {
    const other = papel === "educador" ? row.membro : row.educador;
    return (
      <li className={cn("rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:p-5", row.nova && "border-primary/50")}>
        <div className="flex flex-wrap items-start gap-3">
          {papel === "educador" ? <UserAvatar fullName={row.membro.nome} photoUrl={row.membro.fotoUrl} className="h-11 w-11" textClassName="text-sm" /> : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-primary-deep">{other.nome}</p>
              {papel === "educador" && row.membro.equipe ? <span className="text-xs text-muted-foreground">{row.membro.equipe}</span> : null}
              <Chip tone={TONE[row.estado]}>{t.reunioes.estados[row.estado]}</Chip>
              {row.nova ? <Chip tone="coral">{t.reunioes.new}</Chip> : null}
            </div>
            <p className="mt-1 text-sm">{row.motivo}</p>
            {row.disponibilidade ? (
              <p className="text-sm text-muted-foreground">
                {t.reunioes.availability}: {row.disponibilidade}
              </p>
            ) : null}
            {row.estado === "confirmada" && row.dataHora ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary-deep">
                <CalendarCheck className="h-4 w-4" />
                {fmtQuando(row.dataHora)}
                {row.local ? ` · ${row.local}` : ""}
              </p>
            ) : null}
            {row.resposta ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {t.reunioes.reply}: <q>{row.resposta}</q>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              {t.reunioes.askedOn(fmtDate(row.criadaEm, language))}
              {row.avisos.length > 0 ? ` · ${t.reunioes.notified(row.avisos.filter((a) => a.ok).map((a) => a.canal).join(", ") || t.reunioes.noChannel)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {row.whatsappLink ? (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <a href={row.whatsappLink} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
            {papel === "educador" && (row.estado === "solicitada" || row.estado === "remarcar") ? (
              <Button size="sm" className="rounded-full" onClick={() => setAnswering(row)} disabled={busy === row.id}>
                {t.reunioes.answer}
              </Button>
            ) : null}
            {papel === "educador" && row.estado === "confirmada" ? (
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => void act(row, { acao: "realizada" })} disabled={busy === row.id}>
                <Check className="h-4 w-4" />
                {t.reunioes.markDone}
              </Button>
            ) : null}
            {["solicitada", "remarcar", "confirmada"].includes(row.estado) ? (
              <Button size="sm" variant="ghost" className="rounded-full text-muted-foreground" onClick={() => window.confirm(t.reunioes.cancelConfirm) && void act(row, { acao: "cancelar" })} disabled={busy === row.id}>
                <X className="h-4 w-4" />
                {t.reunioes.cancel}
              </Button>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow={t.areas.painel}
        title={t.reunioes.title}
        description={papel === "membro" ? t.reunioes.bodyMember : t.reunioes.bodyEducator}
        actions={
          papel === "membro" ? (
            <Button className="rounded-full" onClick={() => setAsking(true)}>
              <Plus className="h-4 w-4" />
              {t.reunioes.ask}
            </Button>
          ) : null
        }
      />
      {reunioes.length === 0 ? (
        <Card>
          <div className="flex items-center gap-3 text-muted-foreground">
            <CalendarClock className="h-5 w-5" />
            <p>{papel === "membro" ? t.reunioes.emptyMember : t.reunioes.emptyEducator}</p>
          </div>
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {abertas.map((row) => (
              <Item key={row.id} row={row} />
            ))}
          </ul>
          {encerradas.length > 0 ? (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-primary-deep">
                {t.reunioes.closed(encerradas.length)}
              </summary>
              <ul className="mt-3 space-y-3 opacity-80">
                {encerradas.map((row) => (
                  <Item key={row.id} row={row} />
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}

      <PedirDialog key={asking ? "ask-open" : "ask-closed"} open={asking} educadores={educadores} onOpenChange={setAsking} onSaved={() => list.reload()} />
      <ResponderDialog key={answering?.id ?? "answer-closed"} row={answering} onClose={() => setAnswering(null)} onSaved={() => list.reload()} />
    </div>
  );
}

function PedirDialog({ open, educadores, onOpenChange, onSaved }: { open: boolean; educadores: ReunioesLista["educadores"]; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [educadorId, setEducadorId] = useState(educadores.find((item) => item.minha)?.id ?? educadores[0]?.id ?? "");
  const [motivo, setMotivo] = useState("");
  const [disponibilidade, setDisponibilidade] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/painel/reunioes", { method: "POST", body: { educadorId, motivo, disponibilidade } });
      toast.success(t.reunioes.asked);
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
          <DialogTitle>{t.reunioes.ask}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="re-educador">{t.reunioes.with}</Label>
            <select id="re-educador" className={selectClass} value={educadorId} onChange={(event) => setEducadorId(event.target.value)}>
              {educadores.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                  {item.minha ? ` · ${t.reunioes.mine}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="re-motivo">{t.reunioes.reason}</Label>
            <Textarea id="re-motivo" required autoFocus rows={3} value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder={t.reunioes.reasonHint} className="rounded-xl" maxLength={500} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="re-quando">{t.reunioes.availability}</Label>
            <Input id="re-quando" value={disponibilidade} onChange={(event) => setDisponibilidade(event.target.value)} placeholder={t.reunioes.availabilityHint} className="h-10 rounded-xl" maxLength={200} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || motivo.trim().length < 3 || !educadorId}>
              {busy ? t.common.saving : t.reunioes.send}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResponderDialog({ row, onClose, onSaved }: { row: ReuniaoRow | null; onClose: () => void; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [acao, setAcao] = useState<"confirmar" | "remarcar" | "recusar">("confirmar");
  const [dataHora, setDataHora] = useState("");
  const [local, setLocal] = useState("");
  const [resposta, setResposta] = useState("");
  const [busy, setBusy] = useState(false);
  if (!row) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!row) return;
    setBusy(true);
    try {
      const body: ReuniaoRespostaBody = { acao, resposta, ...(acao === "confirmar" ? { dataHora: new Date(dataHora).toISOString(), local } : {}) };
      await api(`/api/painel/reunioes/${row.id}`, { method: "PATCH", body });
      toast.success(t.reunioes.saved);
      onSaved();
      onClose();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t.reunioes.answer} · {row.membro.nome}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {row.motivo}
          {row.disponibilidade ? ` · ${row.disponibilidade}` : ""}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(["confirmar", "remarcar", "recusar"] as const).map((item) => (
              <button key={item} type="button" onClick={() => setAcao(item)} className={cn("rounded-full border px-3 py-2 text-sm font-semibold transition", acao === item ? "border-primary bg-secondary text-primary-deep" : "border-border text-muted-foreground")}>
                {t.reunioes.acoes[item]}
              </button>
            ))}
          </div>
          {acao === "confirmar" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="re-datahora">{t.reunioes.when}</Label>
                <Input id="re-datahora" type="datetime-local" required value={dataHora} onChange={(event) => setDataHora(event.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="re-local">{t.reunioes.where}</Label>
                <Input id="re-local" value={local} onChange={(event) => setLocal(event.target.value)} placeholder={t.reunioes.whereHint} className="h-10 rounded-xl" maxLength={200} />
              </div>
            </>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="re-resposta">{t.reunioes.message}</Label>
            <Textarea id="re-resposta" rows={3} value={resposta} onChange={(event) => setResposta(event.target.value)} className="rounded-xl" maxLength={500} required={acao === "remarcar"} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || (acao === "confirmar" && !dataHora) || (acao === "remarcar" && resposta.trim().length < 3)}>
              {busy ? t.common.saving : t.reunioes.acoes[acao]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
