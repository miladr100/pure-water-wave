import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { OrganizacaoScreen } from "@/components/painel/admin/organizacao-screen";
import { isAdministrator } from "@/lib/academy/administrator";
import { getSession } from "@/lib/academy/auth";

export default async function AdminOrganizacaoPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!(await isAdministrator(session))) {
    notFound();
  }

  return (
    <AdminShell session={session}>
      <OrganizacaoScreen />
    </AdminShell>
  );
}
