export const THEME_STORAGE_KEY = "agua-pura-theme";

// "system" follows the device; the library offers light/dark only, the
// academy offers all three.
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type AppTheme = (typeof THEME_PREFERENCES)[number];

const LIBRARY_THEME_PATHS = ["/biblioteca", "/painel", "/academia", "/admin"] as const;

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === "string" && (THEME_PREFERENCES as readonly string[]).includes(value);
}

export function resolveTheme(theme: AppTheme): "light" | "dark" {
  if (theme !== "system") {
    return theme;
  }

  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Dark theme from settings applies only to the logged-in library area. */
export function isLibraryThemePath(pathname: string) {
  return LIBRARY_THEME_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function getThemeInitScript() {
  return `(function(){try{var path=location.pathname;var prefixes=${JSON.stringify(LIBRARY_THEME_PATHS)};var allowed=prefixes.some(function(p){return path===p||path.indexOf(p+"/")===0});var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var dark=t==="dark"||(t==="system"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(allowed&&dark){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`;
}
