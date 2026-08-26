"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

import { LibraryHeader } from "@/components/library-header";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionPayload } from "@/lib/auth";
import { getVideoSupportManual } from "@/lib/video-support-manual";

type VideoSupportManualPageProps = {
  session: SessionPayload;
};

export function VideoSupportManualPage({ session }: VideoSupportManualPageProps) {
  const { language, t } = useLocale();
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const videos = getVideoSupportManual(language);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <LibraryHeader
        title={t.header.videoManualTitle}
        subtitle={t.header.videoManualSubtitle(firstName)}
        fullName={session.fullName}
        showBackToLibrary
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            {t.videoManual.brand}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            {t.videoManual.heading}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t.videoManual.description}
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="flex h-full flex-col overflow-hidden border-border/60 shadow-card"
            >
              <div className="flex items-center justify-between bg-gradient-to-r from-sky-600 to-primary px-5 py-3 text-white">
                <p className="text-sm font-semibold tracking-wide">
                  {video.id === 17
                    ? t.videoManual.conclusion
                    : t.videoManual.video(video.id)}
                </p>
                {video.youtubeId ? (
                  <PlayCircle className="h-4 w-4 text-white/90" />
                ) : null}
              </div>
              <CardHeader className="space-y-2">
                <CardTitle className="font-display text-xl leading-snug text-balance">
                  {video.title}
                </CardTitle>
                <CardDescription>
                  {t.videoManual.questionsCount(video.questions.length)}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={`/biblioteca/ferramentas/manual-videos/${video.id}`}>
                    {t.videoManual.openVideo}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
