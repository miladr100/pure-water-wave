import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { CoursesList } from "@/components/admin/courses-list";
import { getSession } from "@/lib/academy/auth";

export default async function AdminCoursesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  return (
    <AdminShell session={session}>
      <CoursesList />
    </AdminShell>
  );
}
