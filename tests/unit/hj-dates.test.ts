import { describe, expect, it } from "vitest";

import { addDays, daysApart, daysBetween, fmtDia, fmtDiaNumero, isIsoDay, todayInBrazil } from "@/lib/hj/dates";

describe("isIsoDay", () => {
  it("accepts real calendar days only", () => {
    expect(isIsoDay("2026-11-06")).toBe(true);
    expect(isIsoDay("2026-02-29")).toBe(false);
    expect(isIsoDay("2024-02-29")).toBe(true);
    expect(isIsoDay("2026-13-01")).toBe(false);
    expect(isIsoDay("06/11/2026")).toBe(false);
    expect(isIsoDay(null)).toBe(false);
  });
});

describe("todayInBrazil", () => {
  it("follows São Paulo's calendar, not UTC", () => {
    // 01:30 UTC on the 7th is still the 6th in São Paulo (UTC−3).
    expect(todayInBrazil(new Date("2026-11-07T01:30:00Z"))).toBe("2026-11-06");
    expect(todayInBrazil(new Date("2026-11-07T03:30:00Z"))).toBe("2026-11-07");
  });
});

describe("addDays, daysBetween, daysApart", () => {
  it("cross month and year ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("list every day of a period, both ends included", () => {
    expect(daysBetween("2026-11-28", "2026-12-02")).toEqual([
      "2026-11-28",
      "2026-11-29",
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
    ]);
    expect(daysBetween("2026-11-02", "2026-11-01")).toEqual([]);
  });

  it("count the days between two dates", () => {
    expect(daysApart("2026-10-29", "2026-11-06")).toBe(8);
    expect(daysApart("2026-11-06", "2026-11-06")).toBe(0);
  });
});

describe("fmtDia", () => {
  it("formats in Portuguese without shifting the day", () => {
    expect(fmtDia("2026-11-06")).toMatch(/sex\.?,? 6 de nov/);
    expect(fmtDia("2026-11-06", "longo")).toMatch(/sexta-feira, 6 de novembro/);
    expect(fmtDiaNumero("2026-11-06")).toBe("06/11");
  });
});
