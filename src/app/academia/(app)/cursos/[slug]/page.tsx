import { redirect } from "next/navigation";

import { CourseDetail } from "@/components/academy/course-detail";
import { PageShell } from "@/components/academy/page-shell";
import { getSession } from "@/lib/academy/auth";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;

  return (
    <PageShell session={session}>
      <CourseDetail key={slug} slug={slug} />
    </PageShell>
  );
}
