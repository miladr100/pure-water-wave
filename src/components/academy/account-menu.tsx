"use client";

import { GraduationCap, LogOut, MessageCircleQuestion, Shield, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@/components/academy/locale-provider";
import { useMe } from "@/components/academy/use-api";
import { UserAvatar } from "@/components/academy/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionPayload } from "@/lib/academy/auth";

// The FFPUM account menu: the avatar opens name + email, Perfil, the other
// area, and Sair. Every item is available in both areas so nobody has to
// hunt for the way back.
export function AccountMenu({
  area,
  session,
  onOpenProfile,
}: {
  area: "academy" | "admin";
  session: SessionPayload;
  onOpenProfile: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isTutor = session.role === "tutor";
  const fullName = me?.profile.fullName ?? session.fullName;
  const email = me?.profile.email ?? session.login;

  // Let the menu close before the dialog or the navigation takes focus.
  function after(action: () => void) {
    setOpen(false);
    window.setTimeout(action, 80);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/academia/auth/logout", { method: "POST" });
      router.push("/academia/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-full border-2 border-transparent p-0.5 transition hover:border-primary hover:shadow-[0_0_0_3px] hover:shadow-primary/25 focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_3px] focus-visible:shadow-primary/25"
          aria-label={t.header.account}
        >
          <UserAvatar
            fullName={fullName}
            photoUrl={me?.profile.photoUrl ?? null}
            className="h-10 w-10"
            textClassName="text-sm"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{fullName}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => after(onOpenProfile)}>
          <UserRound className="mr-2 h-4 w-4" />
          {t.header.profile}
        </DropdownMenuItem>
        {area === "academy" ? (
          <DropdownMenuItem onClick={() => after(() => router.push("/academia/perguntas"))}>
            <MessageCircleQuestion className="mr-2 h-4 w-4" />
            {t.header.myQuestions}
          </DropdownMenuItem>
        ) : null}
        {isTutor ? (
          area === "academy" ? (
            <DropdownMenuItem onClick={() => after(() => router.push("/admin"))}>
              <Shield className="mr-2 h-4 w-4" />
              {t.header.viewAdmin}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => after(() => router.push("/academia"))}>
              <GraduationCap className="mr-2 h-4 w-4" />
              {t.header.viewAcademy}
            </DropdownMenuItem>
          )
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoggingOut} onClick={() => after(() => void handleLogout())}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? t.common.loggingOut : t.common.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
