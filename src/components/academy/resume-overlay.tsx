"use client";

import { Play, RotateCcw } from "lucide-react";

import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";

export function ResumeOverlay({
  onContinue,
  onRestart,
  disabled,
}: {
  onContinue: () => void;
  onRestart: () => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary-deep/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-5 text-center shadow-glow">
        <p className="font-display text-lg font-semibold text-primary-deep">{t.player.resumeTitle}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" className="rounded-full" onClick={onContinue} disabled={disabled}>
            <Play className="h-4 w-4 fill-current" />
            {t.player.resumeContinue}
          </Button>
          <Button type="button" variant="outline" className="rounded-full" onClick={onRestart} disabled={disabled}>
            <RotateCcw className="h-4 w-4" />
            {t.player.resumeRestart}
          </Button>
        </div>
      </div>
    </div>
  );
}
