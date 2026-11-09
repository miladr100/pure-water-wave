import { notFound, redirect } from "next/navigation";

import { AdminShell, PageHeading } from "@/components/admin/admin-shell";
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
      <PageHeading
        title="Configurações"
        description="Lembretes, horários e integrações ficam aqui quando forem definidos com o grupo (ver docs/painel/decisoes-pendentes.md)."
      />
    </AdminShell>
  );
}
