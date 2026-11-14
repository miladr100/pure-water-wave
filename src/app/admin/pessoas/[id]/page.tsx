import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { PessoaScreen } from "@/components/painel/admin/pessoa-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminPessoaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const { id } = await params;
  return (
    <AdminShell session={session}>
      <PessoaScreen pessoaId={id} />
    </AdminShell>
  );
}
