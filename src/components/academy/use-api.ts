"use client";

import { useCallback, useEffect, useState } from "react";

import type { AppMessages } from "@/lib/i18n/academy-messages";
import { api, ApiError } from "@/lib/academy/api-client";

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
