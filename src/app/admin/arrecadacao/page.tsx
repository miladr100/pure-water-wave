import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { ArrecadacaoScreen } from "@/components/painel/admin/arrecadacao-screen";
import { getSession } from "@/lib/academy/auth";

export default async function AdminArrecadacaoPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell session={session}>
      <Suspense>
        <ArrecadacaoScreen />
      </Suspense>
    </AdminShell>
  );
}
