"use client";

import {
  SupportDownloadCard,
} from "@/components/support-download-card";
import { SupportVideoCard } from "@/components/support-video-card";
import { LibraryHeader } from "@/components/library-header";
import { useLocale } from "@/components/locale-provider";
import {
  SupportMaterialsCarousel,
  SupportMaterialsCarouselItem,
  SupportMaterialsCarouselNavHint,
  SupportMaterialsEmpty,
} from "@/components/support-materials-carousel";
import {
  getSupportDownloadsByLanguage,
  getSupportVideosByLanguage,
} from "@/lib/support-materials";
import type { SessionPayload } from "@/lib/auth";

type SupportMaterialsPageProps = {
  session: SessionPayload;
};

export function SupportMaterialsPage({ session }: SupportMaterialsPageProps) {
  const { language, t } = useLocale();
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const downloads = getSupportDownloadsByLanguage(language);
  const videos = getSupportVideosByLanguage(language);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <LibraryHeader
        title={t.header.supportTitle}
        subtitle={t.header.supportSubtitle(firstName)}
        showSupportMaterialsLink={false}
        showBackToLibrary
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            {t.support.heading}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t.support.description}
          </p>
        </section>

        <section className="mb-14">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-semibold text-primary-deep">
              {t.support.downloadsTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.support.downloadsHint}
            </p>
          </div>

          {downloads.length > 0 ? (
            <>
              <SupportMaterialsCarousel>
                {downloads.map((item) => (
                  <SupportMaterialsCarouselItem key={item.id}>
                    <SupportDownloadCard item={item} />
                  </SupportMaterialsCarouselItem>
                ))}
              </SupportMaterialsCarousel>
              <SupportMaterialsCarouselNavHint />
            </>
          ) : (
            <SupportMaterialsEmpty message={t.support.emptyDownloads} />
          )}
        </section>

        <section>
          <div className="mb-5">
            <h2 className="font-display text-2xl font-semibold text-primary-deep">
              {t.support.videosTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.support.videosHint}
            </p>
          </div>

          {videos.length > 0 ? (
            <>
              <SupportMaterialsCarousel>
                {videos.map((item) => (
                  <SupportMaterialsCarouselItem key={item.id}>
                    <SupportVideoCard item={item} />
                  </SupportMaterialsCarouselItem>
                ))}
              </SupportMaterialsCarousel>
              <SupportMaterialsCarouselNavHint />
            </>
          ) : (
            <SupportMaterialsEmpty message={t.support.emptyVideos} />
          )}
        </section>
      </main>
    </div>
  );
}
