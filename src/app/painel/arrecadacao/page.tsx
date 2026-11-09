import { redirect } from "next/navigation";
import { Suspense } from "react";

import { RelatorioScreen } from "@/components/painel/relatorio-screen";
import { getSession } from "@/lib/academy/auth";

export default async function PainelArrecadacaoPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/painel/arrecadacao");
  }
  return (
    <Suspense>
      <RelatorioScreen session={session} />
    </Suspense>
  );
}
