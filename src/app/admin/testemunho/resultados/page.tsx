import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { TestemunhoResultadosScreen } from "@/components/painel/admin/testemunho-resultados-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminTestemunhoResultadosPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell session={session}>
      <TestemunhoResultadosScreen />
    </AdminShell>
  );
}
