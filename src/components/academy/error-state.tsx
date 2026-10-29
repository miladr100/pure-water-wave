"use client";

import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message,
  onRetry,
  backHref,
  backLabel,
}: {
  message: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
      <CircleAlert className="mx-auto h-10 w-10 text-coral" />
      <p className="mt-4 text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onRetry ? (
          <Button type="button" className="rounded-full" onClick={onRetry}>
            {t.common.retry}
          </Button>
        ) : null}
        {backHref ? (
          <Button asChild variant="outline" className="rounded-full">
            <Link href={backHref}>{backLabel ?? t.common.back}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
