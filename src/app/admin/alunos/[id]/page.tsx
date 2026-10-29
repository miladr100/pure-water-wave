import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { StudentDetail } from "@/components/admin/student-detail";
import { getSession } from "@/lib/academy/auth";

export default async function AdminStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <AdminShell session={session}>
      <StudentDetail studentId={id} session={session} />
    </AdminShell>
  );
}
