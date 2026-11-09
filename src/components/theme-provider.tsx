"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  THEME_STORAGE_KEY,
  isAppTheme,
  isLibraryThemePath,
  resolveTheme,
  type AppTheme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The stored theme is an external store: localStorage plus a local event so
// that setTheme() re-renders every subscriber in this tab.
const listeners = new Set<() => void>();

function subscribeTheme(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStoredTheme(): AppTheme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(stored) ? stored : "light";
}

const serverTheme = (): AppTheme => "light";

function applyTheme(theme: AppTheme, pathname: string) {
  const enableDark = resolveTheme(theme) === "dark" && isLibraryThemePath(pathname);
  document.documentElement.classList.toggle("dark", enableDark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const theme = useSyncExternalStore(subscribeTheme, readStoredTheme, serverTheme);

  useEffect(() => {
    applyTheme(theme, pathname);
  }, [pathname, theme]);

  function setTheme(next: AppTheme) {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next, pathname);
    for (const listener of listeners) {
      listener();
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }

  return context;
}
