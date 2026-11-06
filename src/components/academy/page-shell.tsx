import type { ReactNode } from "react";

import { PainelShell } from "@/components/painel/painel-shell";
import type { SessionPayload } from "@/lib/academy/auth";

// The academy's logged-in frame: the same shell as the panel (header with
// the area switch, sidebar on the computer, bottom bar on the phone) in
// its "academia" area, with an optional banner above the content.
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
    <PainelShell area="academia" session={session} banner={banner}>
      {children}
    </PainelShell>
  );
}
