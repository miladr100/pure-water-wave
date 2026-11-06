import { redirect } from "next/navigation";

import { InicioScreen } from "@/components/painel/inicio-screen";
import { getSession } from "@/lib/academy/auth";

export default async function PainelInicioPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/painel");
  }
  return <InicioScreen session={session} />;
}
