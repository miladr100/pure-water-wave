import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { PessoasScreen } from "@/components/painel/admin/pessoas-screen";
import { getSession, isAdminSession } from "@/lib/academy/auth";

export default async function AdminPessoasPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!isAdminSession(session)) {
    notFound();
  }

  return (
    <AdminShell session={session}>
      <PessoasScreen papel="administrador" />
    </AdminShell>
  );
}
