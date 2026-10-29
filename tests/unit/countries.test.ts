import { describe, expect, it } from "vitest";

import { COUNTRIES, normalizeCountry } from "@/lib/academy/countries";
import { validateAccountInput } from "@/lib/academy/accounts";

describe("normalizeCountry", () => {
  it("keeps every stored name as it is", () => {
    for (const country of COUNTRIES) {
      expect(normalizeCountry(country)).toBe(country);
    }
  });

  it("ignores case, accents and extra spaces", () => {
    expect(normalizeCountry("  brasil ")).toBe("Brasil");
    expect(normalizeCountry("COLOMBIA")).toBe("Colômbia");
    expect(normalizeCountry("sao  tome e principe")).toBe("São Tomé e Príncipe");
  });

  it("understands ISO codes and English or Spanish names", () => {
    expect(normalizeCountry("BR")).toBe("Brasil");
    expect(normalizeCountry("ar")).toBe("Argentina");
    expect(normalizeCountry("Brazil")).toBe("Brasil");
    expect(normalizeCountry("España")).toBe("Espanha");
    expect(normalizeCountry("USA")).toBe("Estados Unidos");
    expect(normalizeCountry("Mozambique")).toBe("Moçambique");
  });

  it("returns null for what it does not recognise", () => {
    expect(normalizeCountry("")).toBeNull();
    expect(normalizeCountry("Atlântida")).toBeNull();
  });
});

describe("validateAccountInput country", () => {
  const base = { kind: "hjteam" as const, fullName: "Ana", email: "ana@example.com" };

  it("stores the normalised name", () => {
    const result = validateAccountInput({ ...base, country: "BR" });
    expect(result.ok && result.value.country).toBe("Brasil");
  });

  it("rejects an unknown country", () => {
    const result = validateAccountInput({ ...base, country: "Atlântida" });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.fields.country).toBe("invalid");
  });

  it("leaves the country empty when none is given", () => {
    const result = validateAccountInput(base);
    expect(result.ok && result.value.country).toBe("");
  });
});
