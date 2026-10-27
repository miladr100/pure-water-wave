import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { StudentsTable } from "@/components/admin/students-table";
import { getSession } from "@/lib/academy/auth";

export default async function AdminStudentsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  return (
    <AdminShell session={session}>
      <StudentsTable />
    </AdminShell>
  );
}
