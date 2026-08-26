import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VideoSupportManualPage } from "@/components/video-support-manual-page";
import { getSession, isSystemUserSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Manual de Apoio aos Vídeos — Biblioteca Água Pura",
  description:
    "Perguntas e respostas do Manual de Apoio aos Vídeos do Kit 1, organizadas por vídeo.",
  robots: { index: false, follow: false },
};

export default async function BibliotecaManualVideosPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  return <VideoSupportManualPage session={session} />;
}
