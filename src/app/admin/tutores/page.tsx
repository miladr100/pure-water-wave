import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { TutorsTable } from "@/components/admin/tutors-table";
import { getSession } from "@/lib/academy/auth";

export default async function AdminTutorsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  return (
    <AdminShell session={session}>
      <TutorsTable />
    </AdminShell>
  );
}
