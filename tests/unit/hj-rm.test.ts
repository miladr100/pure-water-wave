import { describe, expect, it } from "vitest";

import { fmtReais, liquido, media, novaMeta, parseReais, pct, recorde } from "@/lib/hj/rm";

// The spreadsheet's arithmetic (docs/painel/02-como-funciona-hoje.md and
// P3): líquido, média, recorde and the "nova meta".
const regra = { fator: 1.3, arredondarCents: 5000, minimoCents: 30000 };

describe("liquido", () => {
  it("is dinheiro + pix − despesas, in cents", () => {
    expect(liquido(35000, 12000, 2000)).toBe(45000);
  });

  it("can go negative when expenses exceed the day (the screen flags it)", () => {
    expect(liquido(1000, 0, 5000)).toBe(-4000);
  });

  it("rounds stray fractions of a cent", () => {
    expect(liquido(100.4, 0.6, 0)).toBe(101);
  });
});

describe("media and recorde", () => {
  it("average the days that count, rounded to the cent", () => {
    expect(media([30000, 45000, 60001])).toBe(45000);
    expect(media([])).toBe(0);
  });

  it("record is the best day, 0 without days", () => {
    expect(recorde([30000, 71600, 45000])).toBe(71600);
    expect(recorde([])).toBe(0);
  });
});

describe("novaMeta", () => {
  it("is média × fator rounded up to the next R$ 50", () => {
    // 410 × 1.3 = 533 → 550
    expect(novaMeta(41000, regra, 30000, 12)).toBe(55000);
  });

  it("keeps an exact multiple as is", () => {
    // 500 × 1.3 = 650
    expect(novaMeta(50000, regra, 30000, 5)).toBe(65000);
  });

  it("never drops below the minimum", () => {
    // 100 × 1.3 = 130 → 150, but the floor is 300
    expect(novaMeta(10000, regra, 30000, 3)).toBe(30000);
  });

  it("is the project's default before the first report", () => {
    expect(novaMeta(0, regra, 35000, 0)).toBe(35000);
    expect(novaMeta(0, regra, 20000, 0)).toBe(30000);
  });

  it("survives a zero rounding step", () => {
    expect(novaMeta(41000, { ...regra, arredondarCents: 0 }, 30000, 1)).toBe(53300);
  });
});

describe("parseReais", () => {
  it("reads what Brazilians type", () => {
    expect(parseReais("350")).toBe(35000);
    expect(parseReais("1.250")).toBe(125000);
    expect(parseReais("35,50")).toBe(3550);
    expect(parseReais("R$ 1.250,75")).toBe(125075);
    expect(parseReais(" 0 ")).toBe(0);
  });

  it("refuses garbage and negatives", () => {
    expect(parseReais("")).toBeNull();
    expect(parseReais("-")).toBeNull();
    expect(parseReais("abc")).toBeNull();
    expect(parseReais("-50")).toBeNull();
  });
});

describe("fmtReais and pct", () => {
  it("formats whole reais by default and cents on request", () => {
    expect(fmtReais(125000).replace(/\s/g, " ")).toBe("R$ 1.250");
    expect(fmtReais(125075, { centavos: true }).replace(/\s/g, " ")).toBe("R$ 1.250,75");
    expect(fmtReais(Number.NaN).replace(/\s/g, " ")).toBe("R$ 0");
  });

  it("percentage with one decimal, 0 for an empty goal", () => {
    expect(pct(68142481, 120000000)).toBe(56.8);
    expect(pct(10, 0)).toBe(0);
  });
});
