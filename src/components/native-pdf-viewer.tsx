"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { LibrarySettingsMenu } from "@/components/library-settings-menu";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import type { SessionPayload } from "@/lib/auth";
import {
  getProtectedPdfApiUrl,
  type LibraryPdf,
} from "@/lib/library-pdfs";
import { isAppleTouchDevice } from "@/lib/pdf-ios";

type NativePdfViewerProps = {
  pdf: LibraryPdf;
  session: SessionPayload;
  initialPage?: number;
};

export function NativePdfViewer({
  pdf,
  session,
  initialPage,
}: NativePdfViewerProps) {
  const { t } = useLocale();
  const pdfUrl = getProtectedPdfApiUrl(pdf.id);
  const embedUrl =
    initialPage && initialPage > 1 ? `${pdfUrl}#page=${initialPage}` : pdfUrl;
  const openInSafariOnly = isAppleTouchDevice();

  return (
    <div className="flex h-[100dvh] flex-col bg-gradient-to-b from-background via-secondary/30 to-background">
      <header className="select-none border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <LibrarySettingsMenu
              fullName={session.fullName}
              logoClassName="h-9 w-9"
            />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-primary-deep">
                {pdf.title}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {pdf.subtitle} · {session.fullName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/biblioteca">
                <ArrowLeft className="h-4 w-4" />
                {t.common.library}
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {openInSafariOnly ? (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.reader.nativeHint}
          </p>
          <Button asChild size="lg">
            <a href={embedUrl}>
              <BookOpen className="h-4 w-4" />
              {t.reader.openInBrowser}
            </a>
          </Button>
        </main>
      ) : (
        <>
          <div className="relative min-h-0 flex-1 bg-neutral-200">
            <iframe
              title={pdf.title}
              src={embedUrl}
              className="absolute inset-0 h-full w-full border-0 bg-white"
            />
          </div>
          <div className="flex items-center justify-center gap-3 border-t border-border/60 bg-card/80 px-4 py-3">
            <p className="hidden text-sm text-muted-foreground sm:block">
              {t.reader.nativeHint}
            </p>
            <Button asChild variant="outline" size="sm">
              <a href={embedUrl}>
                <BookOpen className="h-4 w-4" />
                {t.reader.openInBrowser}
              </a>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
