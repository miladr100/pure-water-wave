import { redirect } from "next/navigation";

import { InicioScreen } from "@/components/painel/inicio-screen";
import { getSession } from "@/lib/academy/auth";

export default async function PainelInicioPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/painel");
  }
  // An educator's Painel is the administration: same area, more items.
  if (session.role === "tutor") {
    redirect("/admin");
  }
  return <InicioScreen session={session} />;
}
