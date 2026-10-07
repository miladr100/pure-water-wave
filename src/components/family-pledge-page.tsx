"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pause, Play, Square, Volume2 } from "lucide-react";

import { LibraryHeader } from "@/components/library-header";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SessionPayload } from "@/lib/auth";
import {
  getFamilyPledgeAudioUrl,
  getFamilyPledgeItems,
  type FamilyPledgeScript,
} from "@/lib/family-pledge";

type FamilyPledgePageProps = {
  session: SessionPayload;
};

function hasKoreanAudio(script: FamilyPledgeScript) {
  return script === "hangul" || script === "romanized";
}

export function FamilyPledgePage({ session }: FamilyPledgePageProps) {
  const { language, t } = useLocale();
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const [script, setScript] = useState<FamilyPledgeScript>("locale");
  const [playingNumber, setPlayingNumber] = useState<number | null>(null);
  const [playingAll, setPlayingAll] = useState(false);
  const items = getFamilyPledgeItems(script, language);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<number[]>([]);

  const stopAudio = () => {
    queueRef.current = [];
    setPlayingAll(false);
    setPlayingNumber(null);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  };

  const playNumber = (number: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.src = getFamilyPledgeAudioUrl(number);
    void audio.play().then(() => {
      setPlayingNumber(number);
    });
  };

  const playItem = (number: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (playingNumber === number && !audio.paused) {
      audio.pause();
      setPlayingNumber(null);
      setPlayingAll(false);
      queueRef.current = [];
      return;
    }

    queueRef.current = [];
    setPlayingAll(false);
    playNumber(number);
  };

  const playAll = () => {
    if (playingAll) {
      stopAudio();
      return;
    }

    queueRef.current = items.slice(1).map((item) => item.number);
    setPlayingAll(true);
    playNumber(1);
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleEnded = () => {
      const next = queueRef.current.shift();

      if (next) {
        playNumber(next);
        return;
      }

      setPlayingNumber(null);
      setPlayingAll(false);
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!hasKoreanAudio(script)) {
      stopAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <LibraryHeader
        title={t.header.familyPledgeTitle}
        subtitle={t.header.familyPledgeSubtitle(firstName)}
        fullName={session.fullName}
        showBackToLibrary
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/biblioteca/ferramentas">
              <ArrowLeft className="h-4 w-4" />
              {t.familyPledge.backToTools}
            </Link>
          </Button>
          {hasKoreanAudio(script) ? (
            <Button type="button" variant="outline" size="sm" onClick={playAll}>
              {playingAll ? (
                <>
                  <Square className="h-4 w-4" />
                  {t.familyPledge.stopAudio}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {t.familyPledge.playAll}
                </>
              )}
            </Button>
          ) : null}
        </div>

        <section className="mb-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            {t.familyPledge.brand}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            {t.familyPledge.heading}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t.familyPledge.description}
          </p>
        </section>

        <Tabs
          value={script}
          onValueChange={(value) => setScript(value as FamilyPledgeScript)}
          className="mb-8"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="locale" className="flex-1">
              {t.familyPledge.localeLabel}
            </TabsTrigger>
            <TabsTrigger value="romanized" className="flex-1">
              {t.familyPledge.romanizedLabel}
            </TabsTrigger>
            <TabsTrigger value="hangul" className="flex-1">
              {t.familyPledge.hangulLabel}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ol className="space-y-4">
          {items.map((item) => {
            const isPlaying = playingNumber === item.number;
            const cardClassName = isPlaying
              ? "w-full rounded-2xl border border-primary/50 bg-primary/10 p-5 text-left shadow-card transition-colors"
              : "w-full rounded-2xl border border-border/60 bg-card p-5 text-left shadow-card transition-colors hover:bg-secondary/40";

            const content = (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                    {t.familyPledge.item(item.number)}
                  </p>
                  {hasKoreanAudio(script) ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          {t.familyPledge.playingItem}
                        </>
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </span>
                  ) : null}
                </div>
                <p
                  className={
                    script === "hangul"
                      ? "mt-2 text-lg leading-relaxed text-foreground"
                      : "mt-2 text-base leading-relaxed text-foreground"
                  }
                >
                  {item.text}
                </p>
              </>
            );

            return (
              <li key={`${script}-${item.number}`}>
                {hasKoreanAudio(script) ? (
                  <button
                    type="button"
                    onClick={() => playItem(item.number)}
                    className={cardClassName}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={cardClassName}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
