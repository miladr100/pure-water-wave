"use client";

import type { ReactNode } from "react";

import { api, ApiError } from "@/lib/academy/api-client";
import type { MeProfile, ProfilePatchBody } from "@/lib/academy/types";

// One card per section of the profile screen, in the logged-in area's shape.
export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
      <h2 className="font-display text-xl font-semibold text-primary-deep">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function patchProfile(body: ProfilePatchBody) {
  return api<{ profile: MeProfile }>("/api/academia/me", { method: "PATCH", body });
}

// A 400 from PATCH /me names the fields it refused:
// `{ error: "validation", fields: { <name>: <code> } }`.
export function fieldErrorsOf(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.status !== 400) {
    return {};
  }
  const fields = error.data.fields;
  if (!fields || typeof fields !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(fields as Record<string, unknown>).map(([name, code]) => [
      name,
      typeof code === "string" ? code : "invalid",
    ]),
  );
}

export function FieldError({ message }: { message: string | undefined }) {
  return message ? (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}
