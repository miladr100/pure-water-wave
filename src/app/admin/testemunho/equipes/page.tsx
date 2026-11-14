import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { TestemunhoEquipesScreen } from "@/components/painel/admin/testemunho-equipes-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminTestemunhoEquipesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <AdminShell session={session}>
      <TestemunhoEquipesScreen />
    </AdminShell>
  );
}
