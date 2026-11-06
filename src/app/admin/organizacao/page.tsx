import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { OrganizacaoScreen } from "@/components/painel/admin/organizacao-screen";
import { getSession, isAdminSession } from "@/lib/academy/auth";

export default async function AdminOrganizacaoPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!isAdminSession(session)) {
    notFound();
  }

  return (
    <AdminShell session={session}>
      <OrganizacaoScreen />
    </AdminShell>
  );
}
