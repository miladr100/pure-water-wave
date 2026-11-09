"use client";

import { LibraryAiCta } from "@/components/library-ai-cta";
import { LibraryPdfCardLoader } from "@/components/library-pdf-card-loader";
import { LibrarySearch } from "@/components/library-search";
import { useLocale } from "@/components/locale-provider";
import { getLibraryPdfsByLanguage } from "@/lib/library-pdfs";

export function LibraryDashboard() {
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
      </main>
    </div>
  );
}
