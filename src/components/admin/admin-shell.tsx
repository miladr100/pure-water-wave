import type { ReactNode } from "react";

import { PainelShell } from "@/components/painel/painel-shell";
import type { SessionPayload } from "@/lib/academy/auth";

// The logged-in frame of the administration: the HJ Team panel's shell
// (header with the area switch, sidebar on the computer, bottom bar on the
// phone) in its "admin" area. The academy's admin pages draw inside it.
export function AdminShell({ session, children }: { session: SessionPayload; children: ReactNode }) {
  return (
    <PainelShell area="admin" session={session}>
      {children}
    </PainelShell>
  );
}

export function PageHeading({
  title,
  description,
  actions,
  leading,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  // Drawn left of the title (a student's photo, for one).
  leading?: ReactNode;
}) {
  return (
    <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        {leading}
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">{title}</h1>
          {description ? <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </section>
  );
}
