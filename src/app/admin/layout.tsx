import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { LocaleProvider } from "@/components/academy/locale-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSession, isTutorSession } from "@/lib/academy/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  // Same rule as the middleware: for anyone who is not a tutor the panel is
  // a 404, never a redirect that would confirm it exists.
  if (!session || !isTutorSession(session)) {
    notFound();
  }

  return (
    <LocaleProvider language={session.language}>
      {children}
      <Toaster richColors position="top-center" />
    </LocaleProvider>
  );
}
