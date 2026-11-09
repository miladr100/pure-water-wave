"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
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

// Whether this device wants the native viewer is a property of the browser,
// not state: read once on the client, never on the server.
const noSubscription = () => () => {};
const neverNativeOnServer = () => false;

export function PdfViewerLoader({
  pdf,
  session,
  initialPage,
  initialQuery,
}: PdfViewerLoaderProps) {
  const { t } = useLocale();
  const nativePreferred = useSyncExternalStore(noSubscription, shouldUseNativePdfViewer, neverNativeOnServer);
  const [forcedNative, setForcedNative] = useState(false);
  const [ViewerComponent, setViewerComponent] =
    useState<PdfViewerComponent | null>(null);
  const handleUnrecoverableError = useCallback(() => {
    setForcedNative(true);
  }, []);

  useEffect(() => {
    if (nativePreferred) {
      return;
    }

    let cancelled = false;
    void import("@/components/pdf-viewer")
      .then((module) => {
        if (!cancelled) setViewerComponent(() => module.PdfViewer);
      })
      .catch((error) => {
        console.error("Erro ao carregar o leitor de PDF:", error);
        if (!cancelled) setForcedNative(true);
      });

    return () => {
      cancelled = true;
    };
  }, [nativePreferred]);

  const mode = nativePreferred || forcedNative ? "native" : ViewerComponent ? "pdfjs" : "loading";

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
        // A different book or starting point is a fresh viewer.
        key={`${pdf.id}:${initialPage ?? ""}:${initialQuery ?? ""}`}
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
