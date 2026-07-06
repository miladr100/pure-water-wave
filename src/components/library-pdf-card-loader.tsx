"use client";

import { useEffect, useState } from "react";

import { LibraryPdfCardFallback } from "@/components/library-pdf-card-fallback";
import type { LibraryPdf } from "@/lib/library-pdfs";

type LibraryPdfCardLoaderProps = {
  pdf: LibraryPdf;
};

export function LibraryPdfCardLoader({ pdf }: LibraryPdfCardLoaderProps) {
  const [CardComponent, setCardComponent] = useState<
    typeof import("@/components/library-pdf-card").LibraryPdfCard | null
  >(null);

  useEffect(() => {
    void import("@/components/library-pdf-card").then((module) => {
      setCardComponent(() => module.LibraryPdfCard);
    });
  }, []);

  if (!CardComponent) {
    return <LibraryPdfCardFallback pdf={pdf} />;
  }

  return <CardComponent pdf={pdf} />;
}
