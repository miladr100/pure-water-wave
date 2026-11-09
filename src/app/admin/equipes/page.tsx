import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { EquipesScreen } from "@/components/painel/admin/equipes-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminEquipesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell session={session}>
      <Suspense>
        <EquipesScreen />
      </Suspense>
    </AdminShell>
  );
}
