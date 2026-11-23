"use client";

import { Check, ChevronDown, GraduationCap, LayoutDashboard, Library, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { moduloOf, type Modulo } from "@/components/painel/nav";
import { usePainelEu, usePainelMessages } from "@/components/painel/use-painel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

// The switch between the modules: Painel, Contabilidade, Academia,
// Biblioteca — a list that opens on click (Victor, 14/11/2026).
// Restauração Material and Testemunho are items of the Painel's own menu,
// not modules (Victor, 15/11/2026). The accounting entry appears to
// educators, administrators and team captains.
export function AreaSwitch({
  session,
  className,
  full = false,
  compact = false,
}: {
  session: SessionPayload;
  className?: string;
  // as wide as its row (the phone's header)
  full?: boolean;
  // icon only until the header has room for the name (the academy's header
  // also carries its own nav buttons)
  compact?: boolean;
}) {
  const t = usePainelMessages();
  const eu = usePainelEu();
  const pathname = usePathname() ?? "";
  const current = areaOf(pathname);
  const tutor = session.role === "tutor";
  const showContabilidade = tutor || Boolean(eu?.papeis.capitao) || current === "contabilidade";
  const items: { area: Area; href: string; label: string; icon: typeof LayoutDashboard }[] = [
    { area: "painel", href: tutor ? "/admin" : "/painel", label: t.areas.painel, icon: LayoutDashboard },
    ...(showContabilidade
      ? [{ area: "contabilidade" as const, href: tutor ? "/admin/contabilidade" : "/painel/contabilidade", label: t.areas.contabilidade, icon: Wallet }]
      : []),
    { area: "academia", href: tutor ? "/admin/academia" : "/academia", label: t.areas.academia, icon: GraduationCap },
    { area: "biblioteca", href: "/biblioteca", label: t.areas.biblioteca, icon: Library },
  ];
  const atual = items.find((item) => item.area === current) ?? items[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t.areas.switchLabel}: ${atual.label}`}
          className={cn(
            "inline-flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-card py-1 pl-1.5 pr-3 text-sm font-semibold text-primary-deep transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            full && "flex h-11 w-full",
            className,
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-deep">
            <atual.icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className={cn("min-w-0 truncate", full && "flex-1 text-left", compact && "hidden xl:inline")}>{atual.label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn("rounded-2xl p-1.5", full ? "w-[var(--radix-dropdown-menu-trigger-width)]" : "w-64")}
      >
        {items.map((item) => {
          const active = item.area === atual.area;
          return (
            <DropdownMenuItem key={item.area} asChild className="cursor-pointer gap-3 rounded-xl px-2 py-2">
              <Link href={item.href} aria-current={active ? "page" : undefined} onClick={() => rememberArea(item.area)}>
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className={cn("min-w-0 flex-1 truncate text-sm", active ? "font-semibold text-primary-deep" : "font-medium text-foreground")}>
                  {item.label}
                </span>
                {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
