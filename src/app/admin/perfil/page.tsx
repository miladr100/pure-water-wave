import { redirect } from "next/navigation";

import { ProfileScreen } from "@/components/academy/profile-screen";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSession } from "@/lib/academy/auth";

// The educator's profile inside their Painel.
export default async function AdminPerfilPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell session={session}>
      <ProfileScreen session={session} />
    </AdminShell>
  );
}
