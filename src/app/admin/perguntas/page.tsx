import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { Inbox } from "@/components/admin/inbox";
import { getSession } from "@/lib/academy/auth";

export default async function AdminInboxPage() {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  return (
    <AdminShell session={session}>
      <Inbox />
    </AdminShell>
  );
}
