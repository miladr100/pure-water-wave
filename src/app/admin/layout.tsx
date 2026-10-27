import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LocaleProvider } from "@/components/academy/locale-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSession, isTutorSession } from "@/lib/academy/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session || !isTutorSession(session)) {
    redirect(session ? "/academia" : "/academia/login");
  }

  return (
    <LocaleProvider language={session.language}>
      {children}
      <Toaster richColors position="top-center" />
    </LocaleProvider>
  );
}
