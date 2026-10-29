import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ImportAccounts } from "@/components/admin/import-accounts";
import { getSession } from "@/lib/academy/auth";

export default async function AdminImportAccountsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell session={session}>
      <ImportAccounts />
    </AdminShell>
  );
}
