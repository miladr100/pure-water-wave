"use client";

import { ArrowRight, CircleCheck, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Chip } from "@/components/academy/chip";
import { fmtDuration } from "@/components/academy/format";
import { ProgressBar } from "@/components/academy/progress-bar";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import type { CourseCard as CourseCardData } from "@/lib/academy/types";

// Covers are arbitrary URLs set by tutors, so the site's plain <img> with a
// gradient fallback is used instead of next/image and its host allow-list.
export function CourseCover({
  coverUrl,
  title,
  className,
  children,
}: {
  coverUrl: string;
  title: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const showCover = Boolean(coverUrl) && !failed;

  return (
    <div className={`relative overflow-hidden bg-gradient-hero ${className ?? ""}`}>
      {showCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <GraduationCap className="h-12 w-12 text-primary-foreground/80" />
        </div>
      )}
      {children}
    </div>
  );
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const { t, language } = useLocale();
  const { myState } = course;

  const cta = course.comingSoon
    ? { label: t.catalog.comingSoon, disabled: true, outline: false }
    : myState.completed
      ? { label: t.catalog.review, disabled: false, outline: true }
      : myState.enrolled
        ? { label: t.catalog.continue, disabled: false, outline: false }
        : { label: t.catalog.view, disabled: false, outline: false };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
      <CourseCover coverUrl={course.coverUrl} title={course.title} className="aspect-video">
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {course.starter ? <Chip tone="coral">{t.catalog.starter}</Chip> : null}
          {myState.unlocked && !myState.enrolled ? (
            <Chip tone="mint">{t.catalog.unlocked}</Chip>
          ) : null}
          {myState.completed ? (
            <Chip tone="primary">
              <CircleCheck className="h-3 w-3" />
              {t.catalog.completed}
            </Chip>
          ) : null}
          {course.comingSoon ? <Chip tone="muted">{t.catalog.comingSoon}</Chip> : null}
        </div>
        {course.language !== language ? (
          <span className="absolute right-3 top-3 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-deep">
            {course.language}
          </span>
        ) : null}
      </CourseCover>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-xl font-semibold leading-tight text-primary-deep group-hover:text-primary">
          {course.title}
        </h3>
        {course.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {t.common.lessons(course.lessonCount)} · {fmtDuration(course.totalMinutes)}
        </p>

        {myState.enrolled ? (
          <div className="space-y-1.5">
            <ProgressBar value={myState.coursePct} label={t.course.progress(myState.coursePct)} />
            <p className="text-xs text-muted-foreground">{t.course.progress(myState.coursePct)}</p>
          </div>
        ) : null}

        {!course.translated ? (
          <p className="text-xs italic text-muted-foreground">{t.catalog.untranslated}</p>
        ) : null}

        <div className="mt-auto pt-2">
          {cta.disabled ? (
            <Button type="button" disabled className="w-full rounded-full">
              {cta.label}
            </Button>
          ) : (
            <Button
              asChild
              variant={cta.outline ? "outline" : "default"}
              className="w-full rounded-full"
            >
              <Link href={`/academia/cursos/${course.slug}`}>
                {cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
      <div className="aspect-video animate-pulse bg-primary/10" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-3/4 animate-pulse rounded-md bg-primary/10" />
        <div className="h-4 w-full animate-pulse rounded-md bg-primary/10" />
        <div className="h-4 w-1/3 animate-pulse rounded-md bg-primary/10" />
        <div className="h-9 w-full animate-pulse rounded-full bg-primary/10" />
      </div>
    </div>
  );
}
