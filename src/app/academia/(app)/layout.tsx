import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LocaleProvider } from "@/components/academy/locale-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSession, isAcademySession } from "@/lib/academy/auth";

export default async function AcademiaLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session || !isAcademySession(session)) {
    redirect("/login");
  }

  return (
    <LocaleProvider language={session.language}>
      {children}
      <Toaster richColors position="top-center" />
    </LocaleProvider>
  );
}
