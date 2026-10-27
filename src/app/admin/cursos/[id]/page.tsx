import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { CourseEditor } from "@/components/admin/course-editor";
import { getSession } from "@/lib/academy/auth";

export default async function AdminCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  const { id } = await params;

  return (
    <AdminShell session={session}>
      <CourseEditor courseId={id} />
    </AdminShell>
  );
}
