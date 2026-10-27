"use client";

import { MessageCircleQuestion, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { fmtDate } from "@/components/academy/format";
import { describeError, toApiError, useApi } from "@/components/academy/use-api";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import type { LessonQuestion } from "@/lib/academy/types";

const MAX_LENGTH = 500;

export function LessonQuestions({ lessonId }: { lessonId: string }) {
  const { t } = useLocale();
  const { data, error, loading } = useApi<{ questions: LessonQuestion[] }>(
    `/api/academia/perguntas?lessonId=${encodeURIComponent(lessonId)}`,
  );
  const [extra, setExtra] = useState<LessonQuestion[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(describeError(error, t));
    }
  }, [error, t]);

  const questions = [...extra, ...(data?.questions ?? [])];
  useMarkSeen(questions);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) {
      return;
    }

    setSending(true);
    try {
      const response = await api<{ question: LessonQuestion }>("/api/academia/perguntas", {
        method: "POST",
        body: { lessonId, text: trimmed },
      });
      setExtra((current) => [response.question, ...current]);
      setText("");
    } catch (caught) {
      const apiError = toApiError(caught);
      toast.error(
        apiError.code === "too_many_open_questions" ? t.questions.tooMany : describeError(apiError, t),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-primary-deep">
        <MessageCircleQuestion className="h-5 w-5 text-primary" />
        {t.questions.title}
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
          placeholder={t.questions.placeholder}
          maxLength={MAX_LENGTH}
          rows={3}
          disabled={sending}
          className="rounded-2xl"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {text.length}/{MAX_LENGTH}
          </span>
          <Button type="submit" className="rounded-full" disabled={sending || !text.trim()}>
            <Send className="h-4 w-4" />
            {sending ? t.questions.asking : t.questions.ask}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">{t.questions.yourQuestions}</h3>
        {loading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : questions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t.questions.empty}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {questions.map((question) => (
              <li key={question.id}>
                <QuestionItem question={question} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function QuestionItem({ question, meta }: { question: LessonQuestion; meta?: string }) {
  const { t, language } = useLocale();
  const answered = question.status === "answered" && question.answer;

  return (
    <article className="rounded-2xl border border-border/60 bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {meta ? <p className="text-xs font-medium text-primary">{meta}</p> : null}
          <p className="whitespace-pre-wrap text-sm text-foreground">{question.text}</p>
          <p className="mt-1 text-xs text-muted-foreground">{fmtDate(question.createdAt, language)}</p>
        </div>
        <Chip tone={answered ? "mint" : "muted"}>
          {answered ? t.questions.answered : t.questions.pending}
        </Chip>
      </div>
      {answered && question.answer ? (
        <div className="mt-3 rounded-xl bg-secondary/60 p-3">
          <p className="whitespace-pre-wrap text-sm text-foreground">{question.answer.text}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {question.answer.by} · {fmtDate(question.answer.at, language)}
          </p>
        </div>
      ) : null}
    </article>
  );
}

// Rendering an answer counts as reading it; each one is reported once.
export function useMarkSeen(questions: LessonQuestion[]) {
  const reported = useRef(new Set<string>());
  const unseen = questions
    .filter((question) => question.answer && !question.answer.seen)
    .map((question) => question.id)
    .join(",");

  useEffect(() => {
    for (const id of unseen.split(",").filter(Boolean)) {
      if (reported.current.has(id)) {
        continue;
      }
      reported.current.add(id);
      void api(`/api/academia/perguntas/${id}/vista`, { method: "POST" }).catch(() => {});
    }
  }, [unseen]);
}
