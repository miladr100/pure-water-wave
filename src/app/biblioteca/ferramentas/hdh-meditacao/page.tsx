import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HdhMeditationPage } from "@/components/hdh-meditation-page";
import { getSession, isSystemUserSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Hoon Dok Hae e Meditação — Biblioteca Água Pura",
  description:
    "Livro de Hoon Dok Hae e meditação das Palavras dos Verdadeiros Pais. Leitura diária, perguntas de reflexão e inspiração.",
  robots: { index: false, follow: false },
};

export default async function BibliotecaHdhMeditacaoPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  return <HdhMeditationPage session={session} />;
}
