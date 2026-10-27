"use client";

import { Plus, Trash2, Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/academy/api-client";
import type { AdminLesson } from "@/lib/academy/types";
import { getYoutubeThumbnailUrl, parseYoutubeId } from "@/lib/academy/youtube";
import { EMPTY_LOCALIZED, type Localized } from "@/lib/academy/localized";
import type { VideoProvider } from "@/models/lesson";

// Mirrors the model's list; importing the model itself would ship mongoose
// to the browser.
const VIDEO_PROVIDERS: VideoProvider[] = ["youtube", "bunny"];

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
  const [provider, setProvider] = useState<VideoProvider>(lesson?.video.provider ?? "youtube");
  const [youtubeId, setYoutubeId] = useState(lesson?.video.youtubeId ?? "");
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

  const parsedYoutubeId = youtubeId.trim() ? parseYoutubeId(youtubeId) : null;

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
          video: { provider, youtubeId, bunnyVideoId },
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
      setProvider("bunny");
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lesson-provider">{t.admin.lessonVideo}</Label>
          <Select value={provider} onValueChange={(value) => setProvider(value as VideoProvider)} disabled={locked}>
            <SelectTrigger id="lesson-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_PROVIDERS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === "youtube" ? t.admin.providerYoutube : t.admin.providerBunny}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
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
      </div>

      {provider === "youtube" ? (
        <div className="space-y-2">
          <Label htmlFor="lesson-youtube">{t.admin.providerYoutube}</Label>
          <Input
            id="lesson-youtube"
            value={youtubeId}
            onChange={(event) => setYoutubeId(event.target.value)}
            disabled={locked}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">{t.admin.youtubeIdHint}</p>
          {parsedYoutubeId ? (
            // Plain <img>: a remote host that is not in next.config's allow-list.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getYoutubeThumbnailUrl(parsedYoutubeId)}
              alt=""
              className="aspect-video w-48 rounded-lg object-cover"
            />
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lesson-bunny">{t.admin.providerBunny}</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="lesson-bunny"
              value={bunnyVideoId}
              onChange={(event) => setBunnyVideoId(event.target.value)}
              disabled={locked}
              autoComplete="off"
              className="flex-1"
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
          <p className="text-xs text-muted-foreground">{t.admin.bunnyIdHint}</p>
          {uploadPct !== null ? (
            <div className="space-y-1">
              <Progress value={uploadPct} />
              <p className="text-xs text-muted-foreground">{t.admin.uploading(uploadPct)}</p>
            </div>
          ) : processing ? (
            <p className="text-xs text-muted-foreground">{t.admin.processing}</p>
          ) : null}
        </div>
      )}

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
