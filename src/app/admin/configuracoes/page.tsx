import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ConfiguracoesScreen } from "@/components/painel/admin/configuracoes-screen";
import { isAdministrator } from "@/lib/academy/administrator";
import { getSession } from "@/lib/academy/auth";

export default async function AdminConfiguracoesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!(await isAdministrator(session))) {
    notFound();
  }

  return (
    <AdminShell session={session}>
      <ConfiguracoesScreen />
    </AdminShell>
  );
}
