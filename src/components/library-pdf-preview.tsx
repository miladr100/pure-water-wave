"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getLibraryPdfPreviewUrl,
  type LibraryPdf,
} from "@/lib/library-pdfs";

type LibraryPdfPreviewProps = {
  pdf: LibraryPdf;
};

export function LibraryPdfPreview({ pdf }: LibraryPdfPreviewProps) {
  const [previewFailed, setPreviewFailed] = useState(false);

  return (
    <div
      className={`relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br ${pdf.coverColor} p-4`}
    >
      {!previewFailed ? (
        <img
          src={getLibraryPdfPreviewUrl(pdf.id)}
          alt={`Prévia de ${pdf.title}`}
          width={220}
          height={286}
          loading="lazy"
          decoding="async"
          className="max-h-[240px] w-[220px] rounded-md bg-white object-contain object-top shadow-lg"
          onError={() => setPreviewFailed(true)}
        />
      ) : (
        <BookOpen className="h-16 w-16 text-white/90" />
      )}

      <Badge className="absolute right-4 top-4 border-white/20 bg-white/15 text-white hover:bg-white/15">
        {pdf.language}
      </Badge>
    </div>
  );
}
