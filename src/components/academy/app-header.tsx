"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Shield,
  Users,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { useLocale } from "@/components/academy/locale-provider";
import { LogoutButton } from "@/components/academy/logout-button";
import { SettingsMenu } from "@/components/academy/settings-menu";
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

// The library's header (logo-as-settings, title, nav buttons, logout, sheet
// on phones), with the nav decided by the area. Tutors get a link across to
// the other area in both.
type AppHeaderProps = {
  area: "academy" | "admin";
  session: SessionPayload;
  title?: string;
  subtitle?: string;
  // Rendered right of the title on desktop (a notifications bell, for one).
  extra?: React.ReactNode;
};

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

export function AppHeader({ area, session, title, subtitle, extra }: AppHeaderProps) {
  const { t } = useLocale();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const isTutor = session.role === "tutor";

  const items: NavItem[] =
    area === "academy"
      ? [
          { href: "/academia", label: t.header.myCourses, icon: GraduationCap, exact: true },
          { href: "/academia/cursos", label: t.header.catalog, icon: BookOpen },
          { href: "/academia/perguntas", label: t.header.myQuestions, icon: MessageCircleQuestion },
          ...(isTutor ? [{ href: "/admin", label: t.header.viewAdmin, icon: Shield }] : []),
        ]
      : [
          { href: "/admin", label: t.header.overview, icon: LayoutDashboard, exact: true },
          { href: "/admin/alunos", label: t.header.students, icon: Users },
          { href: "/admin/tutores", label: t.header.tutors, icon: UserCheck },
          { href: "/admin/cursos", label: t.header.courses, icon: BookOpen },
          { href: "/admin/perguntas", label: t.header.inbox, icon: MessageCircleQuestion },
          { href: "/admin/correcoes", label: t.header.grading, icon: ClipboardCheck },
          { href: "/academia", label: t.header.viewAcademy, icon: GraduationCap },
        ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/academia/auth/logout", { method: "POST" });
      setSheetOpen(false);
      router.push("/academia/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  const headerTitle = title ?? (area === "academy" ? t.header.academyTitle : t.header.adminTitle);
  const headerSubtitle =
    subtitle ??
    (area === "academy" ? t.header.academySubtitle(firstName) : t.header.adminSubtitle(firstName));

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <SettingsMenu
            fullName={session.fullName}
            logoClassName="h-10 w-10"
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
          />

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label={t.common.menu}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[min(20rem,85vw)] flex-col gap-4">
              <SheetHeader>
                <SheetTitle>{t.common.menu}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-1 flex-col gap-1">
                {items.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Button
                      asChild
                      variant={isActive(item) ? "secondary" : "ghost"}
                      className="h-11 w-full justify-start gap-3"
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  </SheetClose>
                ))}
              </nav>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-start gap-3"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? t.common.loggingOut : t.common.logout}
              </Button>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold text-primary-deep md:whitespace-normal">
              {headerTitle}
            </p>
            <p className="truncate text-sm text-muted-foreground md:whitespace-normal">
              {headerSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {extra}
          <nav className="hidden items-center gap-1 lg:flex">
            {items.map((item) => (
              <Button
                asChild
                key={item.href}
                variant={isActive(item) ? "secondary" : "ghost"}
                className={cn("gap-2", isActive(item) && "text-primary-deep")}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
          <div className="hidden lg:block">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
