"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { fmtDate } from "@/components/academy/format";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMe } from "@/components/academy/use-api";
import { api } from "@/lib/academy/api-client";
import type { MeResponse } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

type Notification = MeResponse["notifications"][number];

export function NotificationsBell() {
  const { t, language } = useLocale();
  const router = useRouter();
  const me = useMe();
  // Opened here before `/me` is fetched again.
  const [seenHere, setSeenHere] = useState<ReadonlySet<string>>(() => new Set());
  const [open, setOpen] = useState(false);
  const items: Notification[] = (me?.notifications ?? []).map((item) =>
    seenHere.has(item.questionId) ? { ...item, seen: true } : item,
  );

  const unread = items.filter((item) => !item.seen).length;

  function openNotification(item: Notification) {
    if (!item.seen) {
      setSeenHere((current) => new Set(current).add(item.questionId));
      void api(`/api/academia/perguntas/${item.questionId}/vista`, { method: "POST" }).catch(
        () => {},
      );
    }

    setOpen(false);
    router.push(`/academia/cursos/${item.courseSlug}/aulas/${item.lessonId}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative rounded-full"
          aria-label={t.header.notifications}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-coral-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-2">
        <p className="px-3 py-2 font-display text-base font-semibold text-primary-deep">
          {t.header.notifications}
        </p>
        {items.length === 0 ? (
          <p className="px-3 pb-3 pt-1 text-sm text-muted-foreground">{t.header.noNotifications}</p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {items.map((item) => (
              <li key={item.questionId}>
                <button
                  type="button"
                  onClick={() => openNotification(item)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left transition hover:bg-accent",
                    !item.seen && "bg-secondary/70",
                  )}
                >
                  <p className="text-xs font-medium text-primary">{item.lessonLabel}</p>
                  <p className="line-clamp-2 text-sm text-foreground">{item.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.header.answeredBy(item.answeredBy)} · {fmtDate(item.answeredAt, language)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
