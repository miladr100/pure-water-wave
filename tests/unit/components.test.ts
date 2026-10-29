import { afterEach, describe, expect, it, vi } from "vitest";

import { firstNameOf, fmtBirthday, fmtClock, fmtDate, fmtDuration, initialsOf, todayIso } from "@/components/academy/format";
import { lockCopy } from "@/components/academy/lock-copy";
import { describeError, toApiError } from "@/components/academy/use-api";
import { ApiError } from "@/lib/academy/api-client";
import { APP_MESSAGES } from "@/lib/i18n/academy-messages";
import { USER_LANGUAGES } from "@/lib/user-languages";

afterEach(() => {
  vi.useRealTimers();
});

describe("fmtDuration", () => {
  it("shows minutes under an hour", () => {
    expect(fmtDuration(0)).toBe("0 min");
    expect(fmtDuration(45)).toBe("45 min");
    expect(fmtDuration(59.6)).toBe("1 h");
  });

  it("splits hours and minutes, dropping a zero remainder", () => {
    expect(fmtDuration(60)).toBe("1 h");
    expect(fmtDuration(90)).toBe("1 h 30 min");
    expect(fmtDuration(125)).toBe("2 h 5 min");
  });

  it("never goes negative and treats garbage as 0", () => {
    expect(fmtDuration(-10)).toBe("0 min");
    expect(fmtDuration(Number.NaN)).toBe("0 min");
  });
});

describe("fmtClock", () => {
  it("formats m:ss under an hour and h:mm:ss above", () => {
    expect(fmtClock(0)).toBe("0:00");
    expect(fmtClock(7)).toBe("0:07");
    expect(fmtClock(65)).toBe("1:05");
    expect(fmtClock(3599)).toBe("59:59");
    expect(fmtClock(3600)).toBe("1:00:00");
    expect(fmtClock(3725)).toBe("1:02:05");
  });

  it("floors fractions and clamps negatives and garbage to 0", () => {
    expect(fmtClock(65.9)).toBe("1:05");
    expect(fmtClock(-3)).toBe("0:00");
    expect(fmtClock(Number.NaN)).toBe("0:00");
  });
});

describe("names", () => {
  it("takes the first word as the first name", () => {
    expect(firstNameOf("  Ana Maria Souza ")).toBe("Ana");
    expect(firstNameOf("Ana")).toBe("Ana");
  });

  it("builds initials from the first and last words, upper-cased", () => {
    expect(initialsOf("ana maria souza")).toBe("AS");
    expect(initialsOf("  João   Silva ")).toBe("JS");
    expect(initialsOf("Ana")).toBe("A");
    expect(initialsOf("")).toBe("");
  });
});

describe("todayIso", () => {
  it("uses the browser's local calendar day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 23, 30));
    expect(todayIso()).toBe("2026-01-05");
    vi.setSystemTime(new Date(2026, 11, 31, 0, 10));
    expect(todayIso()).toBe("2026-12-31");
  });
});

describe("dates", () => {
  it("renders nothing for a missing or invalid value", () => {
    expect(fmtDate(null, "pt")).toBe("");
    expect(fmtDate(undefined, "en")).toBe("");
    expect(fmtDate("", "es")).toBe("");
    expect(fmtDate("not a date", "pt")).toBe("");
    expect(fmtBirthday(null, "pt")).toBe("");
    expect(fmtBirthday("", "pt")).toBe("");
  });

  it("formats a timestamp in the reader's regional format", () => {
    const value = "2026-03-15T12:00:00Z";
    expect(fmtDate(value, "pt")).toMatch(/15 de mar\.? de 2026/);
    expect(fmtDate(value, "en")).toMatch(/15 Mar 2026/);
    expect(fmtDate(value, "es")).toMatch(/15 mar 2026/);
  });

  // The regression this guards: parsing "2000-03-01" as UTC shows 29 Feb to
  // a reader in Brazil. The day printed must be the day written.
  it("shows the birthday's own day in every language", () => {
    for (const [iso, day, year] of [
      ["2000-03-01", "1", "2000"],
      ["1990-12-31", "31", "1990"],
      ["1985-01-01", "1", "1985"],
    ] as const) {
      for (const language of USER_LANGUAGES) {
        const numbers = fmtBirthday(iso, language).match(/\d+/g) ?? [];
        expect(numbers, `${iso} in ${language}`).toContain(day);
        expect(numbers, `${iso} in ${language}`).toContain(year);
      }
    }
  });
});

describe("lockCopy", () => {
  const t = APP_MESSAGES.pt;

  it("names the reason the student cannot proceed", () => {
    expect(lockCopy("not_enrolled", t)).toBe(t.course.lockedNotEnrolled);
    expect(lockCopy("module_locked", t)).toBe(t.course.lockedModule);
    expect(lockCopy("lessons_incomplete", t)).toBe(t.course.lockedLessons);
    expect(lockCopy("modules_incomplete", t)).toBe(t.course.lockedModules);
  });

  it("falls back to the generic lock text", () => {
    expect(lockCopy("module_missing", t)).toBe(t.course.locked);
    expect(lockCopy(null, t)).toBe(t.course.locked);
    expect(lockCopy(undefined, t)).toBe(t.course.locked);
  });

  it("reads from the messages it is given", () => {
    expect(lockCopy("module_locked", APP_MESSAGES.en)).toBe(APP_MESSAGES.en.course.lockedModule);
  });
});

describe("toApiError", () => {
  it("returns an ApiError untouched", () => {
    const error = new ApiError(404, { error: "Não encontrado", code: "missing" });
    expect(toApiError(error)).toBe(error);
  });

  it("wraps anything else as a status-0 error without text", () => {
    for (const thrown of [new Error("boom"), "boom", null, undefined, 42]) {
      const wrapped = toApiError(thrown);
      expect(wrapped).toBeInstanceOf(ApiError);
      expect(wrapped.status).toBe(0);
      expect(wrapped.data).toEqual({ error: "" });
    }
  });
});

describe("describeError", () => {
  const t = APP_MESSAGES.pt;

  it("uses the API's own text when the server answered", () => {
    expect(describeError(new ApiError(400, { error: " Senha incorreta " }), t)).toBe("Senha incorreta");
  });

  it("uses the generic message for a transport failure", () => {
    expect(describeError(new ApiError(0, { error: "Sem conexão" }), t)).toBe(t.common.error);
    expect(describeError(new TypeError("fetch failed"), t)).toBe(t.common.error);
    expect(describeError(undefined, t)).toBe(t.common.error);
  });

  it("uses the generic message when the server answered without text", () => {
    expect(describeError(new ApiError(500, {}), t)).toBe(t.common.error);
    expect(describeError(new ApiError(500, { error: "   " }), t)).toBe(t.common.error);
    expect(describeError(new ApiError(500, { error: 42 }), t)).toBe(t.common.error);
  });

  it("honours the language of the messages it is given", () => {
    expect(describeError(new ApiError(0, {}), APP_MESSAGES.es)).toBe(APP_MESSAGES.es.common.error);
  });
});
