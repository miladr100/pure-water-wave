"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { Eyebrow, Failed, LoadingBlock, MoneyInput, centsOf } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { refreshEu, usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import { fmtDia } from "@/lib/hj/dates";
import { fmtReais } from "@/lib/hj/rm";
import { HJ_PROGRAMAS, type HjPrograma, type ProjetoAdmin, type ProjetoTipo } from "@/lib/hj/types";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const reais = (cents: number) => (cents === 0 ? "" : String(cents / 100).replace(".", ","));

// Projects (RM periods and testimony drives): the administrator opens a
// new one, often copying the teams of the last, and sets its goals.
export function OrganizacaoScreen() {
  const t = usePainelMessages();
  const list = useApi<{ projetos: ProjetoAdmin[] }>("/api/admin/hj/projetos");
  const [editing, setEditing] = useState<ProjetoAdmin | "new" | null>(null);

  if (list.error) {
    return <Failed error={list.error} onRetry={list.reload} />;
  }
  if (list.loading || !list.data) {
    return <LoadingBlock />;
  }
  const { projetos } = list.data;

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow={t.admin.orgTitle}
        title={t.admin.projectsTitle}
        actions={
          <Button className="rounded-full" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            {t.admin.newProject}
          </Button>
        }
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {projetos.map((projeto) => (
          <li key={projeto.id}>
            <button type="button" onClick={() => setEditing(projeto)} className="flex h-full w-full flex-col gap-2 rounded-3xl border border-border/60 bg-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg font-semibold text-primary-deep">{projeto.nome}</p>
                <span className="flex gap-1">
                  <Chip tone="muted">{t.admin.tipos[projeto.tipo]}</Chip>
                  {projeto.ativo ? <Chip tone="mint">{t.admin.active}</Chip> : null}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {fmtDia(projeto.inicio)} – {fmtDia(projeto.fim)} · {projeto.totalDias} dias · {projeto.diasDescanso.length} de descanso
              </p>
              <p className="text-sm">
                {projeto.equipes} {t.admin.teams} · {projeto.membros} {t.admin.members}
                {projeto.tipo === "arrecadacao" && projeto.metaTotalCents ? ` · ${t.admin.totalGoal.toLowerCase()} ${fmtReais(projeto.metaTotalCents)}` : ""}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <ProjetoDialog
        key={editing === null ? "closed" : editing === "new" ? "new" : editing.id}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        projeto={editing === "new" ? null : editing}
        projetos={projetos}
        onSaved={() => {
          list.reload();
          void refreshEu();
        }}
      />
    </div>
  );
}

function ProjetoDialog({ open, onOpenChange, projeto, projetos, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; projeto: ProjetoAdmin | null; projetos: ProjetoAdmin[]; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [busy, setBusy] = useState(false);
  const blank = {
    nome: "",
    tipo: "arrecadacao" as ProjetoTipo,
    inicio: "",
    fim: "",
    ativo: true,
    diasDescanso: "",
    metaDiariaPadrao: "300",
    metaTotal: "",
    metas: Object.fromEntries(HJ_PROGRAMAS.map((programa) => [programa, ""])) as Record<HjPrograma, string>,
    fator: "1,3",
    arredondar: "50",
    minimo: "300",
    copiarDe: "",
  };
  // Mounted afresh for each project (the parent keys it), so the form
  // starts from that project's data — or, for a new one, from the last RM
  // project's teams.
  const [form, setForm] = useState(() => {
    if (!projeto) {
      const ultimo = projetos.find((item) => item.tipo === "arrecadacao");
      return { ...blank, copiarDe: ultimo?.id ?? "" };
    }
    return {
      nome: projeto.nome,
      tipo: projeto.tipo,
      inicio: projeto.inicio,
      fim: projeto.fim,
      ativo: projeto.ativo,
      diasDescanso: projeto.diasDescanso.join("\n"),
      metaDiariaPadrao: reais(projeto.metaDiariaPadraoCents),
      metaTotal: reais(projeto.metaTotalCents),
      metas: Object.fromEntries(HJ_PROGRAMAS.map((programa) => [programa, reais(projeto.metasPrograma.find((item) => item.programa === programa)?.metaCents ?? 0)])) as Record<HjPrograma, string>,
      fator: String(projeto.regraNovaMeta.fator).replace(".", ","),
      arredondar: reais(projeto.regraNovaMeta.arredondarCents),
      minimo: reais(projeto.regraNovaMeta.minimoCents),
      copiarDe: "",
    };
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const metaDiariaPadraoCents = centsOf(form.metaDiariaPadrao);
    const metaTotalCents = centsOf(form.metaTotal);
    const minimoCents = centsOf(form.minimo);
    const arredondarCents = centsOf(form.arredondar);
    const metasPrograma = HJ_PROGRAMAS.map((programa) => ({ programa, metaCents: centsOf(form.metas[programa]) }));
    if ([metaDiariaPadraoCents, metaTotalCents, minimoCents, arredondarCents, ...metasPrograma.map((item) => item.metaCents)].some((value) => value === null)) {
      toast.error("Confira os valores em reais");
      return;
    }
    setBusy(true);
    try {
      const body = {
        nome: form.nome,
        tipo: form.tipo,
        inicio: form.inicio,
        fim: form.fim,
        ativo: form.ativo,
        diasDescanso: form.diasDescanso.split(/[\n,;\s]+/).map((item) => item.trim()).filter(Boolean),
        metaDiariaPadraoCents,
        metaTotalCents,
        metasPrograma: metasPrograma.filter((item) => (item.metaCents ?? 0) > 0),
        regraNovaMeta: { fator: Number(form.fator.replace(",", ".")), arredondarCents, minimoCents },
        copiarEquipesDe: !projeto && form.copiarDe ? form.copiarDe : null,
      };
      if (projeto) {
        await api(`/api/admin/hj/projetos/${projeto.id}`, { method: "PATCH", body });
      } else {
        const reply = await api<{ equipesCopiadas: number }>("/api/admin/hj/projetos", { method: "POST", body });
        if (reply.equipesCopiadas > 0) toast.message(`${reply.equipesCopiadas} ${t.admin.teams} copiadas`);
      }
      toast.success(t.admin.projectSaved);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  const isRm = form.tipo === "arrecadacao";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{projeto ? t.admin.editProject : t.admin.newProject}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <div className="space-y-1.5">
              <Label htmlFor="pj-nome">{t.admin.projectName}</Label>
              <Input id="pj-nome" required autoFocus value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pj-tipo">{t.admin.projectType}</Label>
              <select id="pj-tipo" className={selectClass} value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as ProjetoTipo })}>
                <option value="arrecadacao">{t.admin.tipos.arrecadacao}</option>
                <option value="testemunho">{t.admin.tipos.testemunho}</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pj-inicio">{t.admin.start}</Label>
              <Input id="pj-inicio" type="date" required value={form.inicio} onChange={(event) => setForm({ ...form, inicio: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pj-fim">{t.admin.end}</Label>
              <Input id="pj-fim" type="date" required value={form.fim} onChange={(event) => setForm({ ...form, fim: event.target.value })} />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" checked={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.checked })} />
              {t.admin.active}
            </label>
          </div>

          {isRm ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="pj-descanso">{t.admin.restDays}</Label>
                <Textarea id="pj-descanso" rows={2} value={form.diasDescanso} onChange={(event) => setForm({ ...form, diasDescanso: event.target.value })} placeholder={t.admin.restDaysHint} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pj-meta-diaria">{t.admin.dailyGoal}</Label>
                  <MoneyInput id="pj-meta-diaria" value={form.metaDiariaPadrao} onChange={(value) => setForm({ ...form, metaDiariaPadrao: value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pj-meta-total">{t.admin.totalGoal}</Label>
                  <MoneyInput id="pj-meta-total" value={form.metaTotal} onChange={(value) => setForm({ ...form, metaTotal: value })} />
                </div>
              </div>
              <Eyebrow>{t.admin.programGoals}</Eyebrow>
              <div className="grid gap-3 sm:grid-cols-3">
                {HJ_PROGRAMAS.map((programa) => (
                  <div key={programa} className="space-y-1">
                    <Label htmlFor={`pj-meta-${programa}`} className="text-xs">
                      {programa}
                    </Label>
                    <MoneyInput id={`pj-meta-${programa}`} value={form.metas[programa]} onChange={(value) => setForm({ ...form, metas: { ...form.metas, [programa]: value } })} />
                  </div>
                ))}
              </div>
              <Eyebrow>{t.admin.newGoalRule}</Eyebrow>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="pj-fator" className="text-xs">
                    {t.admin.factor}
                  </Label>
                  <Input id="pj-fator" inputMode="decimal" value={form.fator} onChange={(event) => setForm({ ...form, fator: event.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pj-arredondar" className="text-xs">
                    {t.admin.rounding}
                  </Label>
                  <MoneyInput id="pj-arredondar" value={form.arredondar} onChange={(value) => setForm({ ...form, arredondar: value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pj-minimo" className="text-xs">
                    {t.admin.minimum}
                  </Label>
                  <MoneyInput id="pj-minimo" value={form.minimo} onChange={(value) => setForm({ ...form, minimo: value })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Nova meta = média × fator, arredondada para cima, nunca abaixo do mínimo.</p>
            </>
          ) : null}

          {!projeto ? (
            <div className="space-y-1.5">
              <Label htmlFor="pj-copiar">{t.admin.copyTeamsFrom}</Label>
              <select id="pj-copiar" className={selectClass} value={form.copiarDe} onChange={(event) => setForm({ ...form, copiarDe: event.target.value })}>
                <option value="">{t.admin.dontCopy}</option>
                {projetos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} ({item.equipes} {t.admin.teams})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || form.nome.trim().length < 2 || !form.inicio || !form.fim}>
              {busy ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

