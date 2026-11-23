import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { ContabilidadeFrame } from "@/components/painel/contabilidade/frame";
import { getSession } from "@/lib/academy/auth";

// A Contabilidade de educadores e administradores: as equipes de que cuidam,
// uma a uma ou todas juntas.
export default async function AdminContabilidadeLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <AdminShell session={session}>
      <ContabilidadeFrame lado="admin">{children}</ContabilidadeFrame>
    </AdminShell>
  );
}
