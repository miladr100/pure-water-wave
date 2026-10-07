import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FamilyPledgePage } from "@/components/family-pledge-page";
import { getSession, isSystemUserSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Juramento da Família — Biblioteca Água Pura",
  description:
    "Os oito itens do Juramento da Família, na língua da conta, em coreano romanizado e em hangul.",
  robots: { index: false, follow: false },
};

export default async function BibliotecaJuramentoDaFamiliaPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  return <FamilyPledgePage session={session} />;
}
