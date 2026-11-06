import { redirect } from "next/navigation";

import { PageShell } from "@/components/academy/page-shell";
import { ProfileScreen } from "@/components/academy/profile-screen";
import { getSession } from "@/lib/academy/auth";

// The account's profile, as a page of its own inside the academy's frame.
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/academia/perfil");
  }

  return (
    <PageShell session={session}>
      <ProfileScreen session={session} />
    </PageShell>
  );
}
