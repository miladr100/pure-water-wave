import type { ReactNode } from "react";

import { NotificationsBell } from "@/components/academy/notifications-bell";
import { AppHeader } from "@/components/academy/app-header";
import type { SessionPayload } from "@/lib/academy/auth";

// The library's logged-in frame: header, optional banner, one centred main.
export function PageShell({
  session,
  banner,
  children,
}: {
  session: SessionPayload;
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <AppHeader area="academy" session={session} extra={<NotificationsBell />} />
      {banner}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
