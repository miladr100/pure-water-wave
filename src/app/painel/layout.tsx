import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LocaleProvider } from "@/components/academy/locale-provider";
import { PainelShell } from "@/components/painel/painel-shell";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/academy/auth";

// The member's area of the HJ Team panel. The site's single Login is the
// only door, so a visitor without a session is sent there.
export default async function PainelLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/painel");
  }

  return (
    <LocaleProvider language={session.language}>
      <PainelShell area="painel" session={session}>
        {children}
      </PainelShell>
      <Toaster richColors position="top-center" />
    </LocaleProvider>
  );
}
