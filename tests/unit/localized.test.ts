import { describe, expect, it } from "vitest";

import { EMPTY_LOCALIZED, isTranslated, normalizeLocalized, pick } from "@/lib/academy/localized";

describe("pick", () => {
  it("returns the requested translation when it exists", () => {
    expect(pick({ pt: "Olá", en: "Hello", es: "Hola" }, "en")).toBe("Hello");
    expect(pick({ pt: "Olá", en: "Hello", es: "Hola" }, "es")).toBe("Hola");
    expect(pick({ pt: "Olá", en: "Hello", es: "Hola" }, "pt")).toBe("Olá");
  });

  it("falls back to Portuguese when the translation is missing", () => {
    expect(pick({ pt: "Olá" }, "en")).toBe("Olá");
  });

  it("falls back to Portuguese when the translation is empty or whitespace", () => {
    expect(pick({ pt: "Olá", en: "" }, "en")).toBe("Olá");
    expect(pick({ pt: "Olá", es: "   " }, "es")).toBe("Olá");
  });

  it("returns an empty string for a missing value or an empty Portuguese text", () => {
    expect(pick(null, "pt")).toBe("");
    expect(pick(undefined, "en")).toBe("");
    expect(pick({ pt: "" }, "en")).toBe("");
  });
});

describe("isTranslated", () => {
  it("is true only for a non-blank text in the requested language", () => {
    expect(isTranslated({ pt: "Olá", en: "Hello" }, "en")).toBe(true);
    expect(isTranslated({ pt: "Olá" }, "en")).toBe(false);
    expect(isTranslated({ pt: "Olá", en: "  " }, "en")).toBe(false);
    expect(isTranslated({ pt: "Olá" }, "pt")).toBe(true);
    expect(isTranslated({ pt: "" }, "pt")).toBe(false);
  });

  it("is false for a missing value", () => {
    expect(isTranslated(null, "pt")).toBe(false);
    expect(isTranslated(undefined, "es")).toBe(false);
  });
});

describe("normalizeLocalized", () => {
  it("reads a plain string as trimmed Portuguese with empty translations", () => {
    expect(normalizeLocalized("  Olá ")).toEqual({ pt: "Olá", en: "", es: "" });
  });

  it("trims each language of an object and drops the rest", () => {
    expect(normalizeLocalized({ pt: " a ", en: " b", es: "c ", fr: "d" })).toEqual({ pt: "a", en: "b", es: "c" });
  });

  it("ignores non-string fields inside an object", () => {
    expect(normalizeLocalized({ pt: 1, en: null, es: ["x"] })).toEqual({ pt: "", en: "", es: "" });
  });

  it("returns an empty value for garbage", () => {
    expect(normalizeLocalized(null)).toEqual(EMPTY_LOCALIZED);
    expect(normalizeLocalized(undefined)).toEqual(EMPTY_LOCALIZED);
    expect(normalizeLocalized(42)).toEqual(EMPTY_LOCALIZED);
    expect(normalizeLocalized(true)).toEqual(EMPTY_LOCALIZED);
  });

  it("never hands back the shared EMPTY_LOCALIZED object itself", () => {
    expect(normalizeLocalized(null)).not.toBe(EMPTY_LOCALIZED);
  });
});
