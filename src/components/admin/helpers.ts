"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { useLocale } from "@/components/academy/locale-provider";
import { ApiError } from "@/lib/academy/api-client";

// Dates in the panel follow the tutor's UI language, not the browser's.
export function useDateFormat() {
  const { language } = useLocale();

  return useMemo(() => {
    const formatter = new Intl.DateTimeFormat(
      language === "en" ? "en-GB" : language === "es" ? "es" : "pt-BR",
      { dateStyle: "medium" },
    );

    return (value: string | null | undefined) => (value ? formatter.format(new Date(value)) : "—");
  }, [language]);
}

// The API's `error` text is already a sentence meant for people; anything
// else (network, a thrown bug) gets the generic line.
export function toastError(error: unknown, fallback: string) {
  toast.error(error instanceof ApiError && error.message ? error.message : fallback);
}

// Client-side ids for list rows that do not exist in the database yet. They
// never reach the server: `isPersistedId` filters them out before a save.
export function tempId() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

export function isPersistedId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}
