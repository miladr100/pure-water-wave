"use client";

import { ChevronsLeft, LogOut, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { AccountMenu } from "@/components/academy/account-menu";
import { NotificationsBell } from "@/components/academy/notifications-bell";
import { BrandLogo } from "@/components/brand-logo";
import { LibraryFeedbackButton } from "@/components/library-feedback-button";
import { LibrarySettingsMenu } from "@/components/library-settings-menu";
import { LogoutButton } from "@/components/logout-button";
import { AreaSwitch } from "@/components/painel/area-switch";
import { useLocale } from "@/components/academy/locale-provider";
import { isActive, navFor, subTabsFor, type ShellArea } from "@/components/painel/nav";
import { useCollapsed } from "@/components/painel/use-collapsed";
import { usePainelEu, usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SessionPayload } from "@/lib/academy/auth";
import { cn } from "@/lib/utils";

// Old links open the profile with `?perfil=1`; the shell sends them to the page.
const PROFILE_QUERY = "perfil";

// The logged-in frame of the HJ Team panel and its administration: the
// site's header with the area switch beside the logo, a sidebar on the
// computer (collapsible to icons), a bottom bar on the phone.
export function PainelShell({
  area,
  session,
  pastor,
  title,
  subtitle,
  banner,
  children,
}: {
  area: ShellArea;
  // The academy account behind the header's menus; absent for a pastor.
  session?: SessionPayload;
  // A pastor reads the library in the same frame, with the library's own
  // menus and no area switch: the library is all they have.
  pastor?: { fullName: string };
  title?: string;
  subtitle?: string;
  // Drawn between the header and the content (the educator's "viewing as
  // a student" line, for one).
  banner?: ReactNode;
  children: ReactNode;
}) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const eu = usePainelEu(!pastor);
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collapsed, toggleCollapsed] = useCollapsed();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // The profile is a page of its own in each area (the library sends the
  // person to their panel's). Old `?perfil=1` links land there too.
  const profileHref =
    area === "admin" || session?.role === "tutor" ? "/admin/perfil" : area === "academia" ? "/academia/perfil" : "/painel/perfil";
  const wantsProfile = searchParams.get(PROFILE_QUERY) === "1";
  useEffect(() => {
    if (wantsProfile && session) {
      router.replace(profileHref);
    }
  }, [wantsProfile, session, profileHref, router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/academia/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  const papeis = eu?.papeis ?? null;
  const items = navFor(area, papeis, t, ta);
  const subTabs = area === "admin" ? subTabsFor(pathname, papeis, t) : null;
  const primary = items.slice(0, 5);
  const overflow = items.slice(5);
  // "admin" is the educator's Painel: same area and title, more items.
  const areaLabel = area === "academia" ? t.areas.academia : area === "biblioteca" ? t.areas.biblioteca : t.areas.painel;
  const home = area === "admin" ? "/admin" : area === "academia" ? "/academia" : area === "biblioteca" ? "/biblioteca" : "/painel";

  const headerTitle =
    title ?? (area === "academia" ? ta.header.academyTitle : area === "biblioteca" ? t.shell.libraryTitle : t.shell.painelTitle);
  const headerSubtitle =
    subtitle ??
    (area === "academia" || area === "biblioteca"
      ? ""
      : area === "admin"
      ? [session?.fullName, papeis?.administrador ? "Administrador(a)" : "Educador(a)"].filter(Boolean).join(" · ")
      : eu?.equipe
        ? [eu.equipe.nome, eu.projeto ? `${eu.projeto.nome.split(" – ")[0]}, ${t.common.day(eu.projeto.diaAtual, eu.projeto.totalDias)}` : null]
            .filter(Boolean)
            .join(" · ")
        : eu?.projeto
          ? eu.projeto.nome
          : "");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-secondary/30 to-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          {pastor ? (
            <div className="flex min-w-0 items-center gap-3">
              <LibrarySettingsMenu fullName={pastor.fullName} logoClassName="h-10 w-10" />
              <Link href={home} className="min-w-0" aria-label={headerTitle}>
                <span className="block truncate font-display text-xl font-semibold text-primary-deep">{headerTitle}</span>
              </Link>
            </div>
          ) : (
            <Link href={home} className="flex min-w-0 items-center gap-3" aria-label={headerTitle}>
              <BrandLogo className="h-10 w-10 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate font-display text-xl font-semibold text-primary-deep">{headerTitle}</span>
                {headerSubtitle ? (
                  <span className="hidden truncate text-sm text-muted-foreground sm:block">{headerSubtitle}</span>
                ) : null}
              </span>
            </Link>
          )}
          {session ? <AreaSwitch session={session} className="ml-2 hidden sm:inline-flex" /> : null}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {session ? (
              <>
                <NotificationsBell />
                <AccountMenu area="painel" session={session} onOpenProfile={() => router.push(profileHref)} />
              </>
            ) : (
              <>
                <div className="hidden sm:block">
                  <LibraryFeedbackButton />
                </div>
                <LogoutButton />
              </>
            )}
          </div>
        </div>
        {session ? (
          <div className="px-4 pb-3 sm:hidden">
            <AreaSwitch session={session} full />
          </div>
        ) : null}
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "sticky top-[4.6rem] hidden h-[calc(100vh-4.6rem)] shrink-0 flex-col gap-1 border-r border-border/60 bg-card/70 p-3 transition-[width] duration-200 lg:flex",
            collapsed ? "w-[4.75rem]" : "w-60",
          )}
          data-collapsed={collapsed ? "true" : "false"}
        >
          <p className={cn("px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground", collapsed && "sr-only")}>
            {areaLabel}
          </p>
          <nav aria-label={areaLabel} className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-medium text-foreground transition hover:bg-secondary/60 hover:text-primary-deep",
                    active && "bg-secondary font-semibold text-primary-deep",
                    collapsed && "w-12 justify-center px-0",
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
                  <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t.shell.expand : t.shell.collapse}
            title={collapsed ? t.shell.expand : t.shell.collapse}
            className={cn(
              "mt-auto flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm text-muted-foreground transition hover:bg-secondary/60 hover:text-primary-deep",
              collapsed && "w-12 justify-center px-0",
            )}
          >
            <ChevronsLeft className={cn("h-[18px] w-[18px] transition-transform", collapsed && "rotate-180")} aria-hidden />
            <span className={cn(collapsed && "sr-only")}>{t.shell.collapse}</span>
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          {banner}
          {subTabs ? (
            <div className="border-b border-border/60 bg-card/60">
              <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label={areaLabel}>
                {subTabs.map((tab) => {
                  const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition",
                        active ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-primary-deep",
                      )}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}
          {/* The library's pages bring their own centred <main>; the shell only leaves room for the bottom bar. */}
          <main className={area === "biblioteca" ? "pb-24 lg:pb-0" : "mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-12"}>
            {children}
          </main>
        </div>
      </div>

      <nav
        aria-label={areaLabel}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border/60 bg-card/95 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur lg:hidden"
      >
        {primary.map((item) => {
          const active = isActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-medium leading-tight tracking-tight text-muted-foreground",
                active && "bg-secondary text-primary-deep",
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-primary")} aria-hidden />
              <span className="w-full truncate text-center">{item.label}</span>
            </Link>
          );
        })}
        {overflow.length > 0 ? (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-medium leading-tight tracking-tight text-muted-foreground",
                  overflow.some((item) => isActive(item, pathname)) && "bg-secondary text-primary-deep",
                )}
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden />
                <span>{t.shell.more}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>{t.shell.more}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 pb-4">
                {overflow.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Button asChild variant={isActive(item, pathname) ? "secondary" : "ghost"} className="h-11 justify-start gap-3">
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  </SheetClose>
                ))}
                {session ? (
                  <Button type="button" variant="outline" className="mt-2 h-11 justify-start gap-3" onClick={() => void handleLogout()} disabled={isLoggingOut}>
                    <LogOut className="h-4 w-4" />
                    {t.shell.logout}
                  </Button>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        ) : null}
      </nav>

    </div>
  );
}

export function PainelHeading({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <section className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </section>
  );
}
