import videosEs from "@/lib/video-support-manual-es.json";
import videosPt from "@/lib/video-support-manual-pt.json";
import { getSupportVideosByLanguage } from "@/lib/support-materials";
import type { UserLanguage } from "@/lib/user-languages";

export type VideoSupportQuestion = {
  id: string;
  question: string;
  answer: string;
  complement?: string;
  tip?: string;
};

export type VideoSupportChapter = {
  id: number;
  title: string;
  questions: VideoSupportQuestion[];
  youtubeId: string | null;
};

const VIDEOS_BY_LANGUAGE: Record<UserLanguage, typeof videosPt> = {
  pt: videosPt,
  en: videosPt,
  es: videosEs,
};

function padVideoNumber(id: number) {
  return String(id).padStart(2, "0");
}

export function getVideoSupportManual(language: UserLanguage): VideoSupportChapter[] {
  const videos = VIDEOS_BY_LANGUAGE[language] ?? videosPt;
  const supportVideos = getSupportVideosByLanguage(
    language === "en" ? "pt" : language,
  );

  return videos.map((video) => {
    const youtubeId =
      supportVideos.find((item) =>
        item.title.startsWith(padVideoNumber(video.id)),
      )?.youtubeId ?? null;

    return {
      ...video,
      youtubeId,
    };
  });
}

export function getVideoSupportChapter(
  videoId: number,
  language: UserLanguage = "pt",
) {
  return (
    getVideoSupportManual(language).find((video) => video.id === videoId) ??
    getVideoSupportManual("pt").find((video) => video.id === videoId) ??
    null
  );
}

export function parseVideoSupportId(raw: string, language: UserLanguage = "pt") {
  const videoId = Number(raw);

  if (!Number.isInteger(videoId) || videoId < 1) {
    return null;
  }

  return getVideoSupportChapter(videoId, language);
}

export const VIDEO_SUPPORT_CHAPTER_IDS = videosPt.map((video) => video.id);
