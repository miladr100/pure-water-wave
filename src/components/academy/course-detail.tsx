"use client";

import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Lock,
  Mic,
  Play,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { CourseCover } from "@/components/academy/course-card";
import { CourseLocked, isCourseLocked } from "@/components/academy/course-locked";
import { ErrorState } from "@/components/academy/error-state";
import { fmtDuration } from "@/components/academy/format";
import { lockCopy } from "@/components/academy/lock-copy";
import { ProgressBar } from "@/components/academy/progress-bar";
import { describeError, toApiError, useApi } from "@/components/academy/use-api";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/academy/api-client";
import type {
  CourseDetail as CourseDetailData,
  ExamSummary,
  LessonSummary,
} from "@/lib/academy/types";
import { cn } from "@/lib/utils";

type LessonState = "done" | "current" | "locked" | "open";

export function CourseDetail({ slug }: { slug: string }) {
  const { t, language } = useLocale();
  const { data, error, loading, reload } = useApi<{ course: CourseDetailData }>(
    `/api/academia/cursos/${slug}`,
  );
  const [enrolling, setEnrolling] = useState(false);
  // Set by a successful enrolment so the reloaded page lands on lesson 1.
  const scrollPending = useRef(false);
  const firstLessonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (error && error.code !== "course_locked") {
      toast.error(describeError(error, t));
    }
  }, [error, t]);

  useEffect(() => {
    if (data && scrollPending.current) {
      scrollPending.current = false;
      firstLessonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

  async function enroll() {
    setEnrolling(true);
    try {
      await api("/api/academia/inscricao", { method: "POST", body: { courseSlug: slug } });
      scrollPending.current = true;
      reload();
    } catch (caught) {
      const apiError = toApiError(caught);
      toast.error(
        apiError.code === "prerequisite_required"
          ? t.course.courseLockedTitle
          : apiError.code === "course_coming_soon"
            ? t.course.comingSoonBody
            : describeError(apiError, t),
      );
    } finally {
      setEnrolling(false);
    }
  }

  if (error?.code === "course_locked" && isCourseLocked(error.data)) {
    return <CourseLocked locked={error.data} />;
  }

  if (error) {
    return (
      <ErrorState
        message={describeError(error, t)}
        onRetry={reload}
        backHref="/academia/cursos"
        backLabel={t.header.catalog}
      />
    );
  }

  if (loading || !data) {
    return <CourseDetailSkeleton />;
  }

  const course = data.course;
  const lessons = course.modules.flatMap((mod) => mod.lessons);
  const currentLesson =
    lessons.find((lesson) => lesson.playable && !lesson.completed) ??
    lessons.find((lesson) => lesson.playable) ??
    null;
  const lessonHref = (lesson: LessonSummary) => `/academia/cursos/${slug}/aulas/${lesson.id}`;
  const examHref = (exam: ExamSummary) => `/academia/cursos/${slug}/atividade/${exam.id}`;
  const activityCount = course.modules.filter((mod) => mod.exam).length + (course.finalExam ? 1 : 0);

  let hero: ReactNode;
  if (course.comingSoon) {
    hero = (
      <div className="space-y-3">
        <Button type="button" disabled size="lg" className="rounded-full">
          {t.catalog.comingSoon}
        </Button>
        <p className="text-sm text-muted-foreground">{t.course.comingSoonBody}</p>
      </div>
    );
  } else if (!course.myState.enrolled) {
    hero = (
      <Button
        type="button"
        size="lg"
        className="rounded-full bg-gradient-cta px-8 shadow-soft hover:opacity-90"
        onClick={() => void enroll()}
        disabled={enrolling}
      >
        {enrolling ? t.course.enrolling : t.course.enroll}
        <ArrowRight className="h-4 w-4" />
      </Button>
    );
  } else if (currentLesson) {
    hero = (
      <Button asChild size="lg" className="rounded-full bg-gradient-cta px-8 shadow-soft hover:opacity-90">
        <Link href={lessonHref(course.myState.completed ? lessons[0] : currentLesson)}>
          <Play className="h-4 w-4 fill-current" />
          {course.myState.completed ? t.catalog.review : t.course.continueCourse}
        </Link>
      </Button>
    );
  } else {
    hero = null;
  }

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <CourseCover coverUrl={course.coverUrl} title={course.title} className="aspect-video lg:aspect-auto lg:min-h-full">
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              {course.starter ? <Chip tone="coral">{t.catalog.starter}</Chip> : null}
              {course.myState.completed ? (
                <Chip tone="primary">
                  <CircleCheck className="h-3 w-3" />
                  {t.catalog.completed}
                </Chip>
              ) : course.myState.enrolled ? (
                <Chip tone="mint">{t.course.enrolled}</Chip>
              ) : null}
              {course.language !== language ? (
                <Chip className="bg-card/90 uppercase text-primary-deep">{course.language}</Chip>
              ) : null}
            </div>
          </CourseCover>

          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <h1 className="font-display text-3xl font-semibold leading-tight text-primary-deep md:text-4xl">
              {course.title}
            </h1>
            {course.description ? (
              <p className="text-muted-foreground">{course.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {course.speaker ? (
                <span className="inline-flex items-center gap-1.5">
                  <Mic className="h-4 w-4 text-primary" />
                  {t.course.speaker}: {course.speaker}
                </span>
              ) : null}
              <span>
                {t.common.lessons(course.lessonCount)} · {fmtDuration(course.totalMinutes)}
              </span>
            </div>
            {!course.translated ? (
              <p className="text-sm italic text-muted-foreground">{t.catalog.untranslated}</p>
            ) : null}
            {course.myState.enrolled ? (
              <div className="space-y-1.5">
                <ProgressBar value={course.myState.coursePct} />
                <p className="text-xs text-muted-foreground">
                  {t.course.progress(course.myState.coursePct)} ·{" "}
                  {t.common.lessons(course.myState.completedLessonCount)}
                </p>
              </div>
            ) : null}
            <div className="mt-auto pt-2">{hero}</div>
          </div>
        </div>
      </section>

      {course.myState.completed ? (
        <section className="rounded-3xl bg-gradient-cta p-6 text-primary-foreground shadow-glow sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
              <Trophy className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-semibold">{t.course.completedTitle}</h2>
              <p className="mt-1 text-primary-foreground/85">{t.course.completedBody}</p>
              {course.unlocks.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold">{t.course.unlocksTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {course.unlocks.map((next) => (
                      <Link
                        key={next.slug}
                        href={`/academia/cursos/${next.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-sm font-medium transition hover:bg-primary-foreground/25"
                      >
                        {next.title}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-4">
                <Link
                  href={`/academia/cursos/${slug}/concluido`}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  {t.player.courseDone}
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="space-y-8">
        {course.modules.map((mod) => (
          <section key={mod.id} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl font-semibold text-primary-deep">
                {t.course.module(mod.number)} · {mod.title}
              </h2>
              {mod.complete ? (
                <Chip tone="mint">
                  <CircleCheck className="h-3 w-3" />
                  {t.catalog.completed}
                </Chip>
              ) : !mod.unlocked ? (
                <Chip tone="muted">
                  <Lock className="h-3 w-3" />
                  {t.course.locked}
                </Chip>
              ) : null}
            </div>
            {!mod.unlocked ? (
              <p className="text-sm text-muted-foreground">
                {course.myState.enrolled ? t.course.lockedModule : t.course.lockedNotEnrolled}
              </p>
            ) : null}

            <div className="space-y-2">
              {mod.lessons.map((lesson) => {
                const state: LessonState = lesson.completed
                  ? "done"
                  : !lesson.playable
                    ? "locked"
                    : currentLesson?.id === lesson.id
                      ? "current"
                      : "open";
                const isFirst = lessons[0]?.id === lesson.id;

                return (
                  <div key={lesson.id} ref={isFirst ? firstLessonRef : undefined}>
                    <LessonRow lesson={lesson} state={state} href={lessonHref(lesson)} />
                  </div>
                );
              })}

              {mod.exam ? (
                <ExamRow exam={mod.exam} label={t.course.moduleActivity} href={examHref(mod.exam)} />
              ) : null}
            </div>
          </section>
        ))}

        {course.finalExam ? (
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-semibold text-primary-deep">
              {t.course.finalActivity}
            </h2>
            <ExamRow
              exam={course.finalExam}
              label={t.course.finalActivity}
              href={examHref(course.finalExam)}
              highlight
            />
          </section>
        ) : null}

        {activityCount === 0 && lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.course.comingSoonBody}</p>
        ) : null}
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  state,
  href,
}: {
  lesson: LessonSummary;
  state: LessonState;
  href: string;
}) {
  const { t } = useLocale();
  const playable = state !== "locked";

  const icon =
    state === "done" ? (
      <CircleCheck className="h-5 w-5 text-primary" />
    ) : state === "current" ? (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-cta text-primary-foreground shadow-soft">
        <Play className="h-4 w-4 fill-current" />
      </span>
    ) : state === "locked" ? (
      <Lock className="h-5 w-5 text-muted-foreground" />
    ) : (
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    );

  const body = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          state === "done"
            ? "bg-mint text-mint-foreground"
            : state === "current"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
        )}
      >
        {lesson.number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{lesson.title}</span>
        <span className="block text-xs text-muted-foreground">
          {t.course.lesson(lesson.number)} · {fmtDuration(lesson.durationMinutes)}
          {state === "locked" ? ` · ${lockCopy(lesson.lockReason, t)}` : ""}
        </span>
        {!lesson.completed && lesson.percent > 0 ? (
          <ProgressBar value={lesson.percent} className="mt-1.5 h-1 max-w-xs" />
        ) : null}
      </span>
      <span className="shrink-0">{icon}</span>
    </>
  );

  const className = cn(
    "flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-card transition",
    playable ? "hover:-translate-y-0.5 hover:shadow-glow" : "opacity-70",
    state === "current" && "border-primary/40",
  );

  return playable ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className} aria-disabled>
      {body}
    </div>
  );
}

function ExamRow({
  exam,
  label,
  href,
  highlight = false,
}: {
  exam: ExamSummary;
  label: string;
  href: string;
  highlight?: boolean;
}) {
  const { t } = useLocale();

  let status: ReactNode;
  let cta: string | null;

  if (!exam.unlocked) {
    status = <span className="text-muted-foreground">{lockCopy(exam.lockReason, t)}</span>;
    cta = null;
  } else if (exam.passed) {
    status = <span className="font-medium text-primary">{t.course.passed(exam.bestScorePct ?? 0)}</span>;
    cta = t.course.viewResult;
  } else if (exam.attempted) {
    status = <span className="font-medium text-coral">{t.course.failed(exam.bestScorePct ?? 0)}</span>;
    cta = t.course.retryActivity;
  } else {
    status = null;
    cta = t.course.doActivity;
  }

  const body = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          exam.passed
            ? "bg-mint text-mint-foreground"
            : highlight
              ? "bg-gradient-coral text-coral-foreground"
              : "bg-accent text-accent-foreground",
        )}
      >
        {exam.passed ? <CircleCheck className="h-5 w-5" /> : exam.unlocked ? <ClipboardCheck className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">
          {t.common.questions(exam.questionCount)}
          {status ? <> · {status}</> : null}
        </span>
      </span>
      {cta ? (
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-card transition",
    highlight ? "border-coral/40 bg-card" : "border-border/60 bg-secondary/40",
    exam.unlocked ? "hover:-translate-y-0.5 hover:shadow-glow" : "opacity-70",
  );

  return exam.unlocked ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className} aria-disabled>
      {body}
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="space-y-10">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <Skeleton className="aspect-video rounded-none" />
          <div className="space-y-4 p-6 sm:p-8">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-11 w-48 rounded-full" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
