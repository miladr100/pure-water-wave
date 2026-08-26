"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Lightbulb, Save } from "lucide-react";

import { LibraryHeader } from "@/components/library-header";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SessionPayload } from "@/lib/auth";
import { formatHdhTitle } from "@/lib/hdh-title";
import { getHdhMeditationDay } from "@/lib/hdh-meditation";

type HdhMeditationDayPageProps = {
  session: SessionPayload;
  dayId: number;
  previousDayId: number | null;
  nextDayId: number | null;
};

type ReflectionEntry = {
  answers: string[];
  inspiration: string;
};

function emptyAnswers(count: number) {
  return Array.from({ length: count }, () => "");
}

export function HdhMeditationDayPage({
  session,
  dayId,
  previousDayId,
  nextDayId,
}: HdhMeditationDayPageProps) {
  const { language, t } = useLocale();
  const day = getHdhMeditationDay(dayId, language);
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const [answers, setAnswers] = useState(() =>
    emptyAnswers(day?.questions.length ?? 0),
  );
  const [inspiration, setInspiration] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const loadEntry = useCallback(async () => {
    if (!day) {
      return;
    }

    setIsLoading(true);
    setError("");
    setInfo("");

    try {
      const response = await fetch(
        `/api/biblioteca/hdhreflection?dayId=${day.id}`,
      );
      const data = (await response.json()) as {
        entry?: ReflectionEntry | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? t.hdh.loadFailed);
      }

      const savedAnswers = data.entry?.answers ?? [];
      setAnswers(
        day.questions.map((_, index) => savedAnswers[index] ?? ""),
      );
      setInspiration(data.entry?.inspiration ?? "");
    } catch {
      setError(t.hdh.loadFailed);
      setAnswers(emptyAnswers(day.questions.length));
      setInspiration("");
    } finally {
      setIsLoading(false);
    }
  }, [day, t.hdh.loadFailed]);

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  if (!day) {
    return null;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!day) {
      return;
    }

    setIsSaving(true);
    setError("");
    setInfo("");

    try {
      const response = await fetch("/api/biblioteca/hdhreflection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId: day.id,
          answers,
          inspiration,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? t.hdh.saveFailed);
      }

      setInfo(t.hdh.saved);
    } catch {
      setError(t.hdh.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  const readingParagraphs = day.reading.split(/\n\n+/);
  const disabled = isLoading || isSaving;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-background to-background dark:from-background">
      <LibraryHeader
        title={t.header.hdhTitle}
        subtitle={t.header.hdhSubtitle(firstName)}
        fullName={session.fullName}
        showBackToLibrary
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/biblioteca/ferramentas/hdh-meditacao">
              <ArrowLeft className="h-4 w-4" />
              {t.hdh.backToDays}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {previousDayId ? (
              <Button asChild variant="outline" size="icon" aria-label={t.hdh.previousDay}>
                <Link href={`/biblioteca/ferramentas/hdh-meditacao/${previousDayId}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" aria-label={t.hdh.previousDay} disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {nextDayId ? (
              <Button asChild variant="outline" size="icon" aria-label={t.hdh.nextDay}>
                <Link href={`/biblioteca/ferramentas/hdh-meditacao/${nextDayId}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" aria-label={t.hdh.nextDay} disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl bg-[#7BA7C2] text-white shadow-card">
          <div className="px-6 py-6">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase">
              {t.hdh.brand}
            </p>
            <p className="mt-1 text-sm font-medium text-white/85">
              {t.hdh.day(day.id)}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-balance">
              {formatHdhTitle(day.title)}
            </h1>
          </div>
        </section>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold text-primary-deep">
              {t.hdh.readingTitle}
            </h2>
            <div className="mt-4 space-y-4 text-[1.05rem] leading-8 text-foreground/90">
              {readingParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold text-primary-deep">
              {t.hdh.questionsTitle}
            </h2>
            <div className="mt-5 space-y-6">
              {day.questions.map((question, index) => (
                <div key={`${day.id}-q-${index}`} className="space-y-2">
                  <Label htmlFor={`hdh-answer-${index}`} className="text-base leading-6">
                    {index + 1}. {question}
                  </Label>
                  <Textarea
                    id={`hdh-answer-${index}`}
                    value={answers[index] ?? ""}
                    onChange={(event) => {
                      const next = [...answers];
                      next[index] = event.target.value;
                      setAnswers(next);
                    }}
                    placeholder={t.hdh.answerPlaceholder}
                    className="min-h-24"
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-6 shadow-card dark:border-amber-900/40 dark:bg-amber-950/20">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-primary-deep">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              {t.hdh.inspirationTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.hdh.inspirationHint}
            </p>
            <Textarea
              id="hdh-inspiration"
              value={inspiration}
              onChange={(event) => setInspiration(event.target.value)}
              placeholder={t.hdh.inspirationPlaceholder}
              className="mt-4 min-h-36 bg-background"
              disabled={disabled}
            />
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-5 text-sm">
              {error ? <p className="text-destructive">{error}</p> : null}
              {info ? <p className="text-emerald-700 dark:text-emerald-400">{info}</p> : null}
            </div>
            <Button type="submit" disabled={disabled} className="sm:min-w-44">
              <Save className="h-4 w-4" />
              {isSaving ? t.hdh.saving : t.hdh.save}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
