import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LibraryAiChat } from "@/components/library-ai-chat";
import { aiChatEnabled } from "@/lib/ai-chat";
import { getSession, isSystemUserSession } from "@/lib/auth";

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

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  // Hidden until the model is configured (see lib/ai-chat.ts).
  if (!aiChatEnabled()) {
    redirect("/biblioteca");
  }

  return <LibraryAiChat session={session} />;
}
