import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { VideoSupportManualVideoPage } from "@/components/video-support-manual-video-page";
import { getSession, isSystemUserSession } from "@/lib/auth";
import {
  VIDEO_SUPPORT_CHAPTER_IDS,
  getVideoSupportManual,
  parseVideoSupportId,
} from "@/lib/video-support-manual";

type VideoSupportRouteProps = {
  params: Promise<{ videoId: string }>;
};

export function generateStaticParams() {
  return VIDEO_SUPPORT_CHAPTER_IDS.map((videoId) => ({
    videoId: String(videoId),
  }));
}

export async function generateMetadata({
  params,
}: VideoSupportRouteProps): Promise<Metadata> {
  const { videoId } = await params;
  const session = await getSession();
  const video = parseVideoSupportId(videoId, session?.language ?? "pt");

  if (!video) {
    return {
      title: "Manual de Apoio aos Vídeos — Biblioteca Água Pura",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${video.title} — Biblioteca Água Pura`,
    robots: { index: false, follow: false },
  };
}

export default async function BibliotecaManualVideosVideoPage({
  params,
}: VideoSupportRouteProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  const { videoId } = await params;
  const video = parseVideoSupportId(videoId, session.language);

  if (!video) {
    notFound();
  }

  const chapters = getVideoSupportManual(session.language);
  const videoIndex = chapters.findIndex((item) => item.id === video.id);
  const previousVideoId =
    videoIndex > 0 ? chapters[videoIndex - 1].id : null;
  const nextVideoId =
    videoIndex >= 0 && videoIndex < chapters.length - 1
      ? chapters[videoIndex + 1].id
      : null;

  return (
    <VideoSupportManualVideoPage
      session={session}
      videoId={video.id}
      previousVideoId={previousVideoId}
      nextVideoId={nextVideoId}
    />
  );
}
