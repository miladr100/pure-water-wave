"use client";

import { BookOpen, ExternalLink, FileText, Pencil, PlayCircle, Plus, Trash2 } from "lucide-react";
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
import { api } from "@/lib/academy/api-client";
import type { BibliotecaItemRow } from "@/lib/biblioteca/itens";
import type { UserLanguage } from "@/lib/user-languages";
import type { BibliotecaTipo } from "@/models/biblioteca-item";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TIPOS: BibliotecaTipo[] = ["livro", "material", "video"];
const ICONS = { livro: BookOpen, material: FileText, video: PlayCircle } as const;

// Administração › Biblioteca: the books, materials and videos added by
// link, on top of the ones that ship with the site. The shipped ones are
// listed read-only so the administrator sees the whole library.
export function BibliotecaScreen({ fixos }: { fixos: { tipo: BibliotecaTipo; titulo: string; idioma: string }[] }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const list = useApi<{ itens: BibliotecaItemRow[] }>("/api/admin/biblioteca");
  const [tipo, setTipo] = useState<BibliotecaTipo>("livro");
  const [editing, setEditing] = useState<BibliotecaItemRow | "new" | null>(null);

  if (list.error) {
    return <Failed error={list.error} onRetry={list.reload} />;
  }
  if (list.loading || !list.data) {
    return <LoadingBlock />;
  }

  const itens = list.data.itens.filter((item) => item.tipo === tipo);
  const fixosDoTipo = fixos.filter((item) => item.tipo === tipo);

  async function remove(item: BibliotecaItemRow) {
    if (!window.confirm(`${t.biblioteca.remove}: ${item.titulo}?`)) return;
    try {
      await api(`/api/admin/biblioteca/${item.id}`, { method: "DELETE" });
      toast.success(t.biblioteca.removed);
      list.reload();
    } catch (error) {
      toast.error(describeError(error, ta));
    }
  }

  async function togglePublished(item: BibliotecaItemRow) {
    try {
      await api(`/api/admin/biblioteca/${item.id}`, { method: "PATCH", body: { publicado: !item.publicado } });
      list.reload();
    } catch (error) {
      toast.error(describeError(error, ta));
    }
  }

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow={t.areas.admin}
        title={t.biblioteca.title}
        description={t.biblioteca.description}
        actions={
          <Button className="rounded-full" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            {t.biblioteca.add}
          </Button>
        }
      />

      <div className="inline-flex rounded-full bg-muted p-0.5">
        {TIPOS.map((item) => {
          const Icon = ICONS[item];
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTipo(item)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-muted-foreground",
                tipo === item && "bg-card text-primary-deep shadow-sm",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.biblioteca.tipos[item]}
              <span className="tabular-nums text-muted-foreground">{list.data!.itens.filter((i) => i.tipo === item).length + fixos.filter((i) => i.tipo === item).length}</span>
            </button>
          );
        })}
      </div>

      <Card className="p-0 sm:p-0">
        {itens.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">{t.biblioteca.empty}</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {itens.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    <span className="truncate">{item.titulo}</span>
                    <Chip tone="muted">{item.idioma.toUpperCase()}</Chip>
                    {!item.publicado ? <Chip tone="coral">{t.biblioteca.hidden}</Chip> : null}
                  </p>
                  {item.subtitulo ? <p className="text-sm text-muted-foreground">{item.subtitulo}</p> : null}
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    {item.url}
                  </a>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => void togglePublished(item)}>
                    {item.publicado ? t.biblioteca.hide : t.biblioteca.publish}
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(item)}>
                    <Pencil className="h-4 w-4" />
                    {t.common.edit}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => void remove(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {fixosDoTipo.length > 0 ? (
        <Card>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t.biblioteca.shipped}</p>
          <p className="mb-3 text-sm text-muted-foreground">{t.biblioteca.shippedHint}</p>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {fixosDoTipo.map((item) => (
              <li key={item.titulo} className="flex items-center gap-2">
                <span className="truncate">{item.titulo}</span>
                <span className="text-xs text-muted-foreground">{item.idioma.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <ItemDialog
        key={editing === null ? "closed" : editing === "new" ? `new-${tipo}` : editing.id}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        item={editing === "new" ? null : editing}
        tipoInicial={tipo}
        onSaved={() => list.reload()}
      />
    </div>
  );
}

function ItemDialog({
  open,
  onOpenChange,
  item,
  tipoInicial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BibliotecaItemRow | null;
  tipoInicial: BibliotecaTipo;
  onSaved: () => void;
}) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => ({
    tipo: item?.tipo ?? tipoInicial,
    titulo: item?.titulo ?? "",
    subtitulo: item?.subtitulo ?? "",
    idioma: (item?.idioma ?? "pt") as UserLanguage,
    url: item?.url ?? "",
    thumbnailUrl: item?.thumbnailUrl ?? "",
    publicado: item?.publicado ?? true,
  }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (item) {
        await api(`/api/admin/biblioteca/${item.id}`, { method: "PATCH", body: form });
      } else {
        await api("/api/admin/biblioteca", { method: "POST", body: form });
      }
      toast.success(t.biblioteca.saved);
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
          <DialogTitle>{item ? t.biblioteca.editItem : t.biblioteca.add}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <div className="space-y-1.5">
              <Label htmlFor="bi-tipo">{t.biblioteca.tipo}</Label>
              <select id="bi-tipo" className={selectClass} value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as BibliotecaTipo })}>
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {t.biblioteca.tipos[tipo]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bi-idioma">{t.biblioteca.idioma}</Label>
              <select id="bi-idioma" className={selectClass} value={form.idioma} onChange={(event) => setForm({ ...form, idioma: event.target.value as UserLanguage })}>
                <option value="pt">Português</option>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bi-titulo">{t.biblioteca.titulo}</Label>
            <Input id="bi-titulo" required autoFocus value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bi-subtitulo">{t.biblioteca.subtitulo}</Label>
            <Input id="bi-subtitulo" value={form.subtitulo} onChange={(event) => setForm({ ...form, subtitulo: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bi-url">{form.tipo === "video" ? t.biblioteca.urlVideo : t.biblioteca.url}</Label>
            <Input id="bi-url" type="url" required inputMode="url" placeholder="https://" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
            <p className="text-xs text-muted-foreground">{form.tipo === "video" ? t.biblioteca.urlVideoHint : t.biblioteca.urlHint}</p>
          </div>
          {form.tipo !== "video" ? (
            <div className="space-y-1.5">
              <Label htmlFor="bi-thumb">{t.biblioteca.thumbnail}</Label>
              <Input id="bi-thumb" inputMode="url" placeholder="https://" value={form.thumbnailUrl} onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })} />
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.publicado} onChange={(event) => setForm({ ...form, publicado: event.target.checked })} />
            {t.biblioteca.published}
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || form.titulo.trim().length < 2 || !form.url}>
              {busy ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
