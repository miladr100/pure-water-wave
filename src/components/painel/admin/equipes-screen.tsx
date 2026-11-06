"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { Eyebrow, Failed, LoadingBlock, Reais } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { refreshEu, usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/academy/api-client";
import { HJ_PROGRAMAS, type EquipeAdmin, type HjPrograma, type PessoaRow } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Reply = { projeto: { id: string; nome: string } | null; equipes: EquipeAdmin[] };

// The project's teams: who is in each, who captains it, who follows it.
export function EquipesScreen() {
  const t = usePainelMessages();
  const params = useSearchParams();
  const list = useApi<Reply>("/api/admin/hj/equipes");
  const people = useApi<{ pessoas: PessoaRow[] }>("/api/admin/hj/pessoas");
  // `?equipe=<id>` opens that team until the person chooses otherwise.
  const [chosen, setEditing] = useState<EquipeAdmin | "new" | null | undefined>(undefined);
  const wanted = params.get("equipe");
  const editing = chosen === undefined ? (list.data?.equipes.find((equipe) => equipe.id === wanted) ?? null) : chosen;

  if (list.error) {
    return <Failed error={list.error} onRetry={list.reload} />;
  }
  if (list.loading || !list.data) {
    return <LoadingBlock />;
  }
  const { projeto, equipes } = list.data;

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow={projeto?.nome ?? t.areas.admin}
        title={t.admin.teamsTitle}
        description={projeto ? `${equipes.length} ${t.admin.teams} · ${equipes.reduce((sum, equipe) => sum + equipe.membros.length, 0)} ${t.admin.members}` : t.common.noProject}
        actions={
          projeto ? (
            <Button className="rounded-full" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" />
              {t.admin.newTeam}
            </Button>
          ) : null
        }
      />

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {equipes.map((equipe) => (
          <li key={equipe.id}>
            <button type="button" onClick={() => setEditing(equipe)} className="flex h-full w-full flex-col gap-2 rounded-3xl border border-border/60 bg-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg font-semibold text-primary-deep">{equipe.nome}</p>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-primary-deep">{equipe.programa}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.admin.captain}: {equipe.capitao?.nome ?? t.admin.noCaptain} · {t.admin.educator}: {equipe.educador?.nome ?? "—"}
              </p>
              <p className="text-sm">
                {equipe.membros.length} {t.admin.members} · <Reais cents={equipe.liquidoCents} className="font-semibold" />
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{equipe.membros.map((membro) => membro.nome).join(", ")}</p>
            </button>
          </li>
        ))}
      </ul>

      {projeto ? (
        <EquipeDialog
          key={editing === null ? "closed" : editing === "new" ? "new" : editing.id}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          equipe={editing === "new" ? null : editing}
          projetoId={projeto.id}
          pessoas={people.data?.pessoas ?? []}
          equipes={equipes}
          onSaved={() => {
            list.reload();
            void refreshEu();
          }}
        />
      ) : null}
    </div>
  );
}

function EquipeDialog({
  open,
  onOpenChange,
  equipe,
  projetoId,
  pessoas,
  equipes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipe: EquipeAdmin | null;
  projetoId: string;
  pessoas: PessoaRow[];
  equipes: EquipeAdmin[];
  onSaved: () => void;
}) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [busy, setBusy] = useState(false);
  // Mounted afresh for each team (the parent keys it), so the form starts
  // from that team's data.
  const [form, setForm] = useState(() =>
    equipe
      ? { nome: equipe.nome, programa: equipe.programa, educadorId: equipe.educador?.id ?? "", capitaoId: equipe.capitao?.id ?? "", membroIds: equipe.membros.map((membro) => membro.id) }
      : { nome: "", programa: "HJA" as HjPrograma, educadorId: "", capitaoId: "", membroIds: [] as string[] },
  );
  const [adding, setAdding] = useState("");

  const byId = useMemo(() => new Map(pessoas.map((pessoa) => [pessoa.id, pessoa])), [pessoas]);
  const educadores = pessoas.filter((pessoa) => pessoa.papeis.educador);
  const elsewhere = useMemo(() => {
    const taken = new Map<string, string>();
    for (const other of equipes) {
      if (other.id === equipe?.id) continue;
      for (const membro of other.membros) taken.set(membro.id, other.nome);
    }
    return taken;
  }, [equipes, equipe]);
  const candidates = pessoas.filter((pessoa) => !form.membroIds.includes(pessoa.id) && !elsewhere.has(pessoa.id));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const body = { ...form, projetoId, educadorId: form.educadorId || null, capitaoId: form.capitaoId || null };
      if (equipe) {
        await api(`/api/admin/hj/equipes/${equipe.id}`, { method: "PATCH", body });
      } else {
        await api("/api/admin/hj/equipes", { method: "POST", body });
      }
      toast.success(t.admin.teamSaved);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!equipe || !window.confirm(`${t.admin.deleteTeam}: ${equipe.nome}?`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/hj/equipes/${equipe.id}`, { method: "DELETE" });
      toast.success(t.admin.teamDeleted);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{equipe ? t.admin.editTeam : t.admin.newTeam}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <div className="space-y-1.5">
              <Label htmlFor="eq-nome">{t.admin.teamName}</Label>
              <Input id="eq-nome" required autoFocus value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eq-programa">{t.admin.program}</Label>
              <select id="eq-programa" className={selectClass} value={form.programa} onChange={(event) => setForm({ ...form, programa: event.target.value as HjPrograma })}>
                {HJ_PROGRAMAS.map((programa) => (
                  <option key={programa} value={programa}>
                    {programa}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eq-educador">{t.admin.educator}</Label>
            <select id="eq-educador" className={selectClass} value={form.educadorId} onChange={(event) => setForm({ ...form, educadorId: event.target.value })}>
              <option value="">—</option>
              {educadores.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Eyebrow>{t.admin.membersLabel}</Eyebrow>
            <ul className="divide-y divide-border/60 rounded-2xl border border-border/60">
              {form.membroIds.length === 0 ? <li className="px-3 py-2 text-sm text-muted-foreground">{t.common.none}</li> : null}
              {form.membroIds.map((id) => (
                <li key={id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="capitao" checked={form.capitaoId === id} onChange={() => setForm({ ...form, capitaoId: id })} aria-label={`${t.admin.captain}: ${byId.get(id)?.nome ?? id}`} />
                    <span className={cn(form.capitaoId === id && "font-semibold")}>{byId.get(id)?.nome ?? id}</span>
                    {form.capitaoId === id ? <span className="text-xs text-muted-foreground">{t.admin.captain}</span> : null}
                  </label>
                  <button type="button" aria-label={`${t.admin.removeMember} ${byId.get(id)?.nome ?? ""}`} className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-primary-deep" onClick={() => setForm({ ...form, membroIds: form.membroIds.filter((item) => item !== id), capitaoId: form.capitaoId === id ? "" : form.capitaoId })}>
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <select className={selectClass} value={adding} onChange={(event) => setAdding(event.target.value)} aria-label={t.admin.addMember}>
                <option value="">{t.admin.addMember}…</option>
                {candidates.map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 rounded-xl"
                disabled={!adding}
                onClick={() => {
                  setForm({ ...form, membroIds: [...form.membroIds, adding] });
                  setAdding("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Quem já está em outra equipe deste projeto não aparece na lista.</p>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {equipe ? (
              <Button type="button" variant="ghost" className="text-destructive" disabled={busy} onClick={() => void remove()}>
                <Trash2 className="h-4 w-4" />
                {t.admin.deleteTeam}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={busy || form.nome.trim().length < 2}>
                {busy ? t.common.saving : t.admin.saveTeam}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
