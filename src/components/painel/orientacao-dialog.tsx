"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { usePainelEu, usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import { fmtDia } from "@/lib/hj/dates";
import type { OrientacaoBody, OrientacaoModulo, OrientacaoRow } from "@/lib/hj/types";

export type OrientacaoAlvo = { modulo: OrientacaoModulo; equipeId?: string; membroId?: string; nome: string };

// Register what was told to a team (testemunho) or a member (the meta
// interna, in the RM and in the testimony drive alike), with the history underneath so the educator sees what was said
// last time before saying it again (Yeseong, 14/11/2026).
export function OrientacaoDialog({ alvo, onClose, onSaved }: { alvo: OrientacaoAlvo | null; onClose: () => void; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const eu = usePainelEu();
  const [texto, setTexto] = useState("");
  const [data, setData] = useState("");
  const [busy, setBusy] = useState(false);
  // a member's meta interna has one history across the RM and the testimony drive
  const query = alvo ? (alvo.equipeId ? `equipe=${alvo.equipeId}&modulo=${alvo.modulo}` : `membro=${alvo.membroId}`) : "";
  const history = useApi<{ orientacoes: OrientacaoRow[] }>(alvo ? `/api/admin/hj/orientacoes?${query}` : "/api/admin/hj/orientacoes?membro=none");
  if (!alvo) {
    return null;
  }
  // to a member it is the meta interna, in either phase (Victor, 23/11/2026)
  const isGoal = Boolean(alvo.membroId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!alvo) return;
    setBusy(true);
    try {
      const body: OrientacaoBody = { modulo: alvo.modulo, equipeId: alvo.equipeId, membroId: alvo.membroId, texto, ...(data ? { data } : {}) };
      await api("/api/admin/hj/orientacoes", { method: "POST", body });
      toast.success(t.indicadores.orientationSaved);
      setTexto("");
      history.reload();
      onSaved();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: OrientacaoRow) {
    if (!window.confirm(`${t.indicadores.orientationDeleted}?`)) return;
    try {
      await api(`/api/admin/hj/orientacoes/${row.id}`, { method: "DELETE" });
      toast.success(t.indicadores.orientationDeleted);
      history.reload();
      onSaved();
    } catch (error) {
      toast.error(describeError(error, ta));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isGoal ? t.indicadores.innerGoal : t.indicadores.orientation} · {alvo.nome}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="or-texto">{isGoal ? t.indicadores.innerGoal : t.indicadores.orientation}</Label>
            <Textarea id="or-texto" required autoFocus rows={4} value={texto} onChange={(event) => setTexto(event.target.value)} placeholder={isGoal ? t.indicadores.innerGoalHint : t.indicadores.orientationHint} className="rounded-xl" maxLength={1000} />
          </div>
          <div className="space-y-1.5 sm:w-48">
            <Label htmlFor="or-data">{t.indicadores.orientationDate}</Label>
            <Input id="or-data" type="date" value={data} onChange={(event) => setData(event.target.value)} className="h-10 rounded-xl" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t.common.close}
            </Button>
            <Button type="submit" disabled={busy || texto.trim().length < 3}>
              {busy ? t.common.saving : isGoal ? t.indicadores.setInnerGoal : t.indicadores.addOrientation}
            </Button>
          </DialogFooter>
        </form>
        <div className="border-t border-border/60 pt-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t.indicadores.history}</p>
          {history.data && history.data.orientacoes.length === 0 ? <p className="text-sm text-muted-foreground">{t.indicadores.noOrientation}</p> : null}
          <ul className="space-y-3">
            {history.data?.orientacoes.map((row) => (
              <li key={row.id} className="flex gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap">{row.texto}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.indicadores.givenBy(row.autor.nome, fmtDia(row.data))}
                    {isGoal ? ` · ${row.modulo === "testemunho" ? t.areas.testemunho : t.areas.rmShort}` : ""}
                  </p>
                </div>
                {eu && (eu.papeis.administrador || eu.id === row.autor.id) ? (
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-coral" aria-label={t.indicadores.orientationDeleted} onClick={() => void remove(row)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
