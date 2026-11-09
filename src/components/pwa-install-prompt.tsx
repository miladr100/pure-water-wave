"use client";

import { useSyncExternalStore } from "react";
import { Check, Download, Smartphone } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

// "Instalar no celular", shown in every account's profile (the academy's
// profile dialog, the pastor's settings). It is a section, not a banner:
// nothing to dismiss, always there until the site is already running as
// an installed app.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chrome fires `beforeinstallprompt` once, soon after the page loads —
// usually before any profile dialog is open. It is caught here at module
// load and handed to whichever section mounts later.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    listeners.forEach((listener) => listener());
  });
}

function isIosDevice() {
  return typeof window !== "undefined" && /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

let accepted = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// The browser's answer as one string, so the section renders nothing on
// the server and adopts the device's state on the client without a state
// update inside an effect.
function snapshot() {
  return `${isIosDevice() ? 1 : 0}${isStandaloneMode() || accepted ? 1 : 0}${deferred !== null ? 1 : 0}`;
}

export function PwaInstallPrompt() {
  const { t } = useLocale();
  const snap = useSyncExternalStore(subscribe, snapshot, () => null);

  if (snap === null) {
    return null;
  }
  const state = { ios: snap[0] === "1", standalone: snap[1] === "1", canPrompt: snap[2] === "1" };

  async function handleInstall() {
    if (!deferred) {
      return;
    }
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      deferred = null;
      accepted = true;
      listeners.forEach((listener) => listener());
    }
  }

  const iosParts = t.pwa.iosDescription.split(/\{share\}|\{addToHome\}/);

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          {state.standalone ? (
            <Check className="h-5 w-5" aria-hidden />
          ) : state.ios ? (
            <Smartphone className="h-5 w-5" aria-hidden />
          ) : (
            <Download className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-primary-deep">{t.pwa.title}</h2>
          {state.standalone ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.pwa.installed}</p>
          ) : state.ios ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {iosParts[0]}
              <strong>{t.pwa.share}</strong>
              {iosParts[1]}
              <strong>{t.pwa.addToHome}</strong>
              {iosParts[2]}
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.pwa.androidDescription}</p>
              {state.canPrompt ? (
                <Button type="button" className="mt-3 rounded-full" onClick={() => void handleInstall()}>
                  <Download className="h-4 w-4" />
                  {t.pwa.install}
                </Button>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">{t.pwa.menuHint}</p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
