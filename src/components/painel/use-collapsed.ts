"use client";

import { useCallback, useSyncExternalStore } from "react";

// Whether the sidebar is folded to icons, remembered in this browser. Read
// through an external store so the server renders it open and the browser
// adopts the saved state without a state update inside an effect.
const KEY = "pww_painel_nav_collapsed";
const listeners = new Set<() => void>();

function read() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(KEY, read() ? "0" : "1");
    } catch {
      // No storage: the sidebar stays as it is.
    }
    listeners.forEach((listener) => listener());
  }, []);
  return [collapsed, toggle] as const;
}
