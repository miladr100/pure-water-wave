"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

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
              Instalar no celular
            </h2>
            {isIos ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                No Safari, toque em <strong>Compartilhar</strong> e depois em{" "}
                <strong>Adicionar à Tela de Início</strong> para abrir a
                biblioteca como app.
              </p>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Instale a Biblioteca Água Pura no seu celular para acessar os
                livros com mais rapidez, como um aplicativo.
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
          aria-label="Fechar aviso de instalação"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!isIos ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={handleInstall}>
            Instalar biblioteca
          </Button>
          <Button type="button" variant="outline" onClick={handleDismiss}>
            Agora não
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={handleDismiss}>
            Entendi
          </Button>
        </div>
      )}
    </section>
  );
}
