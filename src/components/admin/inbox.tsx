"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeading } from "@/components/admin/admin-shell";
import { toastError, useDateFormat } from "@/components/admin/helpers";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import type { AdminQuestionRow } from "@/lib/academy/types";

type Status = "open" | "answered" | "archived";

function QuestionCard({
  question,
  onChanged,
}: {
  question: AdminQuestionRow;
  onChanged: (next: AdminQuestionRow) => void;
}) {
  const { t } = useLocale();
  const formatDate = useDateFormat();
  const [answer, setAnswer] = useState(question.answer);
  const [busy, setBusy] = useState(false);

  async function patch(body: { answer?: string; status?: Status }) {
    setBusy(true);
    try {
      const data = await api<{ question: AdminQuestionRow }>(`/api/admin/perguntas/${question.id}`, {
        method: "PATCH",
        body,
      });
      onChanged(data.question);
      toast.success(t.admin.saved);
    } catch (error) {
      toastError(error, t.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border/60 shadow-card">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <Link
            href={`/admin/alunos/${question.studentId}`}
            className="font-medium text-primary-deep hover:underline"
          >
            {question.studentName}
          </Link>
          <span className="text-xs text-muted-foreground">
            {question.courseTitle} · {question.lessonLabel} · {formatDate(question.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-line text-sm">{question.text}</p>

        {question.answeredAt ? (
          <p className="text-xs text-muted-foreground">
            {t.header.answeredBy(question.answeredBy)} · {formatDate(question.answeredAt)}
          </p>
        ) : null}

        {question.status !== "archived" ? (
          <>
            <Textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={t.admin.answerPlaceholder}
              rows={3}
              disabled={busy}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void patch({ status: "archived" })}
              >
                {t.admin.archive}
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={busy || !answer.trim() || answer.trim() === question.answer}
                onClick={() => void patch({ answer })}
              >
                {busy ? t.admin.answering : t.admin.answer}
              </Button>
            </div>
          </>
        ) : question.answer ? (
          <p className="whitespace-pre-line rounded-lg bg-secondary/60 p-3 text-sm">{question.answer}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function Inbox() {
  const { t } = useLocale();
  const [status, setStatus] = useState<Status>("open");
  // The list remembers which tab it belongs to, so switching tabs shows the
  // skeleton until the right one arrives instead of the previous tab's rows.
  const [loaded, setLoaded] = useState<{ status: Status; questions: AdminQuestionRow[] } | null>(null);
  const questions = loaded?.status === status ? loaded.questions : null;

  useEffect(() => {
    let cancelled = false;
    api<{ questions: AdminQuestionRow[] }>(`/api/admin/perguntas?status=${status}`)
      .then((data) => {
        if (!cancelled) setLoaded({ status, questions: data.questions });
      })
      .catch((error) => toastError(error, t.common.error));
    return () => {
      cancelled = true;
    };
  }, [status, t]);

  // A question whose status changed belongs to another tab now.
  function handleChanged(next: AdminQuestionRow) {
    setLoaded((current) =>
      current
        ? {
            ...current,
            questions: current.questions
              .map((item) => (item.id === next.id ? next : item))
              .filter((item) => item.status === current.status),
          }
        : current,
    );
  }

  return (
    <>
      <PageHeading title={t.admin.inboxHeading} description={t.admin.inboxDescription} />

      <Tabs value={status} onValueChange={(value) => setStatus(value as Status)} className="mb-6">
        <TabsList>
          <TabsTrigger value="open">{t.admin.statusOpen}</TabsTrigger>
          <TabsTrigger value="answered">{t.admin.statusAnswered}</TabsTrigger>
          <TabsTrigger value="archived">{t.admin.statusArchived}</TabsTrigger>
        </TabsList>
      </Tabs>

      {!questions ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.admin.noQuestions}</p>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} onChanged={handleChanged} />
          ))}
        </div>
      )}
    </>
  );
}
