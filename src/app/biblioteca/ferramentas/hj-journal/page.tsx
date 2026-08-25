import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HjJournalPage } from "@/components/hj-journal-page";
import { getSession, isSystemUserSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "HJ Journal — Biblioteca Água Pura",
  description:
    "Diário Hyo Jeong para a reflexão da palavra, anotações do ahá e análise de cada dia da jornada.",
  robots: { index: false, follow: false },
};

export default async function BibliotecaHjJournalPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  return <HjJournalPage session={session} />;
}
