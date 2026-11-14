import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { CaixasScreen } from "@/components/painel/admin/caixas-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminCaixaPage({ searchParams }: { searchParams: Promise<{ equipe?: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const { equipe } = await searchParams;
  return (
    <AdminShell session={session}>
      <CaixasScreen equipeId={equipe} />
    </AdminShell>
  );
}
