"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { NativePdfViewer } from "@/components/native-pdf-viewer";
import { useLocale } from "@/components/locale-provider";
import type { SessionPayload } from "@/lib/auth";
import type { LibraryPdf } from "@/lib/library-pdfs";
import { shouldUseNativePdfViewer } from "@/lib/pdf-ios";
import "@/lib/promise-with-resolvers-polyfill";

type PdfViewerLoaderProps = {
  pdf: LibraryPdf;
  session: SessionPayload;
  initialPage?: number;
  initialQuery?: string;
};

type PdfViewerComponent = typeof import("@/components/pdf-viewer").PdfViewer;

export function PdfViewerLoader({
  pdf,
  session,
  initialPage,
  initialQuery,
}: PdfViewerLoaderProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<"loading" | "pdfjs" | "native">("loading");
  const [ViewerComponent, setViewerComponent] =
    useState<PdfViewerComponent | null>(null);
  const handleUnrecoverableError = useCallback(() => {
    setMode("native");
  }, []);

  useEffect(() => {
    if (shouldUseNativePdfViewer()) {
      setMode("native");
      return;
    }

    void import("@/components/pdf-viewer")
      .then((module) => {
        setViewerComponent(() => module.PdfViewer);
        setMode("pdfjs");
      })
      .catch((error) => {
        console.error("Erro ao carregar o leitor de PDF:", error);
        setMode("native");
      });
  }, []);

  if (mode === "native") {
    return (
      <NativePdfViewer
        pdf={pdf}
        session={session}
        initialPage={initialPage}
      />
    );
  }

  if (mode === "pdfjs" && ViewerComponent) {
    return (
      <ViewerComponent
        pdf={pdf}
        session={session}
        initialPage={initialPage}
        initialQuery={initialQuery}
        onUnrecoverableError={handleUnrecoverableError}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-background via-secondary/30 to-background px-6 text-center">
      <BrandLogo className="h-12 w-12 opacity-80" />
      <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden />
      <div>
        <p className="font-display text-lg font-semibold text-primary-deep">
          {t.reader.openingTitle}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.reader.openingDescription}
        </p>
      </div>
    </div>
  );
}
