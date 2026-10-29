"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { CourseCard, CourseCardSkeleton } from "@/components/academy/course-card";
import { ErrorState } from "@/components/academy/error-state";
import { describeError, useApi } from "@/components/academy/use-api";
import { useLocale } from "@/components/academy/locale-provider";
import type { CourseCard as CourseCardData } from "@/lib/academy/types";

export function Catalog() {
  const { t } = useLocale();
  const { data, error, loading, reload } = useApi<{ courses: CourseCardData[] }>(
    "/api/academia/cursos",
  );

  useEffect(() => {
    if (error) {
      toast.error(describeError(error, t));
    }
  }, [error, t]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
          {t.catalog.heading}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t.catalog.description}</p>
      </section>

      {error ? (
        <ErrorState message={describeError(error, t)} onRetry={reload} />
      ) : loading || !data ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      ) : data.courses.length === 0 ? (
        <div className="space-y-2 rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
          <p className="text-muted-foreground">{t.catalog.empty}</p>
          <p className="text-sm text-muted-foreground/80">{t.catalog.otherLanguageHint}</p>
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {data.courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </section>
      )}
    </div>
  );
}
