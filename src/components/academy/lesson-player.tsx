"use client";

import { ArrowLeft, ArrowRight, ExternalLink, FileText, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BunnyPlayer } from "@/components/academy/bunny-player";
import { ErrorState } from "@/components/academy/error-state";
import { fmtDuration } from "@/components/academy/format";
import { LessonQuestions } from "@/components/academy/lesson-questions";
import { describeError, useApi } from "@/components/academy/use-api";
import { YouTubePlayer } from "@/components/academy/youtube-player";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LessonPlayerData } from "@/lib/academy/types";

const AUTO_NEXT_SEC = 5;

type Props = { slug: string; lessonId: string; isTutor: boolean };

export function LessonPlayer({ slug, lessonId, isTutor }: Props) {
  const { t } = useLocale();
  const { data, error, loading, reload } = useApi<LessonPlayerData>(`/api/academia/aulas/${lessonId}`);
  const [ended, setEnded] = useState(false);
  const courseHref = `/academia/cursos/${slug}`;

  useEffect(() => {
    if (error && !["module_locked", "not_enrolled", "video_not_ready"].includes(error.code ?? "")) {
      toast.error(describeError(error, t));
    }
  }, [error, t]);

  if (error?.code === "module_locked" || error?.code === "not_enrolled") {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary-deep">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-primary-deep">{t.course.locked}</h1>
        <p className="mt-2 text-muted-foreground">
          {error.code === "not_enrolled" ? t.course.lockedNotEnrolled : t.course.lockedModule}
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href={courseHref}>
            <ArrowLeft className="h-4 w-4" />
            {t.player.backToCourse}
          </Link>
        </Button>
      </div>
    );
  }

  if (error?.code === "video_not_ready") {
    return <ErrorState message={t.player.notReady} onRetry={reload} backHref={courseHref} backLabel={t.player.backToCourse} />;
  }

  if (error) {
    return <ErrorState message={describeError(error, t)} onRetry={reload} backHref={courseHref} backLabel={t.player.backToCourse} />;
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const { lesson, course, video, next } = data;
  const nextTarget = nextLink(next, slug, t);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={courseHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {course.title}
        </Link>
        <p className="mt-3 text-sm font-medium text-primary">
          {t.course.module(lesson.moduleNumber)} · {t.course.lesson(lesson.number)}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-primary-deep sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lesson.moduleTitle} · {fmtDuration(lesson.durationMinutes)}
        </p>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-card">
        {video.provider === "youtube" ? (
          <YouTubePlayer video={video} lessonId={lesson.id} isTutor={isTutor} onEnded={() => setEnded(true)} />
        ) : (
          <BunnyPlayer video={video} lessonId={lesson.id} isTutor={isTutor} onEnded={() => setEnded(true)} />
        )}
        {ended ? <NextCard target={nextTarget} courseHref={courseHref} onDismiss={() => setEnded(false)} /> : null}
      </div>

      {lesson.description ? (
        <p className="whitespace-pre-wrap text-muted-foreground">{lesson.description}</p>
      ) : null}

      {lesson.materials.length > 0 ? (
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-primary-deep">
            <FileText className="h-5 w-5 text-primary" />
            {t.player.materials}
          </h2>
          <ul className="mt-3 space-y-2">
            {lesson.materials.map((material) => (
              <li key={`${material.url}-${material.label}`}>
                <a
                  href={material.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/50 hover:text-primary"
                >
                  <span className="truncate">{material.label}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {nextTarget ? (
        <Link
          href={nextTarget.href}
          className="flex items-center justify-between gap-3 rounded-3xl border border-border/60 bg-card px-5 py-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
        >
          <span className="min-w-0">
            <span className="block text-xs font-medium text-primary">{nextTarget.kicker}</span>
            <span className="block truncate font-medium text-foreground">{nextTarget.label}</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
        </Link>
      ) : null}

      <LessonQuestions lessonId={lesson.id} />
    </div>
  );
}

type NextTarget = { href: string; label: string; kicker: string; auto: boolean };

function nextLink(
  next: LessonPlayerData["next"],
  slug: string,
  t: ReturnType<typeof useLocale>["t"],
): NextTarget | null {
  const base = `/academia/cursos/${slug}`;
  switch (next.kind) {
    case "lesson":
      return {
        href: `${base}/aulas/${next.lessonId}`,
        label: `${t.course.lesson(next.lessonNumber)} · ${next.lessonTitle}`,
        kicker: t.player.nextLesson,
        auto: true,
      };
    case "module-exam":
      return { href: `${base}/atividade/${next.examId}`, label: t.player.goToActivity, kicker: t.course.moduleActivity, auto: false };
    case "final-exam":
      return { href: `${base}/atividade/${next.examId}`, label: t.player.goToFinal, kicker: t.course.finalActivity, auto: false };
    case "course-complete":
      return { href: `${base}/concluido`, label: t.player.courseDone, kicker: t.course.completedTitle, auto: false };
    default:
      return null;
  }
}

// Shown over the video once it ends. A next lesson plays itself after a
// short ring countdown; anything else waits for a click.
function NextCard({
  target,
  courseHref,
  onDismiss,
}: {
  target: NextTarget | null;
  courseHref: string;
  onDismiss: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const auto = Boolean(target?.auto);
  const [left, setLeft] = useState(AUTO_NEXT_SEC);

  useEffect(() => {
    if (!auto) {
      return;
    }
    const id = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [auto]);

  useEffect(() => {
    if (auto && left === 0 && target) {
      router.replace(target.href);
    }
  }, [auto, left, target, router]);

  const circumference = 2 * Math.PI * 18;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-primary-deep/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-5 text-center shadow-glow">
        {target ? (
          <>
            {target.auto ? (
              <div className="relative mx-auto h-12 w-12">
                <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90">
                  <circle cx="20" cy="20" r="18" className="fill-none stroke-primary/20" strokeWidth="3" />
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    className="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - left / AUTO_NEXT_SEC)}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary-deep tabular-nums">
                  {left}
                </span>
              </div>
            ) : null}
            <p className="mt-3 text-xs font-medium text-primary">{target.kicker}</p>
            <p className="mt-1 font-display text-lg font-semibold leading-tight text-primary-deep">
              {target.auto ? t.player.upNext(target.label) : target.label}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild className="rounded-full">
                <Link href={target.href} replace={target.auto}>
                  {target.auto ? t.player.nextLesson : target.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={courseHref}>{t.player.backToCourse}</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="font-display text-lg font-semibold text-primary-deep">{t.player.backToCourse}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild className="rounded-full">
                <Link href={courseHref}>
                  <ArrowLeft className="h-4 w-4" />
                  {t.player.backToCourse}
                </Link>
              </Button>
              <Button type="button" variant="outline" className="rounded-full" onClick={onDismiss}>
                {t.course.rewatch}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
