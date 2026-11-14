"use client";

import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { Card, Failed, LoadingBlock } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/academy/api-client";
import type { AreaBody, AreaNode, AreaTipo } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

type Editing = { mode: "new"; tipo: AreaTipo; paiId: string | null; paiNome: string } | { mode: "edit"; area: AreaNode };

// The mission areas tree (Organização › Áreas de missão): regions, the
// countries in them, the locals in each country. Teams point at locals.
export function AreasScreen() {
  const t = usePainelMessages();
  const list = useApi<{ areas: AreaNode[] }>("/api/admin/hj/areas");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  if (list.error) {
    return <Failed error={list.error} onRetry={list.reload} />;
  }
  if (list.loading || !list.data) {
    return <LoadingBlock />;
  }
  const areas = list.data.areas;
  const filhos = (paiId: string | null) => areas.filter((area) => area.paiId === paiId);
  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const tipoLabel: Record<AreaTipo, string> = { regiao: t.missao.regiao, pais: t.missao.pais, local: t.missao.local };
  const filhoTipo: Record<AreaTipo, AreaTipo | null> = { regiao: "pais", pais: "local", local: null };
  const addLabel: Record<AreaTipo, string> = { regiao: t.missao.addRegiao, pais: t.missao.addPais, local: t.missao.addLocal };

  function Row({ area, depth }: { area: AreaNode; depth: number }) {
    const children = filhos(area.id);
    const expandable = area.tipo !== "local";
    const isOpen = open.has(area.id) || depth === 0;
    const childType = filhoTipo[area.tipo];
    return (
      <li>
        <div className={cn("flex items-center gap-2 rounded-2xl px-2 py-1.5 hover:bg-secondary/50", !area.ativo && "opacity-60")} style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}>
          {expandable ? (
            <button type="button" onClick={() => toggle(area.id)} aria-label={isOpen ? t.missao.collapseAll : t.missao.expandAll} className="rounded-full p-0.5 text-muted-foreground hover:text-primary-deep">
              <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
            </button>
          ) : (
            <span className="w-5" />
          )}
          <span className={cn("min-w-0 flex-1 truncate text-sm", area.tipo === "regiao" && "font-semibold text-primary-deep", area.tipo === "local" && "text-muted-foreground")}>
            {area.nome}
            {!area.ativo ? <span className="ml-2 text-xs text-muted-foreground">(inativa)</span> : null}
          </span>
          {area.tipo === "local" ? (
            <Chip tone={area.equipes > 0 ? "primary" : "muted"}>
              {area.equipes} {t.admin.teams}
            </Chip>
          ) : null}
          {childType ? (
            <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setEditing({ mode: "new", tipo: childType, paiId: area.id, paiNome: area.nome })}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{addLabel[childType]}</span>
            </Button>
          ) : null}
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label={`${t.common.edit} ${area.nome}`} onClick={() => setEditing({ mode: "edit", area })}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        {expandable && isOpen && children.length > 0 ? (
          <ul>
            {children.map((child) => (
              <Row key={child.id} area={child} depth={depth + 1} />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow={t.admin.orgTitle}
        title={t.missao.title}
        description={t.missao.body}
        actions={
          <>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(new Set(areas.map((area) => area.id)))}>
              {t.missao.expandAll}
            </Button>
            <Button className="rounded-full" onClick={() => setEditing({ mode: "new", tipo: "regiao", paiId: null, paiNome: "" })}>
              <Plus className="h-4 w-4" />
              {t.missao.addRegiao}
            </Button>
          </>
        }
      />
      <Card>
        <ul className="space-y-0.5">
          {filhos(null).map((area) => (
            <Row key={area.id} area={area} depth={0} />
          ))}
        </ul>
      </Card>

      <AreaDialog
        key={editing === null ? "closed" : editing.mode === "new" ? `new:${editing.tipo}:${editing.paiId}` : editing.area.id}
        editing={editing}
        tipoLabel={tipoLabel}
        onClose={() => setEditing(null)}
        onSaved={() => list.reload()}
      />
    </div>
  );
}

function AreaDialog({ editing, tipoLabel, onClose, onSaved }: { editing: Editing | null; tipoLabel: Record<AreaTipo, string>; onClose: () => void; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [nome, setNome] = useState(editing?.mode === "edit" ? editing.area.nome : "");
  const [ativo, setAtivo] = useState(editing?.mode === "edit" ? editing.area.ativo : true);
  const [busy, setBusy] = useState(false);
  if (!editing) {
    return null;
  }
  const tipo = editing.mode === "new" ? editing.tipo : editing.area.tipo;

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      if (editing.mode === "new") {
        const body: AreaBody = { tipo: editing.tipo, nome, paiId: editing.paiId };
        await api("/api/admin/hj/areas", { method: "POST", body });
      } else {
        await api(`/api/admin/hj/areas/${editing.area.id}`, { method: "PATCH", body: { nome, ativo } });
      }
      toast.success(t.missao.saved);
      onSaved();
      onClose();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (editing?.mode !== "edit" || !window.confirm(`Apagar ${editing.area.nome}?`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/hj/areas/${editing.area.id}`, { method: "DELETE" });
      toast.success(t.missao.deleted);
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
            {editing.mode === "new" ? `${tipoLabel[tipo]}${editing.paiNome ? ` · ${editing.paiNome}` : ""}` : `${tipoLabel[tipo]} · ${editing.area.nome}`}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="area-nome">{t.missao.name}</Label>
            <Input id="area-nome" autoFocus required value={nome} onChange={(event) => setNome(event.target.value)} maxLength={80} />
          </div>
          {editing.mode === "edit" ? (
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>{t.admin.active}</span>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </label>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-between">
            {editing.mode === "edit" ? (
              <Button type="button" variant="ghost" className="text-destructive" disabled={busy} onClick={() => void remove()}>
                <Trash2 className="h-4 w-4" />
                Apagar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={busy || nome.trim().length < 2}>
                {busy ? t.common.saving : t.common.save}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
