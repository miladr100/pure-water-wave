import { redirect } from "next/navigation";

import { ProfileScreen } from "@/components/academy/profile-screen";
import { getSession } from "@/lib/academy/auth";

// The account's profile inside the panel's frame (the layout draws it).
export default async function PainelPerfilPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/painel/perfil");
  }
  return <ProfileScreen session={session} />;
}
