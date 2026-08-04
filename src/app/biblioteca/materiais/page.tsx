import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupportMaterialsPage } from "@/components/support-materials-page";
import { getSession, isSystemUserSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Material de apoio — Biblioteca Água Pura",
  description:
    "Materiais para download e vídeos de formação da Biblioteca Água Pura.",
  robots: { index: false, follow: false },
};

export default async function BibliotecaMateriaisPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  return <SupportMaterialsPage session={session} />;
}
