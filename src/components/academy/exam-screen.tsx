"use client";

import { ArrowLeft, ArrowRight, Check, CircleCheck, Lock, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { ErrorState } from "@/components/academy/error-state";
import { fmtDate } from "@/components/academy/format";
import { lockCopy } from "@/components/academy/lock-copy";
import { describeError, toApiError, useApi } from "@/components/academy/use-api";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import type {
  AttemptResult,
  ExamResponse,
  NextAfterPass,
  StudentExam,
  StudentQuestion,
} from "@/lib/academy/types";
import { cn } from "@/lib/utils";

type Phase = "intro" | "active" | "result";
type Answer = number[] | string;
type Answers = Record<string, Answer>;
type SubmitResponse = { result: AttemptResult; next: NextAfterPass; stored?: boolean };

const TEXT_MAX = 600;

function isAnswered(answer: Answer | undefined) {
  return Array.isArray(answer) ? answer.length > 0 : typeof answer === "string" && answer.trim() !== "";
}

export function ExamScreen({ slug, examId, isTutor }: { slug: string; examId: string; isTutor: boolean }) {
  const { t } = useLocale();
  const { data, error, loading, reload } = useApi<ExamResponse>(`/api/academia/atividades/${examId}`);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState<SubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const courseHref = `/academia/cursos/${slug}`;

  useEffect(() => {
    if (error && error.code !== "exam_locked") {
      toast.error(describeError(error, t));
    }
  }, [error, t]);

  if (error?.code === "exam_locked") {
    return <LockedCard body={t.exam.locked} courseHref={courseHref} />;
  }

  if (error) {
    return <ErrorState message={describeError(error, t)} onRetry={reload} backHref={courseHref} backLabel={t.player.backToCourse} />;
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  const { exam } = data;
  // A fresh submission wins over the stored best attempt the GET brought.
  const result = submitted?.result ?? data.result;
  const next = submitted?.next ?? data.next;
  const stored = submitted ? submitted.stored !== false : true;
  const currentPhase: Phase = phase ?? (result ? "result" : "intro");
  const title = exam.scope === "final" ? t.course.finalActivity : t.course.moduleActivity;
  const subtitle =
    exam.scope === "final"
      ? exam.courseTitle
      : `${t.course.module(exam.moduleNumber ?? 0)}${exam.moduleTitle ? ` · ${exam.moduleTitle}` : ""}`;

  async function submit() {
    if (submitting) {
      return;
    }

    const payload: Answers = {};
    for (const [id, answer] of Object.entries(answers)) {
      if (isAnswered(answer)) {
        payload[id] = typeof answer === "string" ? answer.trim() : answer;
      }
    }

    setSubmitting(true);
    try {
      const response = await api<SubmitResponse>(`/api/academia/atividades/${examId}`, {
        method: "POST",
        body: { answers: payload },
      });
      setSubmitted(response);
      setMissing([]);
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      const apiError = toApiError(caught);
      if (apiError.code === "unanswered_questions") {
        const ids = Array.isArray(apiError.data.missing)
          ? apiError.data.missing.filter((id): id is string => typeof id === "string")
          : [];
        setMissing(ids);
        toast.error(t.exam.unansweredError);
        if (ids[0]) {
          document.getElementById(`question-${ids[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        toast.error(describeError(apiError, t));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function retake() {
    setAnswers({});
    setMissing([]);
    setPhase("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={courseHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {exam.courseTitle}
        </Link>
        <p className="mt-3 text-sm font-medium text-primary">{subtitle}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-primary-deep sm:text-3xl">
          {title}
        </h1>
      </div>

      {currentPhase === "intro" ? (
        <Intro exam={exam} onStart={() => setPhase("active")} />
      ) : currentPhase === "active" ? (
        <Active
          exam={exam}
          answers={answers}
          missing={missing}
          submitting={submitting}
          onChange={(id, answer) => {
            setAnswers((current) => ({ ...current, [id]: answer }));
            setMissing((current) => current.filter((entry) => entry !== id));
          }}
          onSubmit={() => void submit()}
        />
      ) : result ? (
        <Result
          result={result}
          next={next}
          stored={stored}
          isTutor={isTutor}
          courseHref={courseHref}
          onRetake={retake}
        />
      ) : null}
    </div>
  );
}

function LockedCard({ body, courseHref }: { body: string; courseHref: string }) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary-deep">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold text-primary-deep">{t.exam.locked}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      <Button asChild className="mt-6 rounded-full">
        <Link href={courseHref}>
          <ArrowLeft className="h-4 w-4" />
          {t.player.backToCourse}
        </Link>
      </Button>
    </div>
  );
}

function Intro({ exam, onStart }: { exam: StudentExam; onStart: () => void }) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-card sm:p-8">
      <h2 className="font-display text-xl font-semibold text-primary-deep">{t.exam.introTitle}</h2>
      <p className="mt-2 text-sm font-medium text-primary">
        {t.common.questions(exam.questionCount)} · {t.exam.notPassed(exam.passThreshold)}
      </p>
      <p className="mt-4 text-muted-foreground">{t.exam.introBody}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t.exam.introReviewNote}</p>

      {!exam.unlocked ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-secondary/60 p-4 text-sm text-secondary-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{lockCopy(exam.lockReason, t)}</span>
        </div>
      ) : null}

      <div className="mt-6">
        <Button
          type="button"
          size="lg"
          className="rounded-full bg-gradient-cta px-8 shadow-soft hover:opacity-90"
          onClick={onStart}
          disabled={!exam.unlocked || exam.questions.length === 0}
        >
          {t.exam.start}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function Active({
  exam,
  answers,
  missing,
  submitting,
  onChange,
  onSubmit,
}: {
  exam: StudentExam;
  answers: Answers;
  missing: string[];
  submitting: boolean;
  onChange: (id: string, answer: Answer) => void;
  onSubmit: () => void;
}) {
  const { t } = useLocale();
  const answered = exam.questions.filter(
    (question) => question.qtype !== "reflection" && isAnswered(answers[question.id]),
  ).length;
  const ready = answered >= exam.requiredCount;

  return (
    <div className="space-y-4">
      {exam.questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          index={index}
          total={exam.questions.length}
          answer={answers[question.id]}
          flagged={missing.includes(question.id)}
          onChange={(answer) => onChange(question.id, answer)}
        />
      ))}

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/60 bg-card/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:rounded-t-2xl sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">
            {t.exam.answeredOf(answered, exam.requiredCount)}
          </span>
          <Button type="button" className="rounded-full" onClick={onSubmit} disabled={!ready || submitting}>
            {submitting ? t.exam.submitting : t.exam.submit}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  total,
  answer,
  flagged,
  onChange,
}: {
  question: StudentQuestion;
  index: number;
  total: number;
  answer: Answer | undefined;
  flagged: boolean;
  onChange: (answer: Answer) => void;
}) {
  const { t } = useLocale();
  const selected = Array.isArray(answer) ? answer : [];
  const options = question.qtype === "truefalse" ? [t.exam.trueLabel, t.exam.falseLabel] : question.options;
  const isMulti = question.qtype === "multi";
  const isText = question.qtype === "text" || question.qtype === "reflection";

  function toggle(optionIndex: number) {
    if (!isMulti) {
      onChange([optionIndex]);
      return;
    }
    onChange(
      selected.includes(optionIndex)
        ? selected.filter((value) => value !== optionIndex)
        : [...selected, optionIndex].sort((a, b) => a - b),
    );
  }

  return (
    <section
      id={`question-${question.id}`}
      className={cn(
        "rounded-3xl border bg-card p-5 shadow-card sm:p-6",
        flagged ? "border-coral/60 ring-2 ring-coral/30" : "border-border/60",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {t.exam.questionOf(index + 1, total)}
      </p>
      <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">{question.text}</h2>

      {isText ? (
        <div className="mt-4 space-y-2">
          <Textarea
            value={typeof answer === "string" ? answer : ""}
            onChange={(event) => onChange(event.target.value.slice(0, TEXT_MAX))}
            maxLength={TEXT_MAX}
            rows={4}
            className="rounded-2xl"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{question.qtype === "reflection" ? t.exam.reflectionHint : t.exam.textHint}</span>
            <span className="tabular-nums">
              {(typeof answer === "string" ? answer : "").length}/{TEXT_MAX}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {isMulti ? <p className="text-xs text-muted-foreground">{t.exam.multiHint}</p> : null}
          <div role={isMulti ? "group" : "radiogroup"} className="space-y-2">
            {options.map((option, optionIndex) => {
              const active = selected.includes(optionIndex);
              return (
                <button
                  key={optionIndex}
                  type="button"
                  role={isMulti ? "checkbox" : "radio"}
                  aria-checked={active}
                  onClick={() => toggle(optionIndex)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition",
                    active
                      ? "border-primary bg-primary/10 text-foreground shadow-soft"
                      : "border-border/60 bg-background text-foreground hover:border-primary/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center border-2",
                      isMulti ? "rounded-md" : "rounded-full",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50",
                    )}
                  >
                    {active ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

type Mark = "ok" | "bad" | "missed" | null;

function Result({
  result,
  next,
  stored,
  isTutor,
  courseHref,
  onRetake,
}: {
  result: AttemptResult;
  next: NextAfterPass;
  stored: boolean;
  isTutor: boolean;
  courseHref: string;
  onRetake: () => void;
}) {
  const { t, language } = useLocale();
  const courseSlugHref = courseHref;

  let nextButton: ReactNode = null;
  if (result.passed) {
    if (next.courseCompleted) {
      nextButton = (
        <Button asChild className="rounded-full bg-gradient-cta shadow-soft hover:opacity-90">
          <Link href={`${courseSlugHref}/concluido`}>
            {t.exam.viewCourse}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      );
    } else if (next.nextLessonId) {
      nextButton = (
        <Button asChild className="rounded-full bg-gradient-cta shadow-soft hover:opacity-90">
          <Link href={`${courseSlugHref}/aulas/${next.nextLessonId}`}>
            {t.exam.nextLesson}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      );
    } else if (next.finalExamId) {
      nextButton = (
        <Button asChild className="rounded-full bg-gradient-cta shadow-soft hover:opacity-90">
          <Link href={`${courseSlugHref}/atividade/${next.finalExamId}`}>
            {t.exam.finalActivity}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      );
    }
  }

  return (
    <div className="space-y-4">
      {!stored || isTutor ? (
        <p className="rounded-2xl bg-accent/70 px-4 py-2 text-sm text-accent-foreground">{t.admin.tutorView}</p>
      ) : null}

      <section
        className={cn(
          "rounded-3xl p-6 sm:p-8",
          result.passed
            ? "bg-gradient-cta text-primary-foreground shadow-glow"
            : "border border-coral/40 bg-card text-foreground shadow-card",
        )}
      >
        <p className={cn("text-sm font-medium", result.passed ? "text-primary-foreground/85" : "text-primary")}>
          {t.exam.resultTitle}
        </p>
        <h2 className="mt-1 font-display text-3xl font-semibold">
          {result.passed ? t.exam.passed : t.exam.notPassed(result.passThreshold)}
        </h2>
        <p className={cn("mt-2", result.passed ? "text-primary-foreground/85" : "text-muted-foreground")}>
          {t.exam.score(result.mcCorrect, result.mcTotal, result.scorePct)}
          {result.pendingReviewCount > 0 ? ` · ${t.exam.pending}` : ""}
        </p>
        <p className={cn("mt-1 text-xs", result.passed ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {fmtDate(result.submittedAt, language)}
        </p>
      </section>

      {result.questions.map((question, index) => (
        <ResultQuestion key={question.id} question={question} index={index} total={result.questions.length} result={result} />
      ))}

      <div className="flex flex-wrap gap-3 pt-2">
        {nextButton}
        <Button type="button" variant={nextButton ? "outline" : "default"} className="rounded-full" onClick={onRetake}>
          <RotateCcw className="h-4 w-4" />
          {t.exam.retry}
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={courseHref}>
            <ArrowLeft className="h-4 w-4" />
            {t.player.backToCourse}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ResultQuestion({
  question,
  index,
  total,
  result,
}: {
  question: StudentQuestion;
  index: number;
  total: number;
  result: AttemptResult;
}) {
  const { t, language } = useLocale();
  const answer = result.answers[question.id];
  const detail = result.detail[question.id];
  const review = result.reviews.find((entry) => entry.questionId === question.id);
  const isText = question.qtype === "text" || question.qtype === "reflection";
  const selected = Array.isArray(answer) ? answer : [];
  const correct = result.correct[question.id] ?? [];
  const options = question.qtype === "truefalse" ? [t.exam.trueLabel, t.exam.falseLabel] : question.options;
  const explanation = question.qtype === "truefalse" ? (result.explanations[question.id] ?? "") : "";

  const chip: ReactNode = isText ? (
    review?.reviewed ? (
      <Chip tone="mint">{t.exam.reviewed}</Chip>
    ) : question.qtype === "reflection" ? (
      <Chip tone="muted">{t.exam.sent}</Chip>
    ) : (
      <Chip tone="muted">{t.exam.pending}</Chip>
    )
  ) : detail === true ? (
    <Chip tone="mint">
      <CircleCheck className="h-3 w-3" />
      {t.exam.correct}
    </Chip>
  ) : (
    <Chip tone="destructive">
      <X className="h-3 w-3" />
      {t.exam.incorrect}
    </Chip>
  );

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t.exam.questionOf(index + 1, total)}
        </p>
        {chip}
      </div>
      <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">{question.text}</h2>

      {isText ? (
        <div className="mt-4 rounded-2xl bg-secondary/60 p-4 text-sm">
          {typeof answer === "string" && answer.trim() ? (
            <p className="whitespace-pre-wrap text-foreground">{answer}</p>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {options.map((option, optionIndex) => {
            const isSelected = selected.includes(optionIndex);
            const isCorrect = correct.includes(optionIndex);
            const mark: Mark = isSelected && isCorrect ? "ok" : isSelected ? "bad" : isCorrect ? "missed" : null;

            return (
              <li
                key={optionIndex}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
                  mark === "ok" && "border-mint bg-mint/40 text-mint-foreground",
                  mark === "bad" && "border-destructive/40 bg-destructive/10 text-foreground",
                  mark === "missed" && "border-primary/50 bg-primary/5 text-foreground",
                  mark === null && "border-border/60 bg-background text-muted-foreground",
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {mark === "ok" ? (
                    <CircleCheck className="h-5 w-5 text-mint-foreground" />
                  ) : mark === "bad" ? (
                    <X className="h-5 w-5 text-destructive" />
                  ) : mark === "missed" ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : null}
                </span>
                <span className="flex-1">{option}</span>
                {mark === "missed" ? (
                  <span className="shrink-0 text-xs font-medium text-primary">{t.exam.correctAnswer}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {explanation ? (
        <div
          className={cn(
            "mt-4 rounded-2xl p-4 text-sm",
            detail === true ? "bg-mint/30 text-mint-foreground" : "bg-coral/10 text-foreground",
          )}
        >
          <p className="font-semibold">{detail === true ? t.exam.explanationOk : t.exam.explanationBad}</p>
          <p className="mt-1 whitespace-pre-wrap">{explanation}</p>
        </div>
      ) : null}

      {review?.feedback ? (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-primary-deep">{t.exam.tutorFeedback}</p>
          <p className="mt-1 whitespace-pre-wrap text-foreground">{review.feedback}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {review.gradedBy}
            {review.gradedAt ? ` · ${fmtDate(review.gradedAt, language)}` : ""}
          </p>
        </div>
      ) : null}
    </section>
  );
}
