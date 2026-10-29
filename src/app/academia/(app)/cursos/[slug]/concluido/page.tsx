import { redirect } from "next/navigation";

import { CourseComplete } from "@/components/academy/course-complete";
import { PageShell } from "@/components/academy/page-shell";
import { getSession } from "@/lib/academy/auth";

export default async function CourseCompletePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;

  return (
    <PageShell session={session}>
      <CourseComplete slug={slug} />
    </PageShell>
  );
}
