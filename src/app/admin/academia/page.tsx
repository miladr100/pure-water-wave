import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { Overview } from "@/components/admin/overview";
import { getSession } from "@/lib/academy/auth";

// The academy's overview, as it was: now the "Academia" entry of the
// administration's sidebar.
export default async function AdminAcademiaPage() {
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
