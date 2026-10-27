"use client";

import { Globe, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { ExamEditor } from "@/components/admin/exam-editor";
import { toastError } from "@/components/admin/helpers";
import { LessonDialog } from "@/components/admin/lesson-dialog";
import { LocalizedField } from "@/components/admin/localized-field";
import { useLocale } from "@/components/academy/locale-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/academy/api-client";
import type { AdminCourseStructure, AdminExam, AdminLesson } from "@/lib/academy/types";
import type { Localized } from "@/lib/academy/localized";

type Module = AdminCourseStructure["course"]["modules"][number];

function LessonRow({
  lesson,
  onEdit,
  onDeleted,
}: {
  lesson: AdminLesson;
  onEdit: () => void;
  onDeleted: () => Promise<void> | void;
}) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const ProviderIcon = lesson.video.provider === "bunny" ? Lock : Globe;

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/admin/aulas/${lesson.id}`, { method: "DELETE" });
      await onDeleted();
    } catch (error) {
      toastError(error, t.common.error);
    } finally {
      setBusy(false);
    }
  }

  const deleteButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t.common.delete}
      className="text-muted-foreground hover:text-destructive"
      disabled={busy || lesson.hasProgress}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  return (
    <li className="flex items-center gap-3 py-3">
      <span className="w-8 shrink-0 text-right font-display text-lg text-primary">{lesson.number}</span>
      <ProviderIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{lesson.title.pt}</p>
        <p className="text-xs text-muted-foreground">{t.common.minutes(lesson.durationMinutes)}</p>
      </div>
      <Badge variant={lesson.published ? "default" : "outline"} className="hidden sm:inline-flex">
        {lesson.published ? t.admin.published : t.admin.draft}
      </Badge>
      <Button type="button" variant="ghost" size="icon" aria-label={t.admin.edit} onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      {lesson.hasProgress ? (
        <Tooltip>
          {/* A disabled button swallows pointer events, so the span carries the tooltip. */}
          <TooltipTrigger asChild>
            <span tabIndex={0}>{deleteButton}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{t.admin.cannotDeleteWithProgress}</TooltipContent>
        </Tooltip>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>{deleteButton}</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{lesson.title.pt}</AlertDialogTitle>
              <AlertDialogDescription>{t.admin.deleteConfirm}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={() => void remove()}>{t.common.delete}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  );
}

function RenameModuleDialog({ module, onRename }: { module: Module; onRename: (title: Localized) => Promise<void> }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<Localized>(module.title);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onRename(title);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setTitle(module.title);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={t.admin.edit}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t.admin.moduleTitle}</DialogTitle>
          </DialogHeader>
          <LocalizedField id={`module-${module.id}-title`} value={title} onChange={setTitle} required disabled={busy} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || !title.pt.trim()}>
              {busy ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ModuleSection({
  courseId,
  module,
  lessons,
  exam,
  bunnyUpload,
  onRename,
  onDelete,
  onChanged,
}: {
  courseId: string;
  module: Module;
  lessons: AdminLesson[];
  exam: AdminExam | null;
  bunnyUpload: boolean;
  onRename: (title: Localized) => Promise<void>;
  onDelete: () => Promise<void>;
  onChanged: () => Promise<void>;
}) {
  const { t } = useLocale();
  const [editing, setEditing] = useState<AdminLesson | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const canDelete = lessons.length === 0 && !exam;

  function openDialog(lesson: AdminLesson | null) {
    setEditing(lesson);
    setDialogOpen(true);
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate font-display text-xl font-semibold text-primary-deep">
            {t.course.module(module.number)} · {module.title.pt}
          </h2>
          <RenameModuleDialog module={module} onRename={onRename} />
          {canDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t.common.delete}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{module.title.pt}</AlertDialogTitle>
                  <AlertDialogDescription>{t.admin.deleteConfirm}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void onDelete()}>{t.common.delete}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => openDialog(null)}>
          <Plus className="h-4 w-4" />
          {t.admin.newLesson}
        </Button>
      </header>

      {lessons.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">{t.common.lessons(0)}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} onEdit={() => openDialog(lesson)} onDeleted={onChanged} />
          ))}
        </ul>
      )}

      <div className="mt-5">
        <ExamEditor courseId={courseId} scope="module" moduleId={module.id} exam={exam} onChanged={onChanged} />
      </div>

      <LessonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={courseId}
        moduleId={module.id}
        lesson={editing}
        bunnyUpload={bunnyUpload}
        onSaved={onChanged}
      />
    </section>
  );
}
