import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LibraryToolsPage } from "@/components/library-tools-page";
import { getSession, isSystemUserSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Ferramentas — Biblioteca Água Pura",
  description: "Ferramentas para o dia a dia da Biblioteca Água Pura.",
  robots: { index: false, follow: false },
};

export default async function BibliotecaFerramentasPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  return <LibraryToolsPage session={session} />;
}
