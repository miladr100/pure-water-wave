"use client";

import { Check, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useLocale } from "@/components/academy/locale-provider";
import { describeError } from "@/components/academy/use-api";
import { EstadoChip, Reais } from "@/components/painel/bits";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import { fmtDia } from "@/lib/hj/dates";
import { fmtReais } from "@/lib/hj/rm";
import type { RelatorioRow } from "@/lib/hj/types";

// One sent report as the captain (or educator) sees it, with Validar and
// Devolver. Shared by the team screen and the administration's day list.
export function RelatorioLinha({
  row,
  canValidate,
  showMember = true,
  showTeam = false,
  onChanged,
}: {
  row: RelatorioRow;
  canValidate: boolean;
  showMember?: boolean;
  showTeam?: boolean;
  onChanged: (row: RelatorioRow) => void;
}) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState(false);
  const [motivo, setMotivo] = useState("");

  async function act(acao: "validar" | "devolver") {
    setBusy(true);
    try {
      const reply = await api<{ relatorio: RelatorioRow }>(`/api/painel/relatorios/${row.id}/validar`, {
        method: "POST",
        body: { acao, motivo },
      });
      toast.success(acao === "validar" ? t.equipe.validated : t.equipe.returned);
      setReturning(false);
      setMotivo("");
      onChanged(reply.relatorio);
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  const detail = [
    `${t.relatorio.dinheiro} ${fmtReais(row.dinheiroCents, { centavos: true })}`,
    `${t.relatorio.pix} ${fmtReais(row.pixCents, { centavos: true })}`,
    row.despesasCents ? `${t.relatorio.despesas} ${fmtReais(row.despesasCents, { centavos: true })}` : null,
    row.itens ? `${row.itens} itens` : null,
    row.contatos ? `${row.contatos} contatos` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          {showMember ? <span className="font-semibold text-foreground">{row.membro.nome}</span> : null}
          {showTeam ? <span className="text-muted-foreground">{row.equipe.nome}</span> : null}
          <span className="text-muted-foreground">{fmtDia(row.data)}</span>
          <EstadoChip estado={row.estado} />
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
        {row.observacoes ? <p className="text-xs italic text-muted-foreground">“{row.observacoes}”</p> : null}
        {row.estado === "devolvido" && row.motivoDevolucao ? (
          <p className="text-xs text-coral">
            {t.relatorio.returnedReason}: {row.motivoDevolucao}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Reais cents={row.liquidoCents} className="font-display text-xl font-semibold text-primary-deep" />
        {canValidate && row.estado === "enviado" ? (
          <>
            <Button type="button" size="sm" className="rounded-full" disabled={busy} onClick={() => void act("validar")}>
              <Check className="h-4 w-4" />
              {t.equipe.validate}
            </Button>
            <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => setReturning(true)}>
              <Undo2 className="h-4 w-4" />
              {t.equipe.sendBack}
            </Button>
          </>
        ) : null}
      </div>

      <Dialog open={returning} onOpenChange={setReturning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t.equipe.sendBack} · {row.membro.nome}
            </DialogTitle>
            <DialogDescription>
              {fmtDia(row.data, "longo")} · {fmtReais(row.liquidoCents, { centavos: true })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor={`motivo-${row.id}`} className="text-sm font-medium">
              {t.equipe.reason}
            </label>
            <Textarea
              id={`motivo-${row.id}`}
              rows={3}
              autoFocus
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder={t.equipe.reasonPlaceholder}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setReturning(false)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={busy || motivo.trim().length === 0} onClick={() => void act("devolver")}>
              {t.equipe.sendBack}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
