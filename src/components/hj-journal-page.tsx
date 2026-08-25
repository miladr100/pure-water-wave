"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Frown,
  Plus,
  Smile,
  Target,
} from "lucide-react";

import { LibraryHeader } from "@/components/library-header";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SessionPayload } from "@/lib/auth";
import type { UserLanguage } from "@/lib/user-languages";
import { cn } from "@/lib/utils";

type HjJournalPageProps = {
  session: SessionPayload;
};

type JournalDay = {
  date: string;
  dayNumber: number;
};

type JournalEntry = {
  date: string;
  dayNumber: number;
  hoonDokWords: string;
  aha: string;
  goal: string;
  actionPlan: string;
  analysis: string;
  rating: number | null;
};

const DATE_LOCALES: Record<UserLanguage, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es",
};

function formatEntryDate(isoDate: string, language: UserLanguage) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(DATE_LOCALES[language], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonthLabel(isoDate: string, language: UserLanguage) {
  const [year, month] = isoDate.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString(
    DATE_LOCALES[language],
    { month: "long", year: "numeric" },
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function groupDaysByMonth(days: JournalDay[]) {
  const groups: { key: string; sampleDate: string; days: JournalDay[] }[] = [];

  for (const item of days) {
    const key = item.date.slice(0, 7);
    const current = groups.find((group) => group.key === key);

    if (current) {
      current.days.push(item);
    } else {
      groups.push({ key, sampleDate: item.date, days: [item] });
    }
  }

  return groups.sort((a, b) => a.key.localeCompare(b.key));
}

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const emptyFields = {
  hoonDokWords: "",
  aha: "",
  goal: "",
  actionPlan: "",
  analysis: "",
  rating: null as number | null,
};

export function HjJournalPage({ session }: HjJournalPageProps) {
  const { language, t } = useLocale();
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const [date, setDate] = useState(todayIsoDate);
  const [dayNumber, setDayNumber] = useState(1);
  const [days, setDays] = useState<JournalDay[]>([]);
  const [form, setForm] = useState(emptyFields);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const applyLoaded = useCallback(
    (data: {
      dayNumber?: number;
      entry?: JournalEntry | null;
      days?: JournalDay[];
    }) => {
      const nextDayNumber = data.dayNumber ?? 1;
      setDayNumber(nextDayNumber);
      setDays(data.days ?? []);

      if (data.entry) {
        setDate(data.entry.date);
        setForm({
          hoonDokWords: data.entry.hoonDokWords,
          aha: data.entry.aha,
          goal: data.entry.goal,
          actionPlan: data.entry.actionPlan,
          analysis: data.entry.analysis,
          rating: data.entry.rating,
        });
        return;
      }

      setDate(todayIsoDate());
      setForm(emptyFields);
    },
    [],
  );

  const loadEntry = useCallback(
    async (nextDayNumber?: number) => {
      setIsLoading(true);
      setError(null);
      setInfo(null);

      try {
        const query =
          nextDayNumber != null
            ? `?dayNumber=${encodeURIComponent(String(nextDayNumber))}`
            : "";
        const response = await fetch(`/api/biblioteca/hjournal${query}`, {
          credentials: "same-origin",
        });
        const data = (await response.json()) as {
          error?: string;
          dayNumber?: number;
          entry?: JournalEntry | null;
          days?: JournalDay[];
        };

        if (!response.ok) {
          setError(data.error ?? t.journal.loadFailed);
          return;
        }

        const today = todayIsoDate();
        const todayDay = data.days?.find((item) => item.date === today);

        if (nextDayNumber == null && todayDay) {
          if (todayDay.dayNumber !== data.dayNumber || !data.entry) {
            await loadEntry(todayDay.dayNumber);
            return;
          }
        }

        applyLoaded(data);
      } catch {
        setError(t.journal.loadFailed);
      } finally {
        setIsLoading(false);
      }
    },
    [applyLoaded, t.journal.loadFailed],
  );

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  function handleNewDay() {
    const nextDayNumber =
      days.reduce((max, item) => Math.max(max, item.dayNumber), 0) + 1;

    setError(null);
    setInfo(null);
    setDayNumber(nextDayNumber);
    setDate(todayIsoDate());
    setForm(emptyFields);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/biblioteca/hjournal", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayNumber,
          date,
          ...form,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        code?: string;
        dayNumber?: number;
        days?: JournalDay[];
      };

      if (!response.ok) {
        setError(
          data.code === "DATE_IN_USE"
            ? t.journal.dateInUse
            : (data.error ?? t.journal.saveFailed),
        );
        return;
      }

      setDayNumber(data.dayNumber ?? dayNumber);
      setDays(data.days ?? days);
      setInfo(t.journal.saved);
    } catch {
      setError(t.journal.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  const currentIndex = days.findIndex((item) => item.dayNumber === dayNumber);
  const isSavedDay = currentIndex >= 0;
  const previousDayNumber =
    currentIndex > 0
      ? days[currentIndex - 1].dayNumber
      : !isSavedDay && days.length > 0
        ? days[days.length - 1].dayNumber
        : null;
  const nextDayNumber =
    currentIndex >= 0 && currentIndex < days.length - 1
      ? days[currentIndex + 1].dayNumber
      : null;
  const monthGroups = groupDaysByMonth(days);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-background to-background dark:from-background">
      <LibraryHeader
        title={t.header.journalTitle}
        subtitle={t.header.journalSubtitle(firstName)}
        fullName={session.fullName}
        showBackToLibrary
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <form onSubmit={handleSave} className="space-y-6">
          <section className="overflow-hidden rounded-2xl bg-[#7BA7C2] text-white shadow-card">
            <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase">
                  {t.journal.brand}
                </p>
                <p className="mt-1 font-display text-4xl font-semibold">
                  {t.journal.day(dayNumber)}
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="journal-date" className="text-white/90">
                  {t.journal.date}
                </Label>
                <Input
                  id="journal-date"
                  type="date"
                  value={date}
                  max={todayIsoDate()}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-10 border-white/40 bg-white text-slate-900 scheme-light dark:bg-white dark:text-slate-900"
                  disabled={isLoading || isSaving}
                />
              </div>
            </div>
          </section>

          {days.length > 0 ? (
            <section className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                {t.journal.jumpToDay}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t.journal.previousDay}
                    disabled={isLoading || isSaving || previousDayNumber == null}
                    onClick={() => {
                      if (previousDayNumber != null) {
                        void loadEntry(previousDayNumber);
                      }
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Select
                    value={isSavedDay ? String(dayNumber) : undefined}
                    onValueChange={(value) => {
                      void loadEntry(Number(value));
                    }}
                    disabled={isLoading || isSaving}
                  >
                    <SelectTrigger className="flex-1" aria-label={t.journal.jumpToDay}>
                      <SelectValue placeholder={t.journal.day(dayNumber)} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {monthGroups.map((group) => (
                        <SelectGroup key={group.key}>
                          <SelectLabel>
                            {formatMonthLabel(group.sampleDate, language)}
                          </SelectLabel>
                          {group.days.map((item) => (
                            <SelectItem
                              key={item.dayNumber}
                              value={String(item.dayNumber)}
                            >
                              {t.journal.dayWithDate(
                                item.dayNumber,
                                formatEntryDate(item.date, language),
                              )}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t.journal.nextDay}
                    disabled={isLoading || isSaving || nextDayNumber == null}
                    onClick={() => {
                      if (nextDayNumber != null) {
                        void loadEntry(nextDayNumber);
                      }
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNewDay}
                  disabled={isLoading || isSaving}
                >
                  <Plus className="h-4 w-4" />
                  {t.journal.newDay}
                </Button>
              </div>
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">{t.journal.emptyDays}</p>
          )}

          <JournalSection
            icon={<BookOpen className="h-5 w-5" />}
            title={t.journal.hoonDokTitle}
          >
            <div className="space-y-2">
              <Label htmlFor="hoon-dok-words">{t.journal.hoonDokWords}</Label>
              <Input
                id="hoon-dok-words"
                value={form.hoonDokWords}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hoonDokWords: event.target.value,
                  }))
                }
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hoon-dok-aha">{t.journal.hoonDokAha}</Label>
              <Textarea
                id="hoon-dok-aha"
                rows={4}
                value={form.aha}
                onChange={(event) =>
                  setForm((current) => ({ ...current, aha: event.target.value }))
                }
                disabled={isLoading || isSaving}
              />
            </div>
          </JournalSection>

          <JournalSection
            icon={<Target className="h-5 w-5" />}
            title={t.journal.goalTitle}
          >
            <div className="space-y-2">
              <Label htmlFor="journal-goal">{t.journal.goal}</Label>
              <Input
                id="journal-goal"
                value={form.goal}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    goal: event.target.value,
                  }))
                }
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journal-plan">{t.journal.actionPlan}</Label>
              <Textarea
                id="journal-plan"
                rows={5}
                value={form.actionPlan}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    actionPlan: event.target.value,
                  }))
                }
                disabled={isLoading || isSaving}
              />
            </div>
          </JournalSection>

          <JournalSection
            icon={<ClipboardList className="h-5 w-5" />}
            title={t.journal.analysisTitle}
          >
            <Textarea
              id="journal-analysis"
              rows={8}
              placeholder={t.journal.analysisPlaceholder}
              value={form.analysis}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  analysis: event.target.value,
                }))
              }
              disabled={isLoading || isSaving}
            />

            <div className="space-y-3">
              <p className="text-sm font-medium">{t.journal.ratingLabel}</p>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#7BA7C2]/50 px-3 py-3">
                <Frown className="h-6 w-6 shrink-0 text-[#7BA7C2]" />
                <div className="flex flex-1 justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          rating: current.rating === value ? null : value,
                        }))
                      }
                      disabled={isLoading || isSaving}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition",
                        form.rating === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-[#7BA7C2]/70 bg-background hover:bg-[#7BA7C2]/10",
                      )}
                      aria-pressed={form.rating === value}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <Smile className="h-6 w-6 shrink-0 text-[#7BA7C2]" />
              </div>
            </div>
          </JournalSection>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {info ? <p className="text-sm text-primary">{info}</p> : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading || isSaving}
          >
            {isSaving ? t.journal.saving : t.journal.save}
          </Button>
        </form>
      </main>
    </div>
  );
}

function JournalSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#7BA7C2]/45 bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2 text-primary-deep">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7BA7C2]/15 text-[#5A8AAB]">
          {icon}
        </span>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
