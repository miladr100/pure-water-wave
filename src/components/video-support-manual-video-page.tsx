"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  MessageCircleQuestion,
} from "lucide-react";

import { LibraryHeader } from "@/components/library-header";
import { useLocale } from "@/components/locale-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { SessionPayload } from "@/lib/auth";
import { getYoutubeWatchUrl } from "@/lib/support-materials";
import {
  getVideoSupportChapter,
  getVideoSupportManual,
} from "@/lib/video-support-manual";

type VideoSupportManualVideoPageProps = {
  session: SessionPayload;
  videoId: number;
  previousVideoId: number | null;
  nextVideoId: number | null;
};

export function VideoSupportManualVideoPage({
  session,
  videoId,
  previousVideoId,
  nextVideoId,
}: VideoSupportManualVideoPageProps) {
  const { language, t } = useLocale();
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const video = getVideoSupportChapter(videoId, language);
  const chapters = getVideoSupportManual(language);

  if (!video) {
    return null;
  }

  const isConclusion = video.id === 17;
  const chapterIndex = chapters.findIndex((item) => item.id === video.id);

  function questionLabel(id: string) {
    if (id.endsWith("-bonus") || id.includes("bonus")) {
      return t.videoManual.bonus;
    }
    if (id === "conclusao") {
      return t.videoManual.conclusion;
    }
    return id;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-background to-background dark:from-background">
      <LibraryHeader
        title={t.header.videoManualTitle}
        subtitle={t.header.videoManualSubtitle(firstName)}
        fullName={session.fullName}
        showBackToLibrary
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/biblioteca/ferramentas/manual-videos">
              <ArrowLeft className="h-4 w-4" />
              {t.videoManual.backToVideos}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {previousVideoId ? (
              <Button
                asChild
                variant="outline"
                size="icon"
                aria-label={t.videoManual.previousVideo}
              >
                <Link href={`/biblioteca/ferramentas/manual-videos/${previousVideoId}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                aria-label={t.videoManual.previousVideo}
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {nextVideoId ? (
              <Button
                asChild
                variant="outline"
                size="icon"
                aria-label={t.videoManual.nextVideo}
              >
                <Link href={`/biblioteca/ferramentas/manual-videos/${nextVideoId}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                aria-label={t.videoManual.nextVideo}
                disabled
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl bg-[#7BA7C2] text-white shadow-card">
          <div className="px-6 py-6">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase">
              {t.videoManual.brand}
            </p>
            <p className="mt-1 text-sm font-medium text-white/85">
              {isConclusion
                ? t.videoManual.conclusion
                : t.videoManual.video(video.id)}
              {chapterIndex >= 0
                ? ` · ${chapterIndex + 1}/${chapters.length}`
                : null}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-balance">
              {video.title}
            </h1>
            {video.youtubeId ? (
              <Button
                asChild
                variant="secondary"
                className="mt-5 bg-white/95 text-primary-deep hover:bg-white"
              >
                <a
                  href={getYoutubeWatchUrl(video.youtubeId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.videoManual.watchVideo}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-primary-deep">
            <MessageCircleQuestion className="h-5 w-5" />
            {t.videoManual.questionsTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.videoManual.questionsHint}
          </p>

          <Accordion type="single" collapsible className="mt-4">
            {video.questions.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="items-start gap-3 text-base font-medium leading-6">
                  <span>
                    <span className="mr-2 text-xs font-semibold tracking-wide text-primary uppercase">
                      {questionLabel(item.id)}
                    </span>
                    {item.question || t.videoManual.conclusion}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-[0.95rem] leading-7 text-foreground/90">
                  {item.answer ? (
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                        {t.videoManual.answer}
                      </p>
                      <p className="mt-1">{item.answer}</p>
                    </div>
                  ) : null}
                  {item.complement ? (
                    <div className="rounded-xl border border-border/60 bg-secondary/40 p-4">
                      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                        {t.videoManual.complement}
                      </p>
                      <p className="mt-1">{item.complement}</p>
                    </div>
                  ) : null}
                  {item.tip ? (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">
                        <Lightbulb className="h-3.5 w-3.5" />
                        {t.videoManual.tip}
                      </p>
                      <p className="mt-1">{item.tip}</p>
                    </div>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
    </div>
  );
}
