import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { PastorsTable } from "@/components/admin/pastors-table";
import { getSession } from "@/lib/academy/auth";

export default async function AdminPastorsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell session={session}>
      <PastorsTable />
    </AdminShell>
  );
}
