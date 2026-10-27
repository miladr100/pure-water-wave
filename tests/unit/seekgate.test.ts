import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canSeekForward,
  createProgressSaver,
  resolveSeek,
  SEEK_TOLERANCE_SEC,
  watchedCeiling,
} from "@/lib/academy/seekgate";

describe("watchedCeiling", () => {
  it("is 0 without a known duration", () => {
    expect(watchedCeiling({ seedPercent: 50, sessionMax: 30 })).toBe(0);
    expect(watchedCeiling({ seedPercent: 50, sessionMax: 30, duration: 0 })).toBe(0);
    expect(watchedCeiling({ seedPercent: 50, sessionMax: 30, duration: -5 })).toBe(0);
  });

  it("takes the larger of the saved percentage and the session's own maximum", () => {
    expect(watchedCeiling({ seedPercent: 50, sessionMax: 30, duration: 100 })).toBe(50);
    expect(watchedCeiling({ seedPercent: 20, sessionMax: 30, duration: 100 })).toBe(30);
  });

  it("clamps the seed to 0..100 percent and the result to the duration", () => {
    expect(watchedCeiling({ seedPercent: 150, duration: 100 })).toBe(100);
    expect(watchedCeiling({ seedPercent: -10, duration: 100 })).toBe(0);
    expect(watchedCeiling({ sessionMax: 500, duration: 100 })).toBe(100);
    expect(watchedCeiling({ sessionMax: -3, duration: 100 })).toBe(0);
  });

  it("treats NaN inputs as 0", () => {
    expect(watchedCeiling({ seedPercent: Number.NaN, sessionMax: Number.NaN, duration: 100 })).toBe(0);
  });
});

describe("resolveSeek", () => {
  it("passes a target at or within the tolerance past the ceiling", () => {
    expect(resolveSeek({ target: 40, ceiling: 50, duration: 100 })).toEqual({ time: 40, blocked: false });
    expect(resolveSeek({ target: 50 + SEEK_TOLERANCE_SEC, ceiling: 50, duration: 100 })).toEqual({
      time: 50 + SEEK_TOLERANCE_SEC,
      blocked: false,
    });
  });

  it("snaps a target beyond the tolerance back to the ceiling and reports it", () => {
    expect(resolveSeek({ target: 51, ceiling: 50, duration: 100 })).toEqual({ time: 50, blocked: true });
    expect(resolveSeek({ target: 60, ceiling: 50, duration: 100, tolerance: 5 })).toEqual({
      time: 50,
      blocked: true,
    });
    expect(resolveSeek({ target: 55, ceiling: 50, duration: 100, tolerance: 5 })).toEqual({
      time: 55,
      blocked: false,
    });
  });

  it("clamps a negative target to 0 and one past the end to the duration", () => {
    expect(resolveSeek({ target: -5, ceiling: 50, duration: 100 })).toEqual({ time: 0, blocked: false });
    expect(resolveSeek({ target: 500, ceiling: 100, duration: 100 })).toEqual({ time: 100, blocked: false });
    // A ceiling past the end is clamped too, so a 500 s target blocks at 100.
    expect(resolveSeek({ target: 500, ceiling: 50, duration: 100 })).toEqual({ time: 50, blocked: true });
  });

  it("treats NaN as 0", () => {
    expect(resolveSeek({ target: Number.NaN, ceiling: 50, duration: 100 })).toEqual({ time: 0, blocked: false });
    expect(resolveSeek({ target: 10, ceiling: Number.NaN, duration: 100 })).toEqual({ time: 0, blocked: true });
  });
});

describe("canSeekForward", () => {
  it("allows a forward skip only while more than the tolerance was already watched", () => {
    expect(canSeekForward({ current: 10, ceiling: 20 })).toBe(true);
    expect(canSeekForward({ current: 19.5, ceiling: 20 })).toBe(false);
    expect(canSeekForward({ current: 20, ceiling: 20 })).toBe(false);
    expect(canSeekForward({ current: 10, ceiling: 20, tolerance: 15 })).toBe(false);
  });

  it("treats NaN as 0", () => {
    expect(canSeekForward({ current: Number.NaN, ceiling: 5 })).toBe(true);
    expect(canSeekForward({ current: 5, ceiling: Number.NaN })).toBe(false);
  });
});

describe("createProgressSaver", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes the first tick and then waits out the interval", () => {
    const save = vi.fn();
    const saver = createProgressSaver({ save, intervalSec: 12 });

    expect(saver.tick(10)).toBe(true);
    expect(save).toHaveBeenLastCalledWith(10, false);

    vi.advanceTimersByTime(11_999);
    expect(saver.tick(50)).toBe(false);

    vi.advanceTimersByTime(1);
    expect(saver.tick(50)).toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(50, false);
  });

  it("skips a tick that moved less than the minimum delta", () => {
    const save = vi.fn();
    const saver = createProgressSaver({ save, intervalSec: 1, minDeltaPct: 5 });

    saver.tick(10);
    vi.advanceTimersByTime(5_000);
    expect(saver.tick(14)).toBe(false);
    expect(saver.tick(15)).toBe(true);
    expect(save).toHaveBeenLastCalledWith(15, false);
  });

  it("rounds and clamps the percentage before saving", () => {
    const save = vi.fn();
    const saver = createProgressSaver({ save, intervalSec: 0 });

    saver.tick(10.4);
    expect(save).toHaveBeenLastCalledWith(10, false);
    saver.tick(150);
    expect(save).toHaveBeenLastCalledWith(100, false);
    saver.tick(-20);
    expect(save).toHaveBeenLastCalledWith(0, false);
  });

  it("flushes regardless of the interval but still respects the minimum delta", () => {
    const save = vi.fn();
    const saver = createProgressSaver({ save, intervalSec: 60, minDeltaPct: 2 });

    saver.tick(10);
    expect(saver.flush(30)).toBe(true);
    expect(save).toHaveBeenLastCalledWith(30, false);
    expect(saver.flush(31)).toBe(false);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("writes 100 and ended once, then refuses every later write", () => {
    const save = vi.fn();
    const saver = createProgressSaver({ save, intervalSec: 0 });

    expect(saver.ended()).toBe(true);
    expect(save).toHaveBeenCalledWith(100, true);
    expect(saver.ended()).toBe(false);
    expect(saver.tick(50)).toBe(false);
    expect(saver.flush(50)).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("swallows a rejected or throwing save and keeps going", async () => {
    const rejecting = vi.fn(() => Promise.reject(new Error("offline")));
    const saver = createProgressSaver({ save: rejecting, intervalSec: 0 });
    expect(saver.tick(10)).toBe(true);
    expect(saver.ended()).toBe(true);
    await vi.runAllTimersAsync();
    expect(rejecting).toHaveBeenCalledTimes(2);

    const throwing = vi.fn(() => {
      throw new Error("boom");
    });
    const other = createProgressSaver({ save: throwing, intervalSec: 0 });
    expect(() => other.tick(10)).not.toThrow();
    expect(() => other.ended()).not.toThrow();
  });
});
