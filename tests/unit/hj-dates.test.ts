import { describe, expect, it } from "vitest";

import { addDays, daysApart, daysBetween, emAndamento, fmtDia, fmtDiaNumero, isIsoDay, projetoDoInicio, todayInBrazil } from "@/lib/hj/dates";

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

describe("projetoDoInicio", () => {
  const projeto = (inicio: string, fim: string, ativo = true) => ({ ativo, inicio, fim, hoje: "2026-11-15" });

  it("a project runs inside its dates while switched on", () => {
    expect(emAndamento(projeto("2026-11-01", "2026-11-30"))).toBe(true);
    expect(emAndamento(projeto("2026-11-15", "2026-11-15"))).toBe(true);
    expect(emAndamento(projeto("2026-11-16", "2026-12-15"))).toBe(false);
    expect(emAndamento(projeto("2026-10-01", "2026-11-14"))).toBe(false);
    expect(emAndamento(projeto("2026-11-01", "2026-11-30", false))).toBe(false);
    expect(emAndamento(null)).toBe(false);
  });

  it("the home shows the one project being done today", () => {
    const corre = projeto("2026-11-01", "2026-11-30");
    const acabou = projeto("2026-09-01", "2026-09-30");
    expect(projetoDoInicio(corre, acabou)).toBe("rm");
    expect(projetoDoInicio(acabou, corre)).toBe("testemunho");
    expect(projetoDoInicio(corre, null)).toBe("rm");
    expect(projetoDoInicio(null, corre)).toBe("testemunho");
  });

  it("the active project wins, whatever the dates of the other", () => {
    const anoTodo = projeto("2026-01-01", "2026-12-31", false);
    const novembro = projeto("2026-11-01", "2026-11-30");
    expect(projetoDoInicio(novembro, anoTodo)).toBe("rm");
    expect(projetoDoInicio(projeto("2026-11-01", "2026-11-30", false), projeto("2026-01-01", "2026-12-31"))).toBe("testemunho");
    // active but already over: still the one the course is on
    const setembro = projeto("2026-09-01", "2026-09-30");
    expect(projetoDoInicio(projeto("2026-11-01", "2026-11-30", false), setembro)).toBe("testemunho");
  });

  it("with none active, the most recent one stays", () => {
    const setembro = projeto("2026-09-01", "2026-09-30", false);
    const outubro = projeto("2026-10-01", "2026-10-31", false);
    expect(projetoDoInicio(setembro, null)).toBe("rm");
    expect(projetoDoInicio(setembro, outubro)).toBe("testemunho");
    expect(projetoDoInicio(outubro, setembro)).toBe("rm");
    expect(projetoDoInicio(null, null)).toBe(null);
  });

  it("data from before the rule, with both on: the one running today, then the one that started last", () => {
    const anoTodo = projeto("2026-01-01", "2026-12-31");
    const novembro = projeto("2026-11-01", "2026-11-30");
    expect(projetoDoInicio(novembro, anoTodo)).toBe("rm");
    expect(projetoDoInicio(anoTodo, novembro)).toBe("testemunho");
    expect(projetoDoInicio(novembro, novembro)).toBe("rm");
    expect(projetoDoInicio(projeto("2026-09-01", "2026-09-30"), anoTodo)).toBe("testemunho");
  });
});
