"use client";

import { ArrowRight, Play, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { CourseCard, CourseCardSkeleton, CourseCover } from "@/components/academy/course-card";
import { ErrorState } from "@/components/academy/error-state";
import { firstNameOf, fmtDuration } from "@/components/academy/format";
import { ProgressBar } from "@/components/academy/progress-bar";
import { describeError, useApi } from "@/components/academy/use-api";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionPayload } from "@/lib/academy/auth";
import type { CourseCard as CourseCardData, MeResponse } from "@/lib/academy/types";

export function Dashboard({ session }: { session: SessionPayload }) {
  const { t } = useLocale();
  const me = useApi<MeResponse>("/api/academia/me");
  const catalog = useApi<{ courses: CourseCardData[] }>("/api/academia/cursos");
  const error = me.error ?? catalog.error;

  useEffect(() => {
    if (error) {
      toast.error(describeError(error, t));
    }
  }, [error, t]);

  const firstName = firstNameOf(session.fullName);

  function reload() {
    me.reload();
    catalog.reload();
  }

  if (error) {
    return <ErrorState message={describeError(error, t)} onRetry={reload} />;
  }

  if (me.loading || catalog.loading || !me.data || !catalog.data) {
    return (
      <div className="space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      </div>
    );
  }

  const { enrollments, continueLesson, profile } = me.data;
  const profileIncomplete = !profile.phone || !profile.birthday;
  const enrolledSlugs = new Set(enrollments.map((course) => course.slug));
  const starter =
    enrollments.length === 0
      ? (catalog.data.courses.find((course) => course.starter && !course.comingSoon) ?? null)
      : null;
  const available = catalog.data.courses.filter(
    (course) => !enrolledSlugs.has(course.slug) && course.slug !== starter?.slug,
  );

  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
          {t.dashboard.greeting(firstName)}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t.dashboard.description}</p>
      </section>

      {continueLesson ? (
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold text-primary-deep">
            {t.dashboard.continueTitle}
          </h2>
          <Link
            href={`/academia/cursos/${continueLesson.courseSlug}/aulas/${continueLesson.lessonId}`}
            className="group block overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
          >
            <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <CourseCover
                coverUrl={continueLesson.thumbnailUrl ?? continueLesson.coverUrl}
                title={continueLesson.lessonTitle}
                className="aspect-video md:h-full"
              >
                <div className="absolute inset-0 flex items-center justify-center bg-primary-deep/25 transition group-hover:bg-primary-deep/35">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card/90 text-primary-deep shadow-lg">
                    <Play className="h-6 w-6 fill-current" />
                  </span>
                </div>
              </CourseCover>
              <div className="flex flex-col gap-3 p-5 sm:p-6">
                <p className="text-sm font-medium text-primary">{continueLesson.courseTitle}</p>
                <h3 className="font-display text-2xl font-semibold leading-tight text-primary-deep">
                  {t.course.lesson(continueLesson.lessonNumber)} · {continueLesson.lessonTitle}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {fmtDuration(continueLesson.durationMinutes)}
                </p>
                <div className="space-y-1.5">
                  <ProgressBar value={continueLesson.percent} />
                  <p className="text-xs text-muted-foreground">
                    {t.course.progress(Math.round(continueLesson.percent))}
                  </p>
                </div>
                <div className="mt-auto pt-2">
                  <span className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-cta px-5 text-sm font-medium text-primary-foreground shadow-soft">
                    {t.dashboard.continueCta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      ) : null}

      {profileIncomplete ? (
        <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-cta text-primary-foreground">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-primary-deep">
                {t.profile.incompleteTitle}
              </p>
              <p className="text-sm text-muted-foreground">{t.profile.incompleteBody}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0 rounded-full">
            <Link href="/academia?perfil=1">
              {t.profile.incompleteCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold text-primary-deep">
          {t.dashboard.myCourses}
        </h2>
        {enrollments.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-card sm:p-8">
            <p className="text-muted-foreground">{t.dashboard.noCoursesYet}</p>
            {starter ? (
              <div className="mt-6 rounded-2xl bg-gradient-wave p-5 dark:bg-none dark:bg-secondary/60">
                <p className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
                  <Sparkles className="h-4 w-4 text-coral" />
                  {t.dashboard.recommendedStart}
                </p>
                <div className="mt-4 max-w-sm">
                  <CourseCard course={starter} />
                </div>
              </div>
            ) : null}
            <div className="mt-6">
              <Button asChild className="rounded-full">
                <Link href="/academia/cursos">
                  {t.dashboard.exploreCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      {available.length > 0 ? (
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold text-primary-deep">
            {t.dashboard.availableCourses}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
