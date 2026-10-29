"use client";

import { useLocale } from "@/components/academy/locale-provider";
import { ProfileContent } from "@/components/academy/profile-screen";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SessionPayload } from "@/lib/academy/auth";

// The profile opens over whatever screen the person is on — the academy or
// the panel — like the FFPUM account dialog, so a tutor never has to leave
// the panel to change a photo or a password.
export function ProfileDialog({
  session,
  open,
  onOpenChange,
}: {
  session: SessionPayload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(52rem,96vw)] max-w-none overflow-y-auto p-5 sm:p-8">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl text-primary-deep">
            {t.profile.heading}
          </DialogTitle>
          <DialogDescription>{t.profile.description}</DialogDescription>
        </DialogHeader>
        {open ? <ProfileContent session={session} layout="stack" /> : null}
      </DialogContent>
    </Dialog>
  );
}
