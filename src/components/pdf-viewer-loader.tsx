"use client";

import { useEffect, useState } from "react";

import type { SessionPayload } from "@/lib/auth";
import type { LibraryPdf } from "@/lib/library-pdfs";

type PdfViewerLoaderProps = {
  pdf: LibraryPdf;
  session: SessionPayload;
  initialPage?: number;
  initialQuery?: string;
};

export function PdfViewerLoader({
  pdf,
  session,
  initialPage,
  initialQuery,
}: PdfViewerLoaderProps) {
  const [ViewerComponent, setViewerComponent] = useState<
    typeof import("@/components/pdf-viewer").PdfViewer | null
  >(null);

  useEffect(() => {
    void import("@/components/pdf-viewer").then((module) => {
      setViewerComponent(() => module.PdfViewer);
    });
  }, []);

  if (!ViewerComponent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Preparando leitor...
      </div>
    );
  }

  return (
    <ViewerComponent
      pdf={pdf}
      session={session}
      initialPage={initialPage}
      initialQuery={initialQuery}
    />
  );
}
