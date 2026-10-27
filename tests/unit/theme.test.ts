import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getThemeInitScript,
  isAppTheme,
  isLibraryThemePath,
  resolveTheme,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isAppTheme", () => {
  it("accepts light, dark and system", () => {
    expect(THEME_PREFERENCES).toEqual(["light", "dark", "system"]);
    for (const theme of THEME_PREFERENCES) {
      expect(isAppTheme(theme)).toBe(true);
    }
  });

  it("rejects garbage", () => {
    expect(isAppTheme("Dark")).toBe(false);
    expect(isAppTheme("auto")).toBe(false);
    expect(isAppTheme("")).toBe(false);
    expect(isAppTheme(null)).toBe(false);
    expect(isAppTheme(1)).toBe(false);
  });
});

describe("resolveTheme", () => {
  it("passes light and dark through", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("resolves system to light when there is no window", () => {
    expect(typeof window).toBe("undefined");
    expect(resolveTheme("system")).toBe("light");
  });

  it("resolves system to light when the window cannot match media", () => {
    vi.stubGlobal("window", {});
    expect(resolveTheme("system")).toBe("light");
  });

  it("resolves system through the device's colour-scheme preference", () => {
    const matchMedia = vi.fn((query: string) => ({ matches: query === "(prefers-color-scheme: dark)" }));
    vi.stubGlobal("window", { matchMedia });
    expect(resolveTheme("system")).toBe("dark");
    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");

    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    expect(resolveTheme("system")).toBe("light");
  });
});

describe("isLibraryThemePath", () => {
  it("covers the library, the panel, the academy and the admin, with their children", () => {
    for (const path of ["/biblioteca", "/painel", "/academia", "/admin", "/academia/login", "/admin/alunos/1"]) {
      expect(isLibraryThemePath(path)).toBe(true);
    }
  });

  it("leaves the public site and look-alike prefixes alone", () => {
    for (const path of ["/", "/sobre", "/academiax", "/administracao", "/api/academia/me"]) {
      expect(isLibraryThemePath(path)).toBe(false);
    }
  });
});

describe("getThemeInitScript", () => {
  // Runs the inline script against fake browser globals and reports whether
  // the <html> element ended up with the "dark" class.
  function runScript(input: { pathname: string; stored: string | null; prefersDark?: boolean }) {
    const classes = new Set<string>();
    const run = new Function("location", "localStorage", "document", "window", getThemeInitScript());
    run(
      { pathname: input.pathname },
      { getItem: (key: string) => (key === THEME_STORAGE_KEY ? input.stored : null) },
      {
        documentElement: {
          classList: { add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name) },
        },
      },
      { matchMedia: () => ({ matches: Boolean(input.prefersDark) }) },
    );
    return classes.has("dark");
  }

  it("names the academy and the admin among the allowed paths", () => {
    const script = getThemeInitScript();
    expect(script).toContain("/academia");
    expect(script).toContain("/admin");
    expect(script).toContain(THEME_STORAGE_KEY);
    expect(script).toContain('"system"');
  });

  it("applies a stored dark theme only on allowed paths", () => {
    expect(runScript({ pathname: "/academia", stored: "dark" })).toBe(true);
    expect(runScript({ pathname: "/admin/alunos", stored: "dark" })).toBe(true);
    expect(runScript({ pathname: "/biblioteca/x", stored: "dark" })).toBe(true);
    expect(runScript({ pathname: "/", stored: "dark" })).toBe(false);
    expect(runScript({ pathname: "/academiax", stored: "dark" })).toBe(false);
  });

  it("keeps light when the stored theme is light or missing", () => {
    expect(runScript({ pathname: "/academia", stored: "light", prefersDark: true })).toBe(false);
    expect(runScript({ pathname: "/academia", stored: null, prefersDark: true })).toBe(false);
  });

  it("follows the device for system, still only on allowed paths", () => {
    expect(runScript({ pathname: "/academia", stored: "system", prefersDark: true })).toBe(true);
    expect(runScript({ pathname: "/academia", stored: "system", prefersDark: false })).toBe(false);
    expect(runScript({ pathname: "/", stored: "system", prefersDark: true })).toBe(false);
  });

  it("removes a dark class that is already there when the page is not allowed", () => {
    const classes = new Set(["dark"]);
    const run = new Function("location", "localStorage", "document", "window", getThemeInitScript());
    run(
      { pathname: "/" },
      { getItem: () => "dark" },
      { documentElement: { classList: { add: (n: string) => classes.add(n), remove: (n: string) => classes.delete(n) } } },
      { matchMedia: () => ({ matches: true }) },
    );
    expect(classes.has("dark")).toBe(false);
  });

  it("never throws when storage is unavailable", () => {
    const run = new Function("location", "localStorage", "document", "window", getThemeInitScript());
    expect(() =>
      run(
        { pathname: "/academia" },
        {
          getItem: () => {
            throw new Error("blocked");
          },
        },
        { documentElement: { classList: { add() {}, remove() {} } } },
        {},
      ),
    ).not.toThrow();
  });
});
