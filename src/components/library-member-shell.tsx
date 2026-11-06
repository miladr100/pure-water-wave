"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PainelShell } from "@/components/painel/painel-shell";
import type { SessionPayload } from "@/lib/academy/auth";

// An HJ Team member or educator reads the library inside the same frame as
// the panel and the academy (switch beside the logo, sidebar, bottom bar).
// Pastors keep the library's own header, untouched. The PDF reader is a
// full-screen view of its own and stays out of the frame.
export function LibraryMemberShell({ session, children }: { session: SessionPayload; children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/biblioteca/ler/")) {
    return <>{children}</>;
  }
  return (
    <PainelShell area="biblioteca" session={session}>
      {children}
    </PainelShell>
  );
}
