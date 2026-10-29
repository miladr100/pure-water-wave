"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/academy/error-state";
import { QuestionItem, useMarkSeen } from "@/components/academy/lesson-questions";
import { describeError, useApi } from "@/components/academy/use-api";
import { useLocale } from "@/components/academy/locale-provider";
import { Skeleton } from "@/components/ui/skeleton";
import type { LessonQuestion } from "@/lib/academy/types";

export function MyQuestions() {
  const { t } = useLocale();
  const { data, error, loading, reload } = useApi<{ questions: LessonQuestion[] }>("/api/academia/perguntas");

  useEffect(() => {
    if (error) {
      toast.error(describeError(error, t));
    }
  }, [error, t]);

  const questions = data?.questions ?? [];
  useMarkSeen(questions);

  // Grouped by course in the order the API lists them (newest first).
  const groups = new Map<string, { title: string; items: LessonQuestion[] }>();
  for (const question of questions) {
    const group = groups.get(question.courseId) ?? { title: question.courseTitle, items: [] };
    group.items.push(question);
    groups.set(question.courseId, group);
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
          {t.questions.heading}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t.questions.description}</p>
      </section>

      {error ? (
        <ErrorState message={describeError(error, t)} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : questions.length === 0 ? (
        <p className="rounded-3xl border border-border/60 bg-card p-8 text-center text-muted-foreground shadow-card">
          {t.questions.empty}
        </p>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([courseId, group]) => (
            <section key={courseId} className="space-y-3">
              <h2 className="font-display text-2xl font-semibold text-primary-deep">{group.title}</h2>
              <ul className="space-y-3">
                {group.items.map((question) => {
                  const slug = courseSlugOf(question);
                  return (
                    <li key={question.id} className="space-y-1">
                      <QuestionItem question={question} meta={question.lessonLabel} />
                      {slug ? (
                        <Link
                          href={`/academia/cursos/${slug}/aulas/${question.lessonId}`}
                          className="inline-flex items-center gap-1 px-1 text-xs font-medium text-primary hover:underline"
                        >
                          {t.course.watch}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// The contract carries no course slug on a question; the route may add one
// as `courseSlug`, and the lesson link appears only when it does.
function courseSlugOf(question: LessonQuestion) {
  const slug = (question as LessonQuestion & { courseSlug?: unknown }).courseSlug;
  return typeof slug === "string" && slug ? slug : null;
}
