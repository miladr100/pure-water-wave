"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clapperboard, NotebookPen } from "lucide-react";

import { LibraryHeader } from "@/components/library-header";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LIBRARY_TOOLS, type LibraryTool } from "@/lib/library-tools";
import type { SessionPayload } from "@/lib/auth";

type LibraryToolsPageProps = {
  session: SessionPayload;
};

function toolCopy(
  tool: LibraryTool,
  t: ReturnType<typeof useLocale>["t"],
) {
  if (tool.id === "hj-journal") {
    return {
      name: t.tools.hjJournalName,
      description: t.tools.hjJournalDescription,
    };
  }

  if (tool.id === "hdh-meditation") {
    return {
      name: t.tools.hdhName,
      description: t.tools.hdhDescription,
    };
  }

  if (tool.id === "video-support-manual") {
    return {
      name: t.tools.videoManualName,
      description: t.tools.videoManualDescription,
    };
  }

  return { name: tool.id, description: "" };
}

function ToolIcon({ icon }: { icon: LibraryTool["icon"] }) {
  if (icon === "journal") {
    return <NotebookPen className="h-8 w-8" />;
  }

  if (icon === "hdh") {
    return <BookOpen className="h-8 w-8" />;
  }

  if (icon === "videos") {
    return <Clapperboard className="h-8 w-8" />;
  }

  return null;
}

export function LibraryToolsPage({ session }: LibraryToolsPageProps) {
  const { t } = useLocale();
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <LibraryHeader
        title={t.header.toolsTitle}
        subtitle={t.header.toolsSubtitle(firstName)}
        fullName={session.fullName}
        showToolsLink={false}
        showBackToLibrary
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            {t.tools.heading}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t.tools.description}
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {LIBRARY_TOOLS.map((tool) => {
            const copy = toolCopy(tool, t);

            return (
              <Card
                key={tool.id}
                className="flex h-full flex-col overflow-hidden border-border/60 shadow-card"
              >
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-sky-500/90 to-primary text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                    <ToolIcon icon={tool.icon} />
                  </div>
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="font-display text-xl leading-tight">
                    {copy.name}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {copy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href={tool.href}>
                      {t.tools.open}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}
