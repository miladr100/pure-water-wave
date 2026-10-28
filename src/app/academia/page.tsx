import { redirect } from "next/navigation";

import { Dashboard } from "@/components/academy/dashboard";
import { LocaleProvider } from "@/components/academy/locale-provider";
import { PageShell } from "@/components/academy/page-shell";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/academy/auth";

// The student's home. The site's single Login is the only door, so a
// visitor without a session is sent there.
export default async function AcademiaHomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/academia/login");
  }

  return (
    <LocaleProvider language={session.language}>
      <PageShell session={session}>
        <Dashboard session={session} />
      </PageShell>
      <Toaster richColors position="top-center" />
    </LocaleProvider>
  );
}
