import { redirect } from "next/navigation";

import { Dashboard } from "@/components/academy/dashboard";
import { PageShell } from "@/components/academy/page-shell";
import { getSession } from "@/lib/academy/auth";

export default async function AcademiaPage() {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  return (
    <PageShell session={session}>
      <Dashboard session={session} />
    </PageShell>
  );
}
