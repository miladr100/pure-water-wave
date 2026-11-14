import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ReunioesScreen } from "@/components/painel/reunioes-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminReunioesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <AdminShell session={session}>
      <ReunioesScreen papel="educador" />
    </AdminShell>
  );
}
