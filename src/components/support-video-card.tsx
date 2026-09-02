"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getSupportVideoThumbnailUrl,
  getSupportVideoWatchUrl,
  type SupportVideo,
} from "@/lib/support-materials";

type SupportVideoCardProps = {
  item: SupportVideo;
};

export function SupportVideoCard({ item }: SupportVideoCardProps) {
  const thumbnailUrl = getSupportVideoThumbnailUrl(item);
  const [previewFailed, setPreviewFailed] = useState(!thumbnailUrl);

  return (
    <a
      href={getSupportVideoWatchUrl(item)}
      target="_blank"
      rel="noreferrer"
      className="group block h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden border-border/60 shadow-card transition group-hover:-translate-y-0.5 group-hover:shadow-glow">
        <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-primary-deep to-primary">
          {thumbnailUrl && !previewFailed ? (
            <img
              src={thumbnailUrl}
              alt={`Miniatura do vídeo ${item.title}`}
              width={480}
              height={360}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <Play className="h-14 w-14 text-white/90" />
          )}

          <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-primary-deep shadow-lg">
              <Play className="h-6 w-6 fill-current" />
            </span>
          </div>
        </div>

        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-lg leading-tight group-hover:text-primary">
            {item.title}
          </CardTitle>
          <CardDescription className="text-sm">{item.subtitle}</CardDescription>
        </CardHeader>
      </Card>
    </a>
  );
}
