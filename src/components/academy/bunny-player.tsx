"use client";

import Hls from "hls.js";
import { Gauge, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { fmtClock } from "@/components/academy/format";
import { ResumeOverlay } from "@/components/academy/resume-overlay";
import { useVideoGate } from "@/components/academy/use-video-gate";
import { useLocale } from "@/components/academy/locale-provider";
import { SEEK_TOLERANCE_SEC, canSeekForward } from "@/lib/academy/seekgate";
import type { VideoPlayback } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 1.25, 1.5, 2];
const SKIP_SEC = 10;

type Props = {
  video: Extract<VideoPlayback, { provider: "bunny" }>;
  lessonId: string;
  isTutor: boolean;
  onEnded: () => void;
};

// iOS Safari has no element-level fullscreen; the video itself can go.
type IosVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export function BunnyPlayer({ video, lessonId, isTutor, onEnded }: Props) {
  const { t } = useLocale();
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const gate = useVideoGate({ video, lessonId, isTutor });
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ceiling, setCeiling] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [resumePending, setResumePending] = useState(Boolean(video.resume));

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    let hls: Hls | null = null;
    if (Hls.isSupported()) {
      hls = new Hls({
        // Every segment request carries the signed token the API minted.
        xhrSetup: (xhr, url) => {
          const withAuth = url.includes("token=")
            ? url
            : url + (url.includes("?") ? "&" : "?") + video.authQuery;
          xhr.open("GET", withAuth, true);
        },
      });
      hls.loadSource(video.url);
      hls.attachMedia(element);
    } else {
      element.src = video.url;
    }

    return () => {
      hls?.destroy();
      element.removeAttribute("src");
      element.load();
    };
  }, [video.url, video.authQuery]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    const onTimeUpdate = () => {
      const total = element.duration;
      if (endedRef.current || !(total > 0)) {
        return;
      }
      const verdict = gate.observe({
        current: element.currentTime,
        duration: total,
        playing: !element.paused,
      });
      if (verdict.blocked) {
        element.currentTime = verdict.ceiling;
      }
      setCurrent(element.currentTime);
      setCeiling(verdict.ceiling);
    };

    // Media keys and the OS overlay bypass the on-screen controls.
    const onSeeking = () => {
      const total = element.duration;
      if (!(total > 0)) {
        return;
      }
      const cap = gate.ceilingFor(total);
      if (element.currentTime > cap + SEEK_TOLERANCE_SEC) {
        element.currentTime = cap;
      }
    };

    const onLoadedMetadata = () => {
      setDuration(element.duration);
      setCeiling(gate.ceilingFor(element.duration));
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      if (element.duration > 0) {
        gate.flush(element.currentTime, element.duration);
      }
    };
    const onEnd = () => {
      if (endedRef.current) {
        return;
      }
      endedRef.current = true;
      setPlaying(false);
      void gate.ended().then(() => onEndedRef.current());
    };

    element.addEventListener("timeupdate", onTimeUpdate);
    element.addEventListener("seeking", onSeeking);
    element.addEventListener("loadedmetadata", onLoadedMetadata);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    element.addEventListener("ended", onEnd);

    return () => {
      element.removeEventListener("timeupdate", onTimeUpdate);
      element.removeEventListener("seeking", onSeeking);
      element.removeEventListener("loadedmetadata", onLoadedMetadata);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("ended", onEnd);
      if (!endedRef.current && element.duration > 0) {
        gate.flush(element.currentTime, element.duration);
      }
    };
  }, [gate]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function togglePlay() {
    const element = videoRef.current;
    if (!element || resumePending) {
      return;
    }
    if (element.paused) {
      void element.play();
    } else {
      element.pause();
    }
  }

  function seekTo(target: number) {
    const element = videoRef.current;
    if (!element || !(element.duration > 0)) {
      return;
    }
    const result = gate.seek(target, element.duration);
    element.currentTime = result.time;
    setCurrent(result.time);
  }

  function cycleSpeed() {
    const element = videoRef.current;
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length] ?? 1;
    setSpeed(next);
    if (element) {
      element.playbackRate = next;
    }
  }

  function toggleFullscreen() {
    const frame = frameRef.current;
    const element = videoRef.current as IosVideo | null;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (frame?.requestFullscreen) {
      void frame.requestFullscreen();
    } else if (element?.webkitEnterFullscreen) {
      element.webkitEnterFullscreen();
    }
  }

  function startAt(percent: number) {
    const element = videoRef.current;
    if (!element) {
      return;
    }
    if (percent > 0 && element.duration > 0) {
      element.currentTime = (percent / 100) * element.duration;
    }
    setResumePending(false);
    void element.play();
  }

  const forwardAllowed = canSeekForward({ current, ceiling });

  return (
    // A video frame is black by convention, whatever the theme.
    <div ref={frameRef} className="group/player relative h-full w-full bg-black">
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        className="h-full w-full"
        onClick={togglePlay}
      />

      {resumePending ? (
        <ResumeOverlay
          disabled={!(duration > 0)}
          onContinue={() => startAt(video.resume?.percent ?? 0)}
          onRestart={() => startAt(0)}
        />
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-8 text-white">
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 0}
          step={0.1}
          value={Math.min(current, duration || 0)}
          onChange={(event) => seekTo(Number(event.target.value))}
          aria-label={t.player.seek}
          className="h-1.5 w-full cursor-pointer accent-primary"
        />
        <div className="mt-1 flex items-center gap-0.5 sm:gap-1">
          <ControlButton label={playing ? t.player.pause : t.player.play} onClick={togglePlay}>
            {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
          </ControlButton>
          <ControlButton label={t.player.skipBack} onClick={() => seekTo(current - SKIP_SEC)}>
            <RotateCcw className="h-5 w-5" />
          </ControlButton>
          <ControlButton
            label={t.player.skipForward}
            onClick={() => seekTo(current + SKIP_SEC)}
            disabled={!forwardAllowed}
          >
            <RotateCw className="h-5 w-5" />
          </ControlButton>
          <span className="ml-1 text-xs tabular-nums sm:text-sm">
            {fmtClock(current)} / {fmtClock(duration)}
          </span>
          <span className="flex-1" />
          <ControlButton label={t.player.speed} onClick={cycleSpeed}>
            <Gauge className="h-4 w-4" />
            <span className="text-xs font-semibold">{speed}×</span>
          </ControlButton>
          <ControlButton label={t.player.fullscreen} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </ControlButton>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full px-2 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}
