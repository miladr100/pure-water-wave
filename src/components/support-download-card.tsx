"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SupportDownload } from "@/lib/support-materials";

type SupportDownloadCardProps = {
  item: SupportDownload;
};

export function SupportDownloadCard({ item }: SupportDownloadCardProps) {
  const { t } = useLocale();
  const [previewFailed, setPreviewFailed] = useState(false);

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/60 shadow-card">
      <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-primary-deep to-primary p-4">
        {!previewFailed ? (
          <img
            src={item.thumbnailUrl}
            alt={`Miniatura de ${item.title}`}
            width={200}
            height={260}
            loading="lazy"
            decoding="async"
            className="max-h-[220px] w-[180px] rounded-md bg-white object-contain object-top shadow-lg"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <FileText className="h-14 w-14 text-white/90" />
        )}
      </div>

      <CardHeader className="space-y-2">
        <CardTitle className="font-display text-lg leading-tight">
          {item.title}
        </CardTitle>
        <CardDescription className="text-sm">
          {t.support.downloadSubtitle}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto">
        <Button asChild className="w-full">
          <a href={item.fileUrl} download target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" />
            {t.support.downloadPdf}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
