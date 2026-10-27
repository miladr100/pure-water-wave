"use client";

import { useEffect, useRef, useState } from "react";

import { ResumeOverlay } from "@/components/academy/resume-overlay";
import { useVideoGate } from "@/components/academy/use-video-gate";
import type { VideoPlayback } from "@/lib/academy/types";

// Only the slice of the IFrame API the player uses; the official typings
// are not a dependency of the site either.
type YtPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
};

type YtStateEvent = { data: number };

type YtNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: YtStateEvent) => void;
      };
    },
  ) => YtPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number };
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const IFRAME_API = "https://www.youtube.com/iframe_api";
const POLL_MS = 500;

let apiPromise: Promise<YtNamespace> | null = null;

function loadYouTubeApi(): Promise<YtNamespace> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT) {
          resolve(window.YT);
        }
      };

      if (!document.querySelector(`script[src="${IFRAME_API}"]`)) {
        const script = document.createElement("script");
        script.src = IFRAME_API;
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }

  return apiPromise;
}

type Props = {
  video: Extract<VideoPlayback, { provider: "youtube" }>;
  lessonId: string;
  isTutor: boolean;
  onEnded: () => void;
};

export function YouTubePlayer({ video, lessonId, isTutor, onEnded }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const gate = useVideoGate({ video, lessonId, isTutor });
  const [ready, setReady] = useState(false);
  const [resumePending, setResumePending] = useState(Boolean(video.resume));

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    let disposed = false;
    let interval: number | undefined;
    // The API replaces the element it is given with an iframe, so it gets a
    // child of its own rather than a node React manages.
    const mount = document.createElement("div");
    mount.className = "h-full w-full";
    host.appendChild(mount);

    const finish = () => {
      if (endedRef.current) {
        return;
      }
      endedRef.current = true;
      void gate.ended().then(() => onEndedRef.current());
    };

    void loadYouTubeApi().then((YT) => {
      if (disposed) {
        return;
      }

      const player = new YT.Player(mount, {
        videoId: video.youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (disposed) {
              return;
            }
            playerRef.current = player;
            gate.ceilingFor(player.getDuration());
            setReady(true);
          },
          onStateChange: (event) => {
            if (disposed) {
              return;
            }
            if (event.data === YT.PlayerState.ENDED) {
              finish();
            } else if (event.data === YT.PlayerState.PAUSED) {
              gate.flush(player.getCurrentTime(), player.getDuration());
            }
          },
        },
      });

      interval = window.setInterval(() => {
        const current = playerRef.current;
        if (!current || endedRef.current) {
          return;
        }

        const duration = current.getDuration();
        if (!(duration > 0)) {
          return;
        }

        const verdict = gate.observe({
          current: current.getCurrentTime(),
          duration,
          playing: current.getPlayerState() === YT.PlayerState.PLAYING,
        });

        if (verdict.blocked) {
          current.seekTo(verdict.ceiling, true);
        }
      }, POLL_MS);
    });

    return () => {
      disposed = true;
      if (interval !== undefined) {
        window.clearInterval(interval);
      }

      const player = playerRef.current;
      playerRef.current = null;
      if (player) {
        if (!endedRef.current) {
          const duration = player.getDuration();
          if (duration > 0) {
            gate.flush(player.getCurrentTime(), duration);
          }
        }
        player.destroy();
      }
      mount.remove();
    };
  }, [video.youtubeId, gate]);

  function startAt(percent: number) {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const duration = player.getDuration();
    if (percent > 0 && duration > 0) {
      player.seekTo((percent / 100) * duration, true);
    }
    setResumePending(false);
    player.playVideo();
  }

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full" />
      {resumePending ? (
        <ResumeOverlay
          disabled={!ready}
          onContinue={() => startAt(video.resume?.percent ?? 0)}
          onRestart={() => startAt(0)}
        />
      ) : null}
    </div>
  );
}
