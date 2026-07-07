import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LibraryDashboard } from "@/components/library-dashboard";
import { getSession, isPastorSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Biblioteca — Água Pura",
  description:
    "Acesse livros e materiais de formação pastoral do movimento Água Pura.",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Biblioteca Água Pura",
  },
};

export default async function BibliotecaPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isPastorSession(session)) {
    redirect("/login");
  }

  return <LibraryDashboard session={session} />;
}
