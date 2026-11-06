"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/academy/locale-provider";
import type { PainelEu } from "@/app/api/painel/eu/route";
import { api } from "@/lib/academy/api-client";
import { getPainelMessages } from "@/lib/i18n/painel-messages";

export function usePainelMessages() {
  const { language } = useLocale();
  return getPainelMessages(language);
}

// `/api/painel/eu` is wanted by the header, the sidebar and the bottom
// tabs at once; mounts share one request, and `refreshEu()` after a change
// of team or role fetches again for every subscriber.
type Listener = (eu: PainelEu) => void;
const listeners = new Set<Listener>();
let inFlight: Promise<PainelEu> | null = null;
let last: PainelEu | null = null;

export function refreshEu() {
  if (!inFlight) {
    inFlight = api<PainelEu>("/api/painel/eu")
      .then((eu) => {
        last = eu;
        listeners.forEach((listener) => listener(eu));
        return eu;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

// `enabled: false` for a viewer with no academy account (a pastor in the
// library), who has nothing to ask the panel.
export function usePainelEu(enabled = true) {
  const [eu, setEu] = useState<PainelEu | null>(last);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    listeners.add(setEu);
    refreshEu().catch(() => {
      // The shell draws without it; the screens report failures.
    });
    return () => {
      listeners.delete(setEu);
    };
  }, [enabled]);

  return enabled ? eu : null;
}
