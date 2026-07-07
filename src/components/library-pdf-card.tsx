"use client";

import { BookOpenCheck } from "lucide-react";

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

type LibraryPdfCardProps = {
  pdf: LibraryPdf;
};

export function LibraryPdfCard({ pdf }: LibraryPdfCardProps) {
  return (
    <LibraryPdfCardLink pdfId={pdf.id}>
      <Card className="flex h-full flex-col overflow-hidden border-border/60 shadow-card transition group-hover:-translate-y-0.5 group-hover:shadow-glow">
        <LibraryPdfPreview pdf={pdf} />

        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-xl leading-tight group-hover:text-primary">
            {pdf.title}
          </CardTitle>
          <CardDescription className="text-sm">{pdf.subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="mt-auto">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            Ler material
            <BookOpenCheck className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </p>
        </CardContent>
      </Card>
    </LibraryPdfCardLink>
  );
}
