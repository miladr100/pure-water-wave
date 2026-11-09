import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ConvidadosScreen } from "@/components/painel/convidados-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminTestemunhoPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell session={session}>
      <ConvidadosScreen base="/admin/testemunho" />
    </AdminShell>
  );
}
