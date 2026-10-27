// Forward-seek cap: a student may not skip past what they have already
// watched. Ported verbatim from the FFPUM academy's `seekgate.js`; enforced by
// the scrubber, the ±10 s buttons and the media element's own `seeking`
// event, because media keys bypass the on-screen controls.

export const SEEK_TOLERANCE_SEC = 0.75;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function watchedCeiling({
  seedPercent = 0,
  sessionMax = 0,
  duration = 0,
}: {
  seedPercent?: number;
  sessionMax?: number;
  duration?: number;
}) {
  if (!(duration > 0)) {
    return 0;
  }

  const fromSeed = (clamp(Number(seedPercent) || 0, 0, 100) / 100) * duration;
  return clamp(Math.max(fromSeed, Number(sessionMax) || 0), 0, duration);
}

export function resolveSeek({
  target,
  ceiling,
  duration = 0,
  tolerance = SEEK_TOLERANCE_SEC,
}: {
  target: number;
  ceiling: number;
  duration?: number;
  tolerance?: number;
}) {
  const wanted = clamp(Number(target) || 0, 0, duration);
  const cap = clamp(Number(ceiling) || 0, 0, duration);

  if (wanted <= cap + tolerance) {
    return { time: wanted, blocked: false };
  }

  return { time: cap, blocked: true };
}

export function canSeekForward({
  current,
  ceiling,
  tolerance = SEEK_TOLERANCE_SEC,
}: {
  current: number;
  ceiling: number;
  tolerance?: number;
}) {
  return (Number(ceiling) || 0) - (Number(current) || 0) > tolerance;
}

// Writes progress at most every `intervalSec`, and only when it moved by at
// least `minDeltaPct`; `flush` ignores the interval (pause, unmount) and
// `ended` writes 100 once and then refuses further writes.
export function createProgressSaver({
  save,
  intervalSec = 12,
  minDeltaPct = 1,
}: {
  save: (pct: number, ended: boolean) => Promise<unknown> | void;
  intervalSec?: number;
  minDeltaPct?: number;
}) {
  let lastSavedPct: number | null = null;
  let lastSaveAt = -Infinity;
  let done = false;

  const write = (pct: number, ended: boolean) => {
    lastSavedPct = pct;
    lastSaveAt = Date.now();
    try {
      const result = save(pct, ended);
      if (result && typeof (result as Promise<unknown>).catch === "function") {
        (result as Promise<unknown>).catch(() => {});
      }
    } catch {
      // A failed write is retried on the next tick.
    }
  };

  const guarded = (pct: number, force: boolean) => {
    if (done) {
      return false;
    }

    const rounded = Math.max(0, Math.min(100, Math.round(pct)));
    if (lastSavedPct !== null && Math.abs(rounded - lastSavedPct) < minDeltaPct) {
      return false;
    }

    if (!force && Date.now() - lastSaveAt < intervalSec * 1000) {
      return false;
    }

    write(rounded, false);
    return true;
  };

  return {
    tick: (pct: number) => guarded(pct, false),
    flush: (pct: number) => guarded(pct, true),
    ended: () => {
      if (done) {
        return false;
      }
      done = true;
      write(100, true);
      return true;
    },
  };
}
