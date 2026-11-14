import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { AreasScreen } from "@/components/painel/admin/areas-screen";
import { isAdministrator } from "@/lib/academy/administrator";
import { getSession } from "@/lib/academy/auth";

export default async function AdminAreasPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!(await isAdministrator(session))) {
    notFound();
  }

  return (
    <AdminShell session={session}>
      <AreasScreen />
    </AdminShell>
  );
}
