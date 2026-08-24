"use client";

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
  getSupportAhaTestimonialVideos,
  getSupportFaithTestimonialVideos,
  getSupportSubregion2Videos,
  getSupportTestimonialVideos,
  getSupportVideosByLanguage,
  type SupportVideo,
} from "@/lib/support-materials";
import type { SessionPayload } from "@/lib/auth";

type SupportVideosPageProps = {
  session: SessionPayload;
};

function VideoTrackSection({
  title,
  hint,
  videos,
  emptyMessage,
}: {
  title: string;
  hint: string;
  videos: SupportVideo[];
  emptyMessage: string;
}) {
  return (
    <section className="mb-14 last:mb-0">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold text-primary-deep">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
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
        <SupportMaterialsEmpty message={emptyMessage} />
      )}
    </section>
  );
}

export function SupportVideosPage({ session }: SupportVideosPageProps) {
  const { language, t } = useLocale();
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const studyVideos = getSupportVideosByLanguage(language);
  const subregion2Videos = getSupportSubregion2Videos(language);
  const testimonials = getSupportTestimonialVideos(language);
  const faithTestimonials = getSupportFaithTestimonialVideos(language);
  const ahaTestimonials = getSupportAhaTestimonialVideos(language);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <LibraryHeader
        title={t.header.videosTitle}
        subtitle={t.header.videosSubtitle(firstName)}
        showVideosLink={false}
        showBackToLibrary
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            {t.support.videosPageHeading}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t.support.videosPageDescription}
          </p>
        </section>

        <VideoTrackSection
          title={t.support.videosTitle}
          hint={t.support.videosHint}
          videos={studyVideos}
          emptyMessage={t.support.emptyVideos}
        />
        {subregion2Videos.length > 0 ? (
          <VideoTrackSection
            title={t.support.subregion2VideosTitle}
            hint={t.support.videosHint}
            videos={subregion2Videos}
            emptyMessage={t.support.emptyVideos}
          />
        ) : null}
        <VideoTrackSection
          title={t.support.testimonialsTitle}
          hint={t.support.videosHint}
          videos={testimonials}
          emptyMessage={t.support.emptyVideos}
        />
        <VideoTrackSection
          title={t.support.faithTestimonialsTitle}
          hint={t.support.videosHint}
          videos={faithTestimonials}
          emptyMessage={t.support.emptyVideos}
        />
        <VideoTrackSection
          title={t.support.ahaTestimonialsTitle}
          hint={t.support.videosHint}
          videos={ahaTestimonials}
          emptyMessage={t.support.emptyVideos}
        />
      </main>
    </div>
  );
}
