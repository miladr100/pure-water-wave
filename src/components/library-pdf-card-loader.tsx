"use client";

import { LibraryPdfCard } from "@/components/library-pdf-card";
import type { LibraryPdf } from "@/lib/library-pdfs";

type LibraryPdfCardLoaderProps = {
  pdf: LibraryPdf;
};

export function LibraryPdfCardLoader({ pdf }: LibraryPdfCardLoaderProps) {
  return <LibraryPdfCard pdf={pdf} />;
}
