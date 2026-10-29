"use client";

import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

import { CourseCover } from "@/components/academy/course-card";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import type { CourseLocked as CourseLockedData } from "@/lib/academy/types";

export function isCourseLocked(data: Record<string, unknown>): data is CourseLockedData {
  return (
    data.error === "course_locked" &&
    typeof data.course === "object" &&
    data.course !== null &&
    Array.isArray(data.prerequisites)
  );
}

export function CourseLocked({ locked }: { locked: CourseLockedData }) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
      <CourseCover coverUrl={locked.course.coverUrl} title={locked.course.title} className="aspect-video">
        <div className="absolute inset-0 flex items-center justify-center bg-primary-deep/50">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-card/90 text-primary-deep shadow-lg">
            <Lock className="h-7 w-7" />
          </span>
        </div>
      </CourseCover>
      <div className="p-6 sm:p-8">
        <p className="text-sm font-medium text-primary">{locked.course.title}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-primary-deep sm:text-3xl">
          {t.course.courseLockedTitle}
        </h1>
        <p className="mt-3 text-muted-foreground">{t.course.courseLockedBody}</p>

        {locked.prerequisites.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-foreground">{t.course.courseLockedOpeners}</p>
            <ul className="mt-3 space-y-2">
              {locked.prerequisites.map((course) => (
                <li key={course.slug}>
                  <Link
                    href={`/academia/cursos/${course.slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 transition hover:border-primary/50 hover:shadow-soft"
                  >
                    <span className="font-medium text-foreground">{course.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/academia/cursos">{t.header.catalog}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
