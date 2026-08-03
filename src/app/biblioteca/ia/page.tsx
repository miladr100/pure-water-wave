import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LibraryAiChat } from "@/components/library-ai-chat";
import { getSession, isPastorSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Fale com a IA — Biblioteca Água Pura",
  description:
    "Pergunte à IA com base nos livros e materiais da biblioteca pastoral.",
  robots: { index: false, follow: false },
};

export default async function BibliotecaIaPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isPastorSession(session)) {
    redirect("/login");
  }

  return <LibraryAiChat session={session} />;
}
