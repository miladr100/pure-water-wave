import { redirect } from "next/navigation";

import { LessonPlayer } from "@/components/academy/lesson-player";
import { PageShell } from "@/components/academy/page-shell";
import { TutorBanner } from "@/components/academy/tutor-banner";
import { getSession } from "@/lib/academy/auth";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { slug, lessonId } = await params;
  const isTutor = session.role === "tutor";

  return (
    <PageShell session={session} banner={isTutor ? <TutorBanner /> : null}>
      {/* Keyed so moving to the next lesson starts a fresh player and state. */}
      <LessonPlayer key={lessonId} slug={slug} lessonId={lessonId} isTutor={isTutor} />
    </PageShell>
  );
}
