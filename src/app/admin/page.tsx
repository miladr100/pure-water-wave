import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { Overview } from "@/components/admin/overview";
import { getSession } from "@/lib/academy/auth";

export default async function AdminOverviewPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell session={session}>
      <Overview />
    </AdminShell>
  );
}
