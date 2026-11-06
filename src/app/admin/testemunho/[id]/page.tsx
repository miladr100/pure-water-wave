import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ConvidadoScreen } from "@/components/painel/convidado-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminConvidadoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const { id } = await params;

  return (
    <AdminShell session={session}>
      <ConvidadoScreen id={id} base="/admin/testemunho" />
    </AdminShell>
  );
}
