"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { Card, Failed, LoadingBlock, MoneyInput, Reais, Stat, centsOf } from "@/components/painel/bits";
import { CaixaScreen } from "@/components/painel/caixa-screen";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/academy/api-client";
import { fmtDia } from "@/lib/hj/dates";
import { fmtReais } from "@/lib/hj/rm";
import type { CaixaResumo, CaixaResumoEquipe } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

// Testemunho › Caixa for the educator: every team's balance, the stay fee
// of each, and the team's own box when one is opened.
export function CaixasScreen({ equipeId }: { equipeId?: string }) {
  const t = usePainelMessages();
  const list = useApi<CaixaResumo>("/api/admin/hj/caixa");
  const [fee, setFee] = useState<CaixaResumoEquipe | null>(null);

  if (equipeId) {
    return <CaixaScreen equipeId={equipeId} backHref="/admin/testemunho/caixa" />;
  }
  if (list.error) {
    return <Failed error={list.error} onRetry={list.reload} />;
  }
  if (list.loading || !list.data) {
    return <LoadingBlock />;
  }
  const { projeto, equipes, totais } = list.data;

  return (
    <div className="space-y-6">
      <PainelHeading eyebrow={t.nav.testemunho} title={t.caixa.adminTitle} description={projeto ? `${projeto.nome} · ${fmtDia(projeto.inicio)} – ${fmtDia(projeto.fim)}` : t.caixa.adminBody} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t.caixa.balance} value={fmtReais(totais.saldoCents)} />
        <Stat label={t.caixa.in} value={fmtReais(totais.entradasCents)} />
        <Stat label={t.caixa.out} value={fmtReais(totais.saidasCents)} />
      </div>
      <Card className="p-0 sm:p-0">
        {equipes.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">{t.missao.noTeams}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">{t.caixa.team}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.captain}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.caixa.stayFee}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.caixa.in}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.caixa.out}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.caixa.balance}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.caixa.lastEntry}</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {equipes.map((row) => (
                  <tr key={row.equipe.id}>
                    <td className="px-4 py-2.5">
                      <a href={`/admin/testemunho/caixa?equipe=${row.equipe.id}`} className="font-medium hover:text-primary">
                        {row.equipe.nome}
                      </a>
                      <Chip tone="muted" className="ml-2">
                        {row.equipe.programa}
                      </Chip>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {row.membros} {t.admin.members}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{row.capitao?.nome ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.taxaEstadiaCents > 0 ? `${fmtReais(row.taxaEstadiaCents)}/dia` : "—"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-mint-foreground">
                      <Reais cents={row.entradasCents} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-coral">
                      <Reais cents={row.saidasCents} />
                    </td>
                    <td className={cn("px-3 py-2.5 text-right font-semibold tabular-nums", row.saldoCents < 0 && "text-coral")}>
                      <Reais cents={row.saldoCents} />
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{row.ultimoLancamento ? fmtDia(row.ultimoLancamento) : "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setFee(row)}>
                        {t.caixa.stayFee}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <FeeDialog key={fee?.equipe.id ?? "closed"} row={fee} onClose={() => setFee(null)} onSaved={() => list.reload()} />
    </div>
  );
}

function FeeDialog({ row, onClose, onSaved }: { row: CaixaResumoEquipe | null; onClose: () => void; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [valor, setValor] = useState(row && row.taxaEstadiaCents > 0 ? String(row.taxaEstadiaCents / 100).replace(".", ",") : "");
  const [busy, setBusy] = useState(false);
  if (!row) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!row) return;
    setBusy(true);
    try {
      await api(`/api/admin/hj/equipes/${row.equipe.id}`, { method: "PATCH", body: { taxaEstadiaCents: centsOf(valor) ?? 0 } });
      toast.success(t.admin.teamSaved);
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t.caixa.stayFee} · {row.equipe.nome}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fee">{t.caixa.stayFee}</Label>
            <MoneyInput id="fee" value={valor} onChange={setValor} autoFocus />
            <p className="text-xs text-muted-foreground">{t.caixa.stayFeeHint}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t.common.saving : t.caixa.saveFee}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
