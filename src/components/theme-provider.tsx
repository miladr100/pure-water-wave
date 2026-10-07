"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  THEME_STORAGE_KEY,
  isAppTheme,
  isLibraryThemePath,
  type AppTheme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: AppTheme, pathname: string) {
  const enableDark = theme === "dark" && isLibraryThemePath(pathname);
  document.documentElement.classList.toggle("dark", enableDark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initial = isAppTheme(stored) ? stored : "light";
    setThemeState(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    applyTheme(theme, pathname);
  }, [pathname, ready, theme]);

  function setTheme(next: AppTheme) {
    setThemeState(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next, pathname);
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
