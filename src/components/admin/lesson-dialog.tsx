"use client";

import { Check, ChevronsUpDown, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { toastError } from "@/components/admin/helpers";
import { LocalizedField } from "@/components/admin/localized-field";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/academy/api-client";
import type { LibraryVideo } from "@/lib/academy/bunny";
import type { AdminLesson } from "@/lib/academy/types";
import { EMPTY_LOCALIZED, type Localized } from "@/lib/academy/localized";
import { cn } from "@/lib/utils";

// The academy's videos live in Bunny Stream, the same private library the
// FFPUM academy uses: an educator picks a video that is already there, pastes
// its GUID, or uploads a file straight to Bunny. Nothing goes through
// YouTube.

type Material = { label: string; url: string };

type UploadAuth = {
  guid: string;
  upload: { endpoint: string; signature: string; expires: number; videoId: string; libraryId: string };
};

type VideoStatus = { state: "processing" | "ready" | "error"; durationMinutes: number };

const POLL_MS = 4000;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  moduleId: string;
  lesson: AdminLesson | null;
  bunnyUpload: boolean;
  onSaved: () => Promise<void> | void;
};

// Lives inside DialogContent, which Radix unmounts on close, so every
// opening starts from the lesson as it is on the server (or blank).
function LessonForm({
  courseId,
  moduleId,
  lesson,
  bunnyUpload,
  onSaved,
  onClose,
  onLockChange,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void; onLockChange: (locked: boolean) => void }) {
  const { t } = useLocale();
  const [title, setTitle] = useState<Localized>({ ...EMPTY_LOCALIZED, ...lesson?.title });
  const [description, setDescription] = useState<Localized>({ ...EMPTY_LOCALIZED, ...lesson?.description });
  const [durationMinutes, setDurationMinutes] = useState(lesson?.durationMinutes ?? 0);
  const [bunnyVideoId, setBunnyVideoId] = useState(lesson?.video.bunnyVideoId ?? "");
  const [materials, setMaterials] = useState<Material[]>(lesson?.materials.map((item) => ({ ...item })) ?? []);
  const [published, setPublished] = useState(lesson?.published ?? false);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pollHandle = useRef<ReturnType<typeof setInterval> | null>(null);

  const locked = busy || processing;

  useEffect(() => {
    onLockChange(locked);
  }, [locked, onLockChange]);

  useEffect(
    () => () => {
      if (pollHandle.current) clearInterval(pollHandle.current);
    },
    [],
  );

  async function save() {
    setBusy(true);
    try {
      let id = lesson?.id;
      if (!id) {
        const created = await api<{ lesson: AdminLesson }>(`/api/admin/cursos/${courseId}/aulas`, {
          method: "POST",
          body: { moduleId, title },
        });
        id = created.lesson.id;
      }

      await api(`/api/admin/aulas/${id}`, {
        method: "PATCH",
        body: {
          title,
          description,
          durationMinutes,
          video: { provider: "bunny", youtubeId: "", bunnyVideoId },
          materials,
          published,
        },
      });

      toast.success(t.admin.saved);
      onClose();
      await onSaved();
    } catch (error) {
      toastError(error, t.common.error);
      // The lesson may exist now even though a later step failed.
      if (!lesson) await onSaved();
    } finally {
      setBusy(false);
    }
  }

  function pollStatus(guid: string) {
    setProcessing(true);
    pollHandle.current = setInterval(async () => {
      try {
        const status = await api<VideoStatus>(`/api/admin/videos/${guid}/status`);
        if (status.state === "processing") return;

        if (pollHandle.current) clearInterval(pollHandle.current);
        setProcessing(false);
        if (status.state === "ready") {
          setDurationMinutes(status.durationMinutes);
          toast.success(t.admin.videoReady);
        } else {
          toast.error(t.common.error);
        }
      } catch (error) {
        if (pollHandle.current) clearInterval(pollHandle.current);
        setProcessing(false);
        toastError(error, t.common.error);
      }
    }, POLL_MS);
  }

  async function upload(file: File) {
    if (!lesson) return;
    setBusy(true);
    setUploadPct(0);
    try {
      const auth = await api<UploadAuth>(`/api/admin/aulas/${lesson.id}/upload`, { method: "POST" });
      setBunnyVideoId(auth.guid);

      const tus = await import("tus-js-client");
      await new Promise<void>((resolve, reject) => {
        const task = new tus.Upload(file, {
          endpoint: auth.upload.endpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            AuthorizationSignature: auth.upload.signature,
            AuthorizationExpire: String(auth.upload.expires),
            VideoId: auth.upload.videoId,
            LibraryId: auth.upload.libraryId,
          },
          metadata: { filetype: file.type, title: file.name },
          onProgress: (sent, total) => setUploadPct(Math.round((sent / total) * 100)),
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
        task.start();
      });

      pollStatus(auth.guid);
    } catch (error) {
      toastError(error, t.common.error);
    } finally {
      setUploadPct(null);
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <LocalizedField id="lesson-title" label={t.admin.lessonTitle} value={title} onChange={setTitle} required disabled={locked} />
      <LocalizedField
        id="lesson-description"
        label={t.admin.lessonDescription}
        value={description}
        onChange={setDescription}
        multiline
        disabled={locked}
      />

      <div className="space-y-2">
        <Label htmlFor="lesson-bunny">{t.admin.providerBunny}</Label>
        {bunnyUpload ? (
          <LibraryVideoPicker
            value={bunnyVideoId}
            disabled={locked}
            onPick={(video) => {
              setBunnyVideoId(video.guid);
              if (video.durationMinutes > 0) setDurationMinutes(video.durationMinutes);
            }}
          />
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="lesson-bunny"
            value={bunnyVideoId}
            onChange={(event) => setBunnyVideoId(event.target.value)}
            disabled={locked}
            autoComplete="off"
            placeholder="GUID"
            className="flex-1 font-mono text-xs"
          />
          {bunnyUpload && lesson ? (
            <>
              <input
                ref={fileInput}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void upload(file);
                }}
              />
              <Button type="button" variant="outline" disabled={locked} onClick={() => fileInput.current?.click()}>
                <Upload className="h-4 w-4" />
                {t.admin.uploadVideo}
              </Button>
            </>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{bunnyUpload ? t.admin.bunnyIdHint : t.admin.bunnyNotConfigured}</p>
        {uploadPct !== null ? (
          <div className="space-y-1">
            <Progress value={uploadPct} />
            <p className="text-xs text-muted-foreground">{t.admin.uploading(uploadPct)}</p>
          </div>
        ) : processing ? (
          <p className="text-xs text-muted-foreground">{t.admin.processing}</p>
        ) : null}
      </div>

      <div className="space-y-2 sm:max-w-xs">
        <Label htmlFor="lesson-duration">{t.admin.lessonDuration}</Label>
        <Input
          id="lesson-duration"
          type="number"
          min={0}
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(Number(event.target.value))}
          disabled={locked}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.admin.materials}</Label>
        {materials.map((material, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={material.label}
              placeholder={t.admin.materialLabel}
              aria-label={t.admin.materialLabel}
              onChange={(event) =>
                setMaterials((current) =>
                  current.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)),
                )
              }
              disabled={locked}
              className="w-2/5"
            />
            <Input
              value={material.url}
              placeholder={t.admin.materialUrl}
              aria-label={t.admin.materialUrl}
              type="url"
              onChange={(event) =>
                setMaterials((current) =>
                  current.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)),
                )
              }
              disabled={locked}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t.common.delete}
              className="shrink-0 text-muted-foreground"
              disabled={locked}
              onClick={() => setMaterials((current) => current.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={locked}
          onClick={() => setMaterials((current) => [...current, { label: "", url: "" }])}
        >
          <Plus className="h-4 w-4" />
          {t.admin.addMaterial}
        </Button>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <Switch checked={published} onCheckedChange={setPublished} disabled={locked} />
        {t.admin.published}
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={locked}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={locked || !title.pt.trim()}>
          {busy ? t.common.saving : t.common.save}
        </Button>
      </DialogFooter>
    </form>
  );
}

// The Bunny library, grouped by collection, with a text filter. Loaded the
// first time the list opens, so a dialog that only edits a title never calls
// Bunny.
function LibraryVideoPicker({
  value,
  disabled,
  onPick,
}: {
  value: string;
  disabled: boolean;
  onPick: (video: LibraryVideo) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<LibraryVideo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && videos === null && !loading) {
      setLoading(true);
      try {
        const data = await api<{ videos: LibraryVideo[] }>("/api/admin/videos");
        setVideos(data.videos);
      } catch (error) {
        toastError(error, t.common.error);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }
  }

  const selected = videos?.find((video) => video.guid === value) ?? null;
  const needle = filter.trim().toLowerCase();
  const shown = (videos ?? []).filter(
    (video) => !needle || video.title.toLowerCase().includes(needle) || video.collection.toLowerCase().includes(needle),
  );
  const groups = new Map<string, LibraryVideo[]>();
  for (const video of shown) {
    const list = groups.get(video.collection) ?? [];
    list.push(video);
    groups.set(video.collection, list);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between font-normal"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => void toggle()}
      >
        <span className="truncate">{selected ? selected.title : t.admin.pickLibraryVideo}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
      </Button>
      {open ? (
        <div className="rounded-xl border border-border/60 bg-card p-2 shadow-card">
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={t.admin.libraryVideoSearch}
            aria-label={t.admin.libraryVideoSearch}
            autoFocus
            className="mb-2"
          />
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {loading ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">{t.admin.libraryVideoLoading}</p>
            ) : shown.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">{t.admin.libraryVideoNone}</p>
            ) : (
              [...groups.entries()].map(([collection, list]) => (
                <div key={collection || "—"}>
                  {collection ? (
                    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {collection}
                    </p>
                  ) : null}
                  <ul>
                    {list.map((video) => (
                      <li key={video.guid}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary/60",
                            video.guid === value && "bg-secondary",
                          )}
                          onClick={() => {
                            onPick(video);
                            setOpen(false);
                          }}
                        >
                          <Check className={cn("h-4 w-4 shrink-0", video.guid === value ? "opacity-100" : "opacity-0")} />
                          <span className="min-w-0 flex-1 truncate">{video.title}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {video.state === "ready" ? t.common.minutes(video.durationMinutes) : t.admin.processing}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function LessonDialog({ open, onOpenChange, lesson, ...rest }: Props) {
  const { t } = useLocale();
  const [locked, setLocked] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing mid-upload would orphan the Bunny video.
        if (!locked) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lesson ? t.admin.edit : t.admin.newLesson}</DialogTitle>
          <DialogDescription>{lesson ? lesson.title.pt : t.admin.lessonsOf}</DialogDescription>
        </DialogHeader>
        <LessonForm {...rest} lesson={lesson} onClose={() => onOpenChange(false)} onLockChange={setLocked} />
      </DialogContent>
    </Dialog>
  );
}
