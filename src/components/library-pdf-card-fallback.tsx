import { BookOpen, BookOpenCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LibraryPdf } from "@/lib/library-pdfs";
import { LibraryPdfCardLink } from "@/components/library-pdf-card-link";

type LibraryPdfCardFallbackProps = {
  pdf: LibraryPdf;
};

export function LibraryPdfCardFallback({ pdf }: LibraryPdfCardFallbackProps) {
  return (
    <LibraryPdfCardLink pdfId={pdf.id}>
      <Card className="flex h-full flex-col overflow-hidden border-border/60 shadow-card">
        <div
          className={`relative flex h-64 items-center justify-center bg-gradient-to-br ${pdf.coverColor} p-4`}
        >
          <BookOpen className="h-16 w-16 text-white/90" />
          <Badge className="absolute right-4 top-4 border-white/20 bg-white/15 text-white hover:bg-white/15">
            {pdf.language}
          </Badge>
        </div>

        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-xl leading-tight">
            {pdf.title}
          </CardTitle>
          <CardDescription className="text-sm">{pdf.subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="mt-auto">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            Ler material
            <BookOpenCheck className="h-4 w-4" />
          </p>
        </CardContent>
      </Card>
    </LibraryPdfCardLink>
  );
}
