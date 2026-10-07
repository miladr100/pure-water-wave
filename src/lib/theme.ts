export const THEME_STORAGE_KEY = "agua-pura-theme";

export type AppTheme = "light" | "dark";

const LIBRARY_THEME_PATHS = ["/biblioteca", "/painel"] as const;

export function isAppTheme(value: unknown): value is AppTheme {
  return value === "light" || value === "dark";
}

/** Dark theme from settings applies only to the logged-in library area. */
export function isLibraryThemePath(pathname: string) {
  return LIBRARY_THEME_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function getThemeInitScript() {
  return `(function(){try{var path=location.pathname;var prefixes=${JSON.stringify(LIBRARY_THEME_PATHS)};var allowed=prefixes.some(function(p){return path===p||path.indexOf(p+"/")===0});if(allowed&&localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`;
}
