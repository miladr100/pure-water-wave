"use client";

import { GraduationCap, HandCoins, Heart, LayoutDashboard, Library } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { moduloOf, type Modulo } from "@/components/painel/nav";
import { usePainelEu, usePainelMessages } from "@/components/painel/use-painel";
import type { SessionPayload } from "@/lib/academy/auth";
import { cn } from "@/lib/utils";

export const AREA_STORAGE_KEY = "pww_area";

export type Area = Modulo;

export const areaOf = moduloOf;

export function rememberArea(area: Area) {
  try {
    window.localStorage.setItem(AREA_STORAGE_KEY, area);
  } catch {
    // Private windows and blocked storage: the switch still works.
  }
}

// The segmented control between the five modules: Painel, Restauração
// Material, Testemunho, Academia, Biblioteca (Milad, 13/11/2026). The
// testimony segment appears to members only while the administrator
// shows it (a drive is running, or forced on); educators always see it.
export function AreaSwitch({
  session,
  className,
  full = false,
  compact = false,
}: {
  session: SessionPayload;
  className?: string;
  full?: boolean;
  // icons only until the header has room for the words (the academy's
  // header also carries its own nav buttons)
  compact?: boolean;
}) {
  const t = usePainelMessages();
  const eu = usePainelEu();
  const pathname = usePathname() ?? "";
  const current = areaOf(pathname);
  const tutor = session.role === "tutor";
  const showTestemunho = tutor || eu === null || eu.modulos.testemunho;
  const items: { area: Area; href: string; label: string; short: string; icon: typeof LayoutDashboard }[] = [
    { area: "painel", href: tutor ? "/admin" : "/painel", label: t.areas.painel, short: t.areas.painel, icon: LayoutDashboard },
    { area: "rm", href: tutor ? "/admin/arrecadacao" : "/painel/arrecadacao", label: t.areas.rm, short: t.areas.rmShort, icon: HandCoins },
    ...(showTestemunho
      ? [{ area: "testemunho" as const, href: tutor ? "/admin/testemunho" : "/painel/testemunho", label: t.areas.testemunho, short: t.areas.testemunho, icon: Heart }]
      : []),
    { area: "academia", href: tutor ? "/admin/academia" : "/academia", label: t.areas.academia, short: t.areas.academia, icon: GraduationCap },
    { area: "biblioteca", href: "/biblioteca", label: t.areas.biblioteca, short: t.areas.biblioteca, icon: Library },
  ];

  return (
    <nav
      aria-label={t.areas.switchLabel}
      className={cn("inline-flex rounded-full bg-muted p-0.5", full && "flex w-full", className)}
    >
      {items.map((item) => {
        const active = item.area === current;
        return (
          <Link
            key={item.area}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            onClick={() => rememberArea(item.area)}
            className={cn(
              "inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-muted-foreground transition",
              // five modules on a phone: icon over a tiny label
              full && "h-11 flex-1 flex-col gap-0.5 px-1 text-[10px] leading-none",
              compact && "px-2.5 xl:px-3",
              active ? "bg-card text-primary-deep shadow-sm" : "hover:text-primary-deep",
            )}
          >
            <item.icon className={cn("h-3.5 w-3.5 shrink-0", full && "h-4 w-4")} aria-hidden />
            <span className={cn("max-w-full truncate", compact && "hidden xl:inline")}>{full ? item.short : item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
