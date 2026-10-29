"use client";

import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { CourseLocked, isCourseLocked } from "@/components/academy/course-locked";
import { ErrorState } from "@/components/academy/error-state";
import { ProgressBar } from "@/components/academy/progress-bar";
import { describeError, useApi } from "@/components/academy/use-api";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseDetail } from "@/lib/academy/types";

export function CourseComplete({ slug }: { slug: string }) {
  const { t } = useLocale();
  const { data, error, loading, reload } = useApi<{ course: CourseDetail }>(
    `/api/academia/cursos/${slug}`,
  );

  useEffect(() => {
    if (error && error.code !== "course_locked") {
      toast.error(describeError(error, t));
    }
  }, [error, t]);

  if (error?.code === "course_locked" && isCourseLocked(error.data)) {
    return <CourseLocked locked={error.data} />;
  }

  if (error) {
    return <ErrorState message={describeError(error, t)} onRetry={reload} backHref={`/academia/cursos/${slug}`} />;
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="mx-auto h-20 w-20 rounded-full" />
        <Skeleton className="mx-auto h-9 w-2/3" />
        <Skeleton className="mx-auto h-5 w-1/2" />
      </div>
    );
  }

  const course = data.course;
  const activityCount = course.modules.filter((mod) => mod.exam).length + (course.finalExam ? 1 : 0);
  const courseHref = `/academia/cursos/${slug}`;

  if (!course.myState.completed) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
        <p className="text-sm font-medium text-primary">{course.title}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-primary-deep">
          {t.course.inProgressTitle}
        </h1>
        <p className="mt-3 text-muted-foreground">{t.course.inProgressBody}</p>
        <div className="mt-6 space-y-1.5 text-left">
          <ProgressBar value={course.myState.coursePct} />
          <p className="text-xs text-muted-foreground">{t.course.progress(course.myState.coursePct)}</p>
        </div>
        <Button asChild className="mt-6 rounded-full">
          <Link href={courseHref}>
            {t.course.continueCourse}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-cta p-8 text-center text-primary-foreground shadow-glow sm:p-12">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary-foreground/10 animate-float"
        />
        <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/30">
          <Trophy className="h-10 w-10" />
        </span>
        <p className="relative mt-6 text-sm font-medium text-primary-foreground/85">{course.title}</p>
        <h1 className="relative mt-2 font-display text-3xl font-semibold sm:text-4xl">
          {t.course.completedTitle}
        </h1>
        <p className="relative mt-3 text-primary-foreground/85">{t.course.completedBody}</p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-2 text-sm">
          <span className="rounded-full bg-primary-foreground/15 px-4 py-1.5">
            {t.common.lessons(course.lessonCount)}
          </span>
          <span className="rounded-full bg-primary-foreground/15 px-4 py-1.5">
            {t.common.activities(activityCount)}
          </span>
        </div>
      </section>

      {course.unlocks.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl font-semibold text-primary-deep">{t.course.unlocksTitle}</h2>
          <ul className="mt-4 space-y-2">
            {course.unlocks.map((next) => (
              <li key={next.slug}>
                <Link
                  href={`/academia/cursos/${next.slug}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <span className="font-medium text-foreground">{next.title}</span>
                  <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
                    {t.catalog.view}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-full">
          <Link href="/academia/cursos">
            {t.dashboard.exploreCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={courseHref}>{t.player.backToCourse}</Link>
        </Button>
      </div>
    </div>
  );
}
