"use client";

import Link from "next/link";
import {
  BookOpen,
  FileText,
  LogOut,
  Menu,
  MessageSquareWarning,
  PlayCircle,
  Settings,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type LibraryMobileMenuProps = {
  showSupportMaterialsLink?: boolean;
  showVideosLink?: boolean;
  showToolsLink?: boolean;
  showBackToLibrary?: boolean;
  onOpenSettings: () => void;
  onOpenFeedback: () => void;
};

export function LibraryMobileMenu({
  showSupportMaterialsLink = true,
  showVideosLink = true,
  showToolsLink = true,
  showBackToLibrary = false,
  onOpenSettings,
  onOpenFeedback,
}: LibraryMobileMenuProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function openAfterClose(action: () => void) {
    setOpen(false);
    window.setTimeout(action, 180);
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden"
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
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full justify-start gap-3"
            onClick={() => openAfterClose(onOpenSettings)}
          >
            <Settings className="h-4 w-4" />
            {t.settings.title}
          </Button>

          {showBackToLibrary ? (
            <SheetClose asChild>
              <Button asChild variant="ghost" className="h-11 w-full justify-start gap-3">
                <Link href="/biblioteca">
                  <BookOpen className="h-4 w-4" />
                  {t.common.library}
                </Link>
              </Button>
            </SheetClose>
          ) : null}

          {showSupportMaterialsLink ? (
            <SheetClose asChild>
              <Button asChild variant="ghost" className="h-11 w-full justify-start gap-3">
                <Link href="/biblioteca/materiais">
                  <FileText className="h-4 w-4" />
                  {t.common.supportMaterials}
                </Link>
              </Button>
            </SheetClose>
          ) : null}

          {showVideosLink ? (
            <SheetClose asChild>
              <Button asChild variant="ghost" className="h-11 w-full justify-start gap-3">
                <Link href="/biblioteca/videos">
                  <PlayCircle className="h-4 w-4" />
                  {t.common.videos}
                </Link>
              </Button>
            </SheetClose>
          ) : null}

          {showToolsLink ? (
            <SheetClose asChild>
              <Button asChild variant="ghost" className="h-11 w-full justify-start gap-3">
                <Link href="/biblioteca/ferramentas">
                  <Wrench className="h-4 w-4" />
                  {t.common.tools}
                </Link>
              </Button>
            </SheetClose>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full justify-start gap-3"
            onClick={() => openAfterClose(onOpenFeedback)}
          >
            <MessageSquareWarning className="h-4 w-4" />
            {t.feedback.button}
          </Button>
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
  );
}
