"use client";

import { Pause, Play, Square, Volume2 } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import type { useDeviceSpeech } from "@/hooks/use-device-speech";

type TextSpeechControlsProps = {
  speech: ReturnType<typeof useDeviceSpeech>;
};

export function TextSpeechControls({ speech }: TextSpeechControlsProps) {
  const { t } = useLocale();

  if (!speech.supported) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {speech.status === "idle" ? (
        <Button type="button" variant="outline" size="sm" onClick={speech.play}>
          <Volume2 className="h-4 w-4" />
          {t.dpIndex.listen}
        </Button>
      ) : null}

      {speech.status === "playing" ? (
        <Button type="button" variant="outline" size="sm" onClick={speech.pause}>
          <Pause className="h-4 w-4" />
          {t.dpIndex.pauseSpeech}
        </Button>
      ) : null}

      {speech.status === "paused" ? (
        <Button type="button" variant="outline" size="sm" onClick={speech.resume}>
          <Play className="h-4 w-4" />
          {t.dpIndex.resumeSpeech}
        </Button>
      ) : null}

      {speech.status !== "idle" ? (
        <Button type="button" variant="outline" size="sm" onClick={speech.stop}>
          <Square className="h-4 w-4" />
          {t.dpIndex.stopSpeech}
        </Button>
      ) : null}

      {speech.status !== "idle" ? (
        <span className="text-sm text-muted-foreground">
          {speech.status === "paused"
            ? t.dpIndex.speechPaused
            : t.dpIndex.speechPlaying}
        </span>
      ) : null}
    </div>
  );
}
