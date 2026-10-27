import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { Grading } from "@/components/admin/grading";
import { getSession } from "@/lib/academy/auth";

export default async function AdminGradingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  return (
    <AdminShell session={session}>
      <Grading />
    </AdminShell>
  );
}
