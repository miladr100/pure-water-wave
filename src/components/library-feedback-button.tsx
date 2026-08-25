"use client";

import { ImagePlus, MessageSquareWarning, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type FeedbackType = "error" | "suggestion";

type LibraryFeedbackButtonProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

type ImagePreview = {
  id: string;
  file: File;
  url: string;
};

export function LibraryFeedbackButton({
  open,
  onOpenChange,
}: LibraryFeedbackButtonProps) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [internalOpen, setInternalOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("error");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const isOpen = open ?? internalOpen;

  function clearImages() {
    setImages((current) => {
      for (const image of current) {
        URL.revokeObjectURL(image.url);
      }
      return [];
    });
  }

  function resetForm() {
    setType("error");
    setMessage("");
    setLink("");
    clearImages();
    setError("");
    setInfo("");
    setIsSending(false);
  }

  function setIsOpen(nextOpen: boolean) {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  }

  function handleImagesChange(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const incoming = Array.from(fileList);
    setError("");

    setImages((current) => {
      const next = [...current];

      for (const file of incoming) {
        if (next.length >= MAX_IMAGES) {
          break;
        }

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          setError(t.feedback.imagesHint);
          continue;
        }

        if (file.size > MAX_IMAGE_BYTES) {
          setError(t.feedback.imagesHint);
          continue;
        }

        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${next.length}`,
          file,
          url: URL.createObjectURL(file),
        });
      }

      return next;
    });
  }

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) {
        URL.revokeObjectURL(image.url);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setError("");
    setInfo("");

    try {
      const payload = new FormData();
      payload.set("type", type);
      payload.set("message", message);
      payload.set("page", pathname);
      payload.set("link", link.trim());

      for (const image of images) {
        payload.append("images", image.file);
      }

      const response = await fetch("/api/biblioteca/feedback", {
        method: "POST",
        body: payload,
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? t.feedback.sendFailed);
      }

      setInfo(t.feedback.sent);
      setMessage("");
      setLink("");
      clearImages();
    } catch {
      setError(t.feedback.sendFailed);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquareWarning className="h-4 w-4" />
          {t.feedback.button}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.feedback.title}</DialogTitle>
          <DialogDescription>{t.feedback.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Label>{t.feedback.typeLabel}</Label>
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as FeedbackType)}
              className="grid gap-3 sm:grid-cols-2"
              disabled={isSending}
            >
              <Label
                htmlFor="feedback-type-error"
                className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-normal"
              >
                <RadioGroupItem id="feedback-type-error" value="error" />
                {t.feedback.typeError}
              </Label>
              <Label
                htmlFor="feedback-type-suggestion"
                className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-normal"
              >
                <RadioGroupItem id="feedback-type-suggestion" value="suggestion" />
                {t.feedback.typeSuggestion}
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">{t.feedback.messageLabel}</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t.feedback.messagePlaceholder}
              className="min-h-32"
              maxLength={4000}
              required
              minLength={10}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-link">{t.feedback.linkLabel}</Label>
            <Input
              id="feedback-link"
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder={t.feedback.linkPlaceholder}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-images">{t.feedback.imagesLabel}</Label>
            <p className="text-xs text-muted-foreground">{t.feedback.imagesHint}</p>
            <label
              htmlFor="feedback-images"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input px-3 py-6 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ImagePlus className="h-4 w-4" />
              {t.feedback.imagesLabel}
            </label>
            <Input
              id="feedback-images"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              multiple
              className="sr-only"
              disabled={isSending || images.length >= MAX_IMAGES}
              onChange={(event) => {
                handleImagesChange(event.target.files);
                event.target.value = "";
              }}
            />
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative overflow-hidden rounded-md border border-border"
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                      aria-label={t.feedback.removeImage}
                      disabled={isSending}
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="min-h-5 text-sm">
            {error ? <p className="text-destructive">{error}</p> : null}
            {info ? (
              <p className="text-emerald-700 dark:text-emerald-400">{info}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSending || message.trim().length < 10}>
              {isSending ? t.feedback.sending : t.feedback.send}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
