"use client";

import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

const MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const OUTPUT_QUALITY = 0.86;

// The chosen picture is cropped to its centred square and scaled to 512×512
// JPEG in the browser, so the server only ever stores one small shape.
async function cropToSquare(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("decode"));
      element.src = url;
    });

    const side = Math.min(image.naturalWidth, image.naturalHeight);
    if (!side) {
      throw new Error("decode");
    }
    const sx = Math.floor((image.naturalWidth - side) / 2);
    const sy = Math.floor((image.naturalHeight - side) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas");
    }
    // PNGs with transparency would otherwise come out black in JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("encode"))),
        "image/jpeg",
        OUTPUT_QUALITY,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Lives inside the dialog's content, which Radix unmounts on close, so every
// opening starts from a clean picker.
function PhotoPicker({
  busy,
  setBusy,
  onSaved,
  onCancel,
}: {
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!preview) {
      return;
    }
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setError(null);
    setBlob(null);
    setPreview(null);

    if (file.size > MAX_SOURCE_BYTES) {
      setError(t.profile.photoTooLarge);
      return;
    }

    setBusy(true);
    try {
      const cropped = await cropToSquare(file);
      setBlob(cropped);
      setPreview(URL.createObjectURL(cropped));
    } catch {
      setError(t.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!blob) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      // `api()` JSON-encodes its body; the photo goes up as raw JPEG bytes.
      const response = await fetch("/api/academia/me/foto", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(
          response.status === 413
            ? t.profile.photoTooLarge
            : data.error?.trim() || t.common.error,
        );
        return;
      }

      toast.success(t.profile.photoSaved);
      onSaved();
    } catch {
      setError(t.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void handleFile(event)}
        disabled={busy}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="mx-auto flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-secondary/40 text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        aria-label={t.profile.changePhoto}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-10 w-10" />
        )}
      </button>

      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={onCancel}
          disabled={busy}
        >
          {t.common.cancel}
        </Button>
        <Button
          type="button"
          className="rounded-full"
          onClick={() => void handleSave()}
          disabled={busy || !blob}
        >
          {busy ? t.profile.uploading : t.common.save}
        </Button>
      </DialogFooter>
    </>
  );
}

export function PhotoDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => (busy ? undefined : onOpenChange(next))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-primary-deep">
            {t.profile.changePhoto}
          </DialogTitle>
          <DialogDescription>{t.profile.photoHint}</DialogDescription>
        </DialogHeader>
        <PhotoPicker
          busy={busy}
          setBusy={setBusy}
          onSaved={() => {
            onSaved();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
