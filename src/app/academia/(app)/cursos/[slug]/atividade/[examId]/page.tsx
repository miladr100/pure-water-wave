import { redirect } from "next/navigation";

import { ExamScreen } from "@/components/academy/exam-screen";
import { PageShell } from "@/components/academy/page-shell";
import { TutorBanner } from "@/components/academy/tutor-banner";
import { getSession } from "@/lib/academy/auth";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string; examId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { slug, examId } = await params;
  const isTutor = session.role === "tutor";

  return (
    <PageShell session={session} banner={isTutor ? <TutorBanner /> : null}>
      <ExamScreen key={examId} slug={slug} examId={examId} isTutor={isTutor} />
    </PageShell>
  );
}
