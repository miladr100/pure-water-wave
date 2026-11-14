"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import { useState } from "react";

import { LibraryAiCta } from "@/components/library-ai-cta";
import { LibraryPdfCardLoader } from "@/components/library-pdf-card-loader";
import { LibrarySearch } from "@/components/library-search";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LibraryExtraBook } from "@/lib/biblioteca/itens";
import { getLibraryPdfsByLanguage } from "@/lib/library-pdfs";

// `extraBooks`: books added from Administração › Biblioteca by link; they
// open in a new tab (the in-site reader only knows the shipped PDFs).
export function LibraryDashboard({ extraBooks = [] }: { extraBooks?: LibraryExtraBook[] }) {
  const { language, t } = useLocale();
  const pdfs = getLibraryPdfsByLanguage(language);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            {t.dashboard.heading}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t.dashboard.description}
          </p>
        </section>

        <LibraryAiCta />
        <LibrarySearch />

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {pdfs.map((pdf) => (
            <LibraryPdfCardLoader key={pdf.id} pdf={pdf} />
          ))}
        </section>

        {extraBooks.length > 0 ? (
          <section className="mt-14">
            <div className="mb-5">
              <h2 className="font-display text-2xl font-semibold text-primary-deep">{t.support.extraBooksTitle}</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {extraBooks.map((book) => (
                <ExtraBookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function ExtraBookCard({ book }: { book: LibraryExtraBook }) {
  const { t } = useLocale();
  const [previewFailed, setPreviewFailed] = useState(!book.thumbnailUrl);

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/60 shadow-card">
      <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-primary-deep to-primary p-4">
        {!previewFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.thumbnailUrl}
            alt={`Capa de ${book.title}`}
            width={200}
            height={260}
            loading="lazy"
            decoding="async"
            className="max-h-[220px] w-[180px] rounded-md bg-white object-contain object-top shadow-lg"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <BookOpen className="h-14 w-14 text-white/90" />
        )}
      </div>
      <CardHeader className="space-y-2">
        <CardTitle className="font-display text-lg leading-tight">{book.title}</CardTitle>
        {book.subtitle ? <CardDescription className="text-sm">{book.subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="mt-auto">
        <Button asChild className="w-full">
          <a href={book.url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            {t.support.openLink}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
