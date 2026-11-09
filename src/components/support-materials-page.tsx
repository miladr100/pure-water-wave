"use client";

import { SupportDownloadCard } from "@/components/support-download-card";
import { useLocale } from "@/components/locale-provider";
import { SupportMaterialsEmpty } from "@/components/support-materials-carousel";
import { getSupportDownloadsByLanguage, type SupportDownload } from "@/lib/support-materials";

// `extraDownloads`: items added from Administração › Biblioteca, after the
// ones that ship with the site.
export function SupportMaterialsPage({ extraDownloads = [] }: { extraDownloads?: SupportDownload[] }) {
  const { language, t } = useLocale();
  const downloads = [...getSupportDownloadsByLanguage(language), ...extraDownloads];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            {t.support.heading}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t.support.description}
          </p>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="font-display text-2xl font-semibold text-primary-deep">
              {t.support.downloadsTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.support.downloadsHint}
            </p>
          </div>

          {downloads.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {downloads.map((item) => (
                <SupportDownloadCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <SupportMaterialsEmpty message={t.support.emptyDownloads} />
          )}
        </section>
      </main>
    </div>
  );
}
