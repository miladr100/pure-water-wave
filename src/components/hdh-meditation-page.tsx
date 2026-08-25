"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { LibraryHeader } from "@/components/library-header";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionPayload } from "@/lib/auth";
import { getHdhMeditationDays } from "@/lib/hdh-meditation";
import { formatHdhTitle } from "@/lib/hdh-title";

type HdhMeditationPageProps = {
  session: SessionPayload;
};

export function HdhMeditationPage({ session }: HdhMeditationPageProps) {
  const { language, t } = useLocale();
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const [savedDayIds, setSavedDayIds] = useState<Set<number>>(new Set());
  const days = getHdhMeditationDays(language);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedDays() {
      try {
        const response = await fetch("/api/biblioteca/hdhreflection");

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { savedDayIds?: number[] };

        if (!cancelled) {
          setSavedDayIds(new Set(data.savedDayIds ?? []));
        }
      } catch {
        if (!cancelled) {
          setSavedDayIds(new Set());
        }
      }
    }

    void loadSavedDays();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <LibraryHeader
        title={t.header.hdhTitle}
        subtitle={t.header.hdhSubtitle(firstName)}
        fullName={session.fullName}
        showBackToLibrary
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            {t.hdh.brand}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            {t.hdh.daysHeading}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t.hdh.daysDescription}
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {days.map((day) => {
            const saved = savedDayIds.has(day.id);

            return (
              <Card
                key={day.id}
                className="flex h-full flex-col overflow-hidden border-border/60 shadow-card"
              >
                <div className="flex items-center justify-between bg-gradient-to-r from-sky-600 to-primary px-5 py-3 text-white">
                  <p className="text-sm font-semibold tracking-wide">
                    {t.hdh.day(day.id)}
                  </p>
                  {saved ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-white/90">
                      <CheckCircle2 className="h-4 w-4" />
                      {t.hdh.completed}
                    </span>
                  ) : null}
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="font-display text-xl leading-snug text-balance">
                    {formatHdhTitle(day.title)}
                  </CardTitle>
                  <CardDescription>
                    {t.hdh.questionsCount(day.questions.length)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href={`/biblioteca/ferramentas/hdh-meditacao/${day.id}`}>
                      {t.hdh.openDay}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}
