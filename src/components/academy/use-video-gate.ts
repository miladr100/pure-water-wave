"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { useLocale } from "@/components/academy/locale-provider";
import { api } from "@/lib/academy/api-client";
import {
  SEEK_TOLERANCE_SEC,
  createProgressSaver,
  resolveSeek,
  watchedCeiling,
} from "@/lib/academy/seekgate";
import type { ProgressBody, VideoPlayback } from "@/lib/academy/types";

export type VideoGate = {
  // Recomputes the ceiling for a (possibly newly known) duration.
  ceilingFor: (duration: number) => number;
  // One reading of the player; `blocked` means the caller must seek back.
  observe: (input: { current: number; duration: number; playing: boolean }) => {
    ceiling: number;
    blocked: boolean;
  };
  seek: (target: number, duration: number) => { time: number; blocked: boolean };
  flush: (current: number, duration: number) => void;
  // Writes the final 100 and resolves once that write is answered.
  ended: () => Promise<void>;
};

const TOAST_EVERY_MS = 3000;

// The cap and the saver are the same for both players; only the way the
// player reports time differs. Tutors get no cap and no writes at all.
export function useVideoGate({
  video,
  lessonId,
  isTutor,
}: {
  video: VideoPlayback;
  lessonId: string;
  isTutor: boolean;
}): VideoGate {
  const { t } = useLocale();
  const seedPercent = isTutor || video.completedBefore ? 100 : video.maxPercent;
  const blockedMessage = t.player.seekBlocked;

  return useMemo(
    () => createGate({ lessonId, seedPercent, persist: !isTutor, blockedMessage }),
    [lessonId, seedPercent, isTutor, blockedMessage],
  );
}

function createGate({
  lessonId,
  seedPercent,
  persist,
  blockedMessage,
}: {
  lessonId: string;
  seedPercent: number;
  persist: boolean;
  blockedMessage: string;
}): VideoGate {
  let sessionMax = 0;
  let duration = 0;
  let ceiling = 0;
  let lastToastAt = 0;
  let pending: Promise<unknown> | null = null;

  const saver = persist
    ? createProgressSaver({
        save: (pct, ended) => {
          const body: ProgressBody = {
            lessonId,
            percent: pct,
            ended,
            maxPercent: duration > 0 ? Math.round((ceiling / duration) * 100) : pct,
            maxSeconds: ceiling,
            durationSeconds: duration,
          };
          pending = api("/api/academia/progresso", { method: "POST", body });
          return pending;
        },
      })
    : null;

  const recompute = (nextDuration: number) => {
    duration = nextDuration > 0 ? nextDuration : duration;
    ceiling = watchedCeiling({ seedPercent, sessionMax, duration });
    return ceiling;
  };

  const notify = () => {
    const now = Date.now();
    if (now - lastToastAt >= TOAST_EVERY_MS) {
      lastToastAt = now;
      toast.warning(blockedMessage);
    }
  };

  const percentOf = (current: number) => (duration > 0 ? (current / duration) * 100 : 0);

  return {
    ceilingFor: recompute,

    observe({ current, duration: nextDuration, playing }) {
      recompute(nextDuration);
      if (current > ceiling + SEEK_TOLERANCE_SEC) {
        notify();
        return { ceiling, blocked: true };
      }

      if (current > sessionMax) {
        sessionMax = current;
        ceiling = watchedCeiling({ seedPercent, sessionMax, duration });
      }

      if (playing) {
        saver?.tick(percentOf(current));
      }

      return { ceiling, blocked: false };
    },

    seek(target, nextDuration) {
      recompute(nextDuration);
      const result = resolveSeek({ target, ceiling, duration });
      if (result.blocked) {
        notify();
      }
      return result;
    },

    flush(current, nextDuration) {
      recompute(nextDuration);
      saver?.flush(percentOf(current));
    },

    async ended() {
      if (!saver) {
        return;
      }
      sessionMax = duration;
      ceiling = duration;
      saver.ended();
      if (pending) {
        await pending.catch(() => {});
      }
    },
  };
}
