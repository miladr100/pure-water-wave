"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "biblioteca-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
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

export function PwaInstallPrompt() {
  const { t } = useLocale();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) {
      return;
    }

    if (localStorage.getItem(DISMISS_KEY)) {
      return;
    }

    const ios = isIosDevice();
    setIsIos(ios);

    if (ios) {
      setIsVisible(true);
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  const iosParts = t.pwa.iosDescription.split(/\{share\}|\{addToHome\}/);

  return (
    <section className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-secondary/40 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            {isIos ? (
              <Smartphone className="h-5 w-5" aria-hidden />
            ) : (
              <Download className="h-5 w-5" aria-hidden />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-primary-deep">
              {t.pwa.title}
            </h2>
            {isIos ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {iosParts[0]}
                <strong>{t.pwa.share}</strong>
                {iosParts[1]}
                <strong>{t.pwa.addToHome}</strong>
                {iosParts[2]}
              </p>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t.pwa.androidDescription}
              </p>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={handleDismiss}
          aria-label={t.pwa.dismissAria}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!isIos ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={handleInstall}>
            {t.pwa.install}
          </Button>
          <Button type="button" variant="outline" onClick={handleDismiss}>
            {t.pwa.notNow}
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={handleDismiss}>
            {t.pwa.gotIt}
          </Button>
        </div>
      )}
    </section>
  );
}
