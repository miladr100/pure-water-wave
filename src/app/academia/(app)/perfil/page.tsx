import { redirect } from "next/navigation";

import { PageShell } from "@/components/academy/page-shell";
import { ProfileScreen } from "@/components/academy/profile-screen";
import { getSession } from "@/lib/academy/auth";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  return (
    <PageShell session={session}>
      <ProfileScreen session={session} />
    </PageShell>
  );
}
