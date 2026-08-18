import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupportVideosPage } from "@/components/support-videos-page";
import { getSession, isSystemUserSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Vídeos — Biblioteca Água Pura",
  description: "Trilhas de vídeos de formação da Biblioteca Água Pura.",
  robots: { index: false, follow: false },
};

export default async function BibliotecaVideosPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  return <SupportVideosPage session={session} />;
}
