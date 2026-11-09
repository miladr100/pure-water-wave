"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PainelShell } from "@/components/painel/painel-shell";
import type { SessionPayload } from "@/lib/academy/auth";

// The library in the same frame as the panel and the academy: sidebar on
// the computer, bottom bar on the phone, both with the library's sections.
// An HJ Team member or educator (academy session) also gets the area
// switch; a pastor gets the library's own menus and no switch, because the
// library is all they have. The PDF reader is a full-screen view of its own
// and stays out of the frame.
export function LibraryMemberShell({
  session,
  pastor,
  aiChat,
  children,
}: {
  session?: SessionPayload;
  pastor?: { fullName: string };
  aiChat?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/biblioteca/ler/")) {
    return <>{children}</>;
  }
  return (
    <PainelShell area="biblioteca" session={session} pastor={pastor} aiChat={aiChat}>
      {children}
    </PainelShell>
  );
}
