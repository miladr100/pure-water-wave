"use client";

import { useState } from "react";
import { BookOpen, BookOpenCheck } from "lucide-react";
import { Document, Page } from "react-pdf";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getProtectedPdfApiUrl,
  type LibraryPdf,
} from "@/lib/library-pdfs";
import { LibraryPdfCardLink } from "@/components/library-pdf-card-link";
import "@/lib/pdf-worker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

type LibraryPdfCardProps = {
  pdf: LibraryPdf;
};

export function LibraryPdfCard({ pdf }: LibraryPdfCardProps) {
  const previewSource = {
    url: getProtectedPdfApiUrl(pdf.id),
    withCredentials: true,
  };
  const [previewFailed, setPreviewFailed] = useState(false);

  return (
    <LibraryPdfCardLink pdfId={pdf.id}>
      <Card className="flex h-full flex-col overflow-hidden border-border/60 shadow-card transition group-hover:-translate-y-0.5 group-hover:shadow-glow">
        <div
          className={`relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br ${pdf.coverColor} p-4`}
        >
          {!previewFailed ? (
            <Document
              file={previewSource}
              loading={
                <div className="flex h-full w-full items-center justify-center text-sm text-white/80">
                  Carregando prévia...
                </div>
              }
              onLoadError={() => setPreviewFailed(true)}
              error={null}
            >
              <Page
                pageNumber={1}
                width={220}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="overflow-hidden rounded-md bg-white shadow-lg"
              />
            </Document>
          ) : (
            <BookOpen className="h-16 w-16 text-white/90" />
          )}

          <Badge className="absolute right-4 top-4 border-white/20 bg-white/15 text-white hover:bg-white/15">
            {pdf.language}
          </Badge>
        </div>

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
