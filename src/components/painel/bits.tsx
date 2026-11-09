"use client";

import type { ReactNode } from "react";

import { Chip } from "@/components/academy/chip";
import { ErrorState } from "@/components/academy/error-state";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtReais, parseReais } from "@/lib/hj/rm";
import type { ApiError } from "@/lib/academy/api-client";
import type { RelatorioEstado } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

// Small pieces every panel screen shares.

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6", className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground", className)}>{children}</p>
  );
}

export function EstadoChip({ estado }: { estado: RelatorioEstado }) {
  const t = usePainelMessages();
  const tone = estado === "validado" ? "mint" : estado === "devolvido" ? "coral" : "muted";
  return <Chip tone={tone}>{t.estados[estado]}</Chip>;
}

export function Reais({ cents, className, centavos }: { cents: number; className?: string; centavos?: boolean }) {
  return <span className={cn("tabular-nums", className)}>{fmtReais(cents, { centavos })}</span>;
}

// A money field that reads what Brazilians type ("350", "1.250", "35,50")
// and keeps the value as text until it is parsed on submit.
export function MoneyInput({
  id,
  value,
  onChange,
  invalid,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">R$</span>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        className={cn("h-11 rounded-xl pl-10 text-base tabular-nums", invalid && "border-destructive")}
        placeholder="0"
      />
    </div>
  );
}

export function centsOf(text: string) {
  return text.trim() === "" ? 0 : parseReais(text);
}

export function LoadingBlock() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-44 rounded-3xl" />
      </div>
    </div>
  );
}

export function Failed({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const t = usePainelMessages();
  const text = error.status > 0 && error.message ? error.message : t.common.error;
  return <ErrorState message={text} onRetry={onRetry} />;
}

export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card p-4", className)}>
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-1 font-display text-2xl font-semibold text-primary-deep tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-[#009dc9] to-[#0079b9]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function fmtRelativeDay(day: string | null, hoje: string) {
  if (!day) return "";
  const [y1, m1, d1] = day.split("-").map(Number);
  const [y2, m2, d2] = hoje.split("-").map(Number);
  const diff = Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  return `há ${diff} dias`;
}
