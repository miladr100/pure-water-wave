export const THEME_STORAGE_KEY = "agua-pura-theme";

export type AppTheme = "light" | "dark";

export function isAppTheme(value: unknown): value is AppTheme {
  return value === "light" || value === "dark";
}
