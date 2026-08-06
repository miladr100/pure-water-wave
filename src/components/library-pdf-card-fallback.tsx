"use client";

import { BookOpenCheck } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LibraryPdfCardLink } from "@/components/library-pdf-card-link";
import { LibraryPdfPreview } from "@/components/library-pdf-preview";
import type { LibraryPdf } from "@/lib/library-pdfs";

type LibraryPdfCardFallbackProps = {
  pdf: LibraryPdf;
};

export function LibraryPdfCardFallback({ pdf }: LibraryPdfCardFallbackProps) {
  const { t } = useLocale();

  return (
    <LibraryPdfCardLink pdfId={pdf.id}>
      <Card className="flex h-full flex-col overflow-hidden border-border/60 shadow-card">
        <LibraryPdfPreview pdf={pdf} />

        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-xl leading-tight">
            {pdf.title}
          </CardTitle>
          <CardDescription className="text-sm">{pdf.subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="mt-auto">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            {t.pdfCard.readMaterial}
            <BookOpenCheck className="h-4 w-4" />
          </p>
        </CardContent>
      </Card>
    </LibraryPdfCardLink>
  );
}
