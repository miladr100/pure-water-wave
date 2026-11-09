import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminInicioScreen } from "@/components/painel/admin/admin-inicio-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminHomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell session={session}>
      <AdminInicioScreen />
    </AdminShell>
  );
}
