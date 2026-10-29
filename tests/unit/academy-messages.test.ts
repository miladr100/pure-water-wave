import { describe, expect, it } from "vitest";

import { APP_MESSAGES, getAppMessages } from "@/lib/i18n/academy-messages";
import { USER_LANGUAGES } from "@/lib/user-languages";

type Leaf = { path: string; kind: "string" | "function"; value: unknown };

// Flattens a messages object into "a.b.c" leaves with the type of each.
function leavesOf(value: unknown, path = ""): Leaf[] {
  if (typeof value === "string" || typeof value === "function") {
    return [{ path, kind: typeof value as Leaf["kind"], value }];
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      leavesOf(child, path ? `${path}.${key}` : key),
    );
  }

  throw new Error(`unexpected leaf at ${path}: ${String(value)}`);
}

const SAMPLE_ARGS = ["x", 1, 2, 3, 4];

const ptShape = leavesOf(APP_MESSAGES.pt)
  .map((leaf) => `${leaf.path}:${leaf.kind}`)
  .sort();

describe("academy messages", () => {
  it("covers the three user languages", () => {
    expect(Object.keys(APP_MESSAGES).sort()).toEqual([...USER_LANGUAGES].sort());
  });

  it("falls back to Portuguese for an unknown language", () => {
    expect(getAppMessages("en")).toBe(APP_MESSAGES.en);
    expect(getAppMessages("xx" as "pt")).toBe(APP_MESSAGES.pt);
  });

  for (const language of USER_LANGUAGES) {
    describe(language, () => {
      const leaves = leavesOf(APP_MESSAGES[language]);

      it("has exactly the Portuguese keys, each with the same kind", () => {
        expect(leaves.map((leaf) => `${leaf.path}:${leaf.kind}`).sort()).toEqual(ptShape);
      });

      it("has no empty string", () => {
        const empty = leaves.filter((leaf) => leaf.kind === "string" && !(leaf.value as string).trim());
        expect(empty.map((leaf) => leaf.path)).toEqual([]);
      });

      it("builds a non-empty string from every function", () => {
        const broken = leaves
          .filter((leaf) => leaf.kind === "function")
          .filter((leaf) => {
            const fn = leaf.value as (...args: unknown[]) => unknown;
            const result = fn(...SAMPLE_ARGS.slice(0, Math.max(1, fn.length)));
            return typeof result !== "string" || !result.trim();
          });
        expect(broken.map((leaf) => leaf.path)).toEqual([]);
      });

      it("pluralises the counters for one and many", () => {
        const { common } = APP_MESSAGES[language];
        expect(common.lessons(1)).not.toBe(common.lessons(2));
        expect(common.questions(1)).not.toBe(common.questions(2));
        expect(common.activities(1)).not.toBe(common.activities(2));
        expect(common.minutes(5)).toContain("5");
      });
    });
  }
});
