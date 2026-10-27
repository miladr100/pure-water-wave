import { redirect } from "next/navigation";

import { MyQuestions } from "@/components/academy/my-questions";
import { PageShell } from "@/components/academy/page-shell";
import { getSession } from "@/lib/academy/auth";

export default async function MyQuestionsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  return (
    <PageShell session={session}>
      <MyQuestions />
    </PageShell>
  );
}
