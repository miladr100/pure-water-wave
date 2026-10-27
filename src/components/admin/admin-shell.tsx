import type { ReactNode } from "react";

import { AppHeader } from "@/components/academy/app-header";
import type { SessionPayload } from "@/lib/academy/auth";

// The logged-in frame of purewaterwave.org, as the library pages draw it:
// header on top, the soft gradient behind, one centred column of content.
export function AdminShell({ session, children }: { session: SessionPayload; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <AppHeader area="admin" session={session} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </section>
  );
}
