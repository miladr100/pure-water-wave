"use client";

import { GraduationCap, LayoutDashboard, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePainelMessages } from "@/components/painel/use-painel";
import type { SessionPayload } from "@/lib/academy/auth";
import { cn } from "@/lib/utils";

export const AREA_STORAGE_KEY = "pww_area";

export type Area = "painel" | "academia" | "admin";

export function areaOf(pathname: string): Area {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/academia")) return "academia";
  return "painel";
}

export function rememberArea(area: Area) {
  try {
    window.localStorage.setItem(AREA_STORAGE_KEY, area);
  } catch {
    // Private windows and blocked storage: the switch still works.
  }
}

// The segmented control that moves between the member's two areas (and
// the administration for educators). Beside the logo on every screen.
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
  const pathname = usePathname() ?? "";
  const current = areaOf(pathname);
  const items: { area: Area; href: string; label: string; icon: typeof LayoutDashboard }[] = [
    { area: "painel", href: "/painel", label: t.areas.painel, icon: LayoutDashboard },
    { area: "academia", href: "/academia", label: t.areas.academia, icon: GraduationCap },
    ...(session.role === "tutor" ? [{ area: "admin" as const, href: "/admin", label: t.areas.admin, icon: Shield }] : []),
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
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-muted-foreground transition",
              full && "flex-1",
              compact && "px-3 xl:px-3.5",
              active ? "bg-card text-primary-deep shadow-sm" : "hover:text-primary-deep",
            )}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className={cn(compact && "hidden xl:inline")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
