"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Loader2, Send, Sparkles } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { BrandLogo } from "@/components/brand-logo";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SessionPayload } from "@/lib/auth";
import type { LibraryAskCitation } from "@/lib/library-ask";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: LibraryAskCitation[];
};

type LibraryAiChatProps = {
  session: SessionPayload;
};

export function LibraryAiChat({ session }: LibraryAiChatProps) {
  const { language, t } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: t.aiChat.welcome,
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.id === "welcome") {
        return [{ ...current[0], content: t.aiChat.welcome }];
      }

      return current;
    });
  }, [language, t.aiChat.welcome]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = question.trim();

    if (!trimmed || isAsking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsAsking(true);
    setError(null);

    try {
      const response = await fetch("/api/biblioteca/ask", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error(t.aiChat.invalidResponse);
      }

      const data = (await response.json()) as {
        error?: string;
        answer?: string;
        citations?: LibraryAskCitation[];
      };

      if (!response.ok) {
        throw new Error(data.error ?? t.aiChat.failed);
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer ?? t.aiChat.noAnswer,
          citations: data.citations ?? [],
        },
      ]);
    } catch (askError) {
      const message =
        askError instanceof Error ? askError.message : t.aiChat.failed;

      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: t.aiChat.errorReply(message),
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-secondary/30 to-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-primary-deep">
                {t.aiChat.title}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {t.aiChat.subtitle(session.fullName)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/biblioteca">
                <ArrowLeft className="h-4 w-4" />
                {t.common.library}
              </Link>
            </Button>
            <LanguageSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          {t.aiChat.banner}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/60 bg-card text-foreground"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.aiChat.assistant}
                  </div>
                ) : null}

                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.citations && message.citations.length > 0 ? (
                  <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t.aiChat.sources}
                    </p>
                    <ul className="space-y-2">
                      {message.citations.map((citation) => (
                        <li key={`${citation.pdfId}-${citation.pageNumber}`}>
                          <Link
                            href={citation.readerUrl}
                            className="block rounded-xl border border-border/50 bg-background/70 p-3 transition-colors hover:border-primary/40 hover:bg-secondary/40"
                          >
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-deep">
                              <BookOpen className="h-3.5 w-3.5" />
                              {citation.pdfTitle} · p. {citation.pageNumber}
                            </span>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {citation.snippet}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {isAsking ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {t.aiChat.thinking}
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-sm backdrop-blur"
        >
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={t.aiChat.placeholder}
            rows={3}
            disabled={isAsking}
            className="min-h-[84px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : (
                t.aiChat.sendHint
              )}
            </p>
            <Button type="submit" disabled={isAsking || !question.trim()}>
              {isAsking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.aiChat.sending}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t.aiChat.ask}
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
