"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildSpeechChunks,
  isSpeechSynthesisSupported,
  pickSpeechVoice,
  SPEECH_LOCALES,
  type SpeechChunk,
} from "@/lib/device-speech";
import type { UserLanguage } from "@/lib/user-languages";

type SpeechStatus = "idle" | "playing" | "paused";

type UseDeviceSpeechOptions = {
  title: string;
  paragraphs: string[];
  language: UserLanguage;
  resetKey?: string;
};

export function useDeviceSpeech({
  title,
  paragraphs,
  language,
  resetKey,
}: UseDeviceSpeechOptions) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [supported, setSupported] = useState(false);
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);

  const chunksRef = useRef<SpeechChunk[]>([]);
  const indexRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setSupported(isSpeechSynthesisSupported());
  }, []);

  const cancelSpeech = useCallback(() => {
    cancelledRef.current = true;

    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speakFrom = useCallback(
    (startIndex: number) => {
      if (!isSpeechSynthesisSupported()) {
        return;
      }

      const chunk = chunksRef.current[startIndex];

      if (!chunk) {
        setStatus("idle");
        setActiveParagraph(null);
        indexRef.current = 0;
        return;
      }

      cancelledRef.current = false;
      indexRef.current = startIndex;
      setActiveParagraph(chunk.paragraphIndex);
      setStatus("playing");

      const utterance = new SpeechSynthesisUtterance(chunk.text);
      const voice = pickSpeechVoice(window.speechSynthesis.getVoices(), language);

      utterance.lang = voice?.lang || SPEECH_LOCALES[language];
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = 0.96;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        if (cancelledRef.current) {
          return;
        }

        speakFrom(startIndex + 1);
      };

      utterance.onerror = (event) => {
        if (
          cancelledRef.current ||
          event.error === "canceled" ||
          event.error === "interrupted"
        ) {
          return;
        }

        setStatus("idle");
        setActiveParagraph(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [language],
  );

  const play = useCallback(() => {
    chunksRef.current = buildSpeechChunks(title, paragraphs);

    if (chunksRef.current.length === 0) {
      return;
    }

    cancelSpeech();
    window.setTimeout(() => {
      cancelledRef.current = false;
      speakFrom(0);
    }, 40);
  }, [cancelSpeech, paragraphs, speakFrom, title]);

  const pause = useCallback(() => {
    if (!isSpeechSynthesisSupported() || status !== "playing") {
      return;
    }

    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setStatus("paused");
  }, [status]);

  const resume = useCallback(() => {
    if (status !== "paused") {
      return;
    }

    cancelledRef.current = false;
    speakFrom(indexRef.current);
  }, [speakFrom, status]);

  const stop = useCallback(() => {
    cancelSpeech();
    indexRef.current = 0;
    setStatus("idle");
    setActiveParagraph(null);
  }, [cancelSpeech]);

  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, language]);

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [stop]);

  return {
    supported,
    status,
    activeParagraph,
    play,
    pause,
    resume,
    stop,
  };
}
