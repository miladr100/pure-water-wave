"use client";

import { useCallback, useEffect, useState } from "react";

import type { AppMessages } from "@/lib/i18n/academy-messages";
import { api, ApiError } from "@/lib/academy/api-client";
import type { MeResponse } from "@/lib/academy/types";

type Result<T> = { key: string; data: T | null; error: ApiError | null };

// One GET per screen, re-run with `reload()`. The result is tagged with the
// request it answers so a stale answer never renders for a newer path.
export function useApi<T>(path: string) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const key = `${path}#${version}`;

  useEffect(() => {
    let cancelled = false;

    api<T>(path)
      .then((data) => {
        if (!cancelled) {
          setResult({ key, data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult({ key, data: null, error: toApiError(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const current = result && result.key === key ? result : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    reload,
  };
}

export function toApiError(error: unknown) {
  return error instanceof ApiError ? error : new ApiError(0, { error: "" });
}

// API error text is human Portuguese; a transport failure has none, so the
// generic message takes over.
export function describeError(error: unknown, t: AppMessages) {
  const apiError = toApiError(error);
  const text = typeof apiError.data.error === "string" ? apiError.data.error.trim() : "";
  return apiError.status > 0 && text ? text : t.common.error;
}

// `/me` is wanted by the header (photo), the bell (notifications) and the
// dashboard at the same time. Mounts that overlap share one request; a later
// mount, or `refreshMe()` after the profile changes, fetches again and every
// subscriber receives the new answer.
type MeListener = (me: MeResponse) => void;
const meListeners = new Set<MeListener>();
let meInFlight: Promise<MeResponse> | null = null;
let meLast: MeResponse | null = null;

export function refreshMe() {
  if (!meInFlight) {
    meInFlight = api<MeResponse>("/api/academia/me")
      .then((me) => {
        meLast = me;
        meListeners.forEach((listener) => listener(me));
        return me;
      })
      .finally(() => {
        meInFlight = null;
      });
  }

  return meInFlight;
}

export function useMe() {
  const [me, setMe] = useState<MeResponse | null>(meLast);

  useEffect(() => {
    meListeners.add(setMe);
    refreshMe().catch(() => {
      // A convenience for the header and the bell; the screen reports failures.
    });

    return () => {
      meListeners.delete(setMe);
    };
  }, []);

  return me;
}
