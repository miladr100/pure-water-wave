"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  ListTree,
} from "lucide-react";

import { LibraryHeader } from "@/components/library-header";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import type { SessionPayload } from "@/lib/auth";
import {
  divinePrincipleHref,
  type DivinePrincipleView,
} from "@/lib/divine-principle-index-path";
import { getLibraryPdfReaderPath } from "@/lib/library-pdfs";

type DivinePrincipleIndexPageProps = {
  session: SessionPayload;
  view: DivinePrincipleView;
};

export function DivinePrincipleIndexPage({
  session,
  view,
}: DivinePrincipleIndexPageProps) {
  const { t } = useLocale();
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const isRoot = view.id === "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <LibraryHeader
        title={t.header.dpIndexTitle}
        subtitle={t.header.dpIndexSubtitle(firstName)}
        fullName={session.fullName}
        showBackToLibrary
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link
              href={
                isRoot
                  ? "/biblioteca/ferramentas"
                  : divinePrincipleHref(view.parentId ?? "")
              }
            >
              <ArrowLeft className="h-4 w-4" />
              {isRoot ? t.dpIndex.backToTools : t.dpIndex.backToIndex}
            </Link>
          </Button>
          {view.pdfId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={getLibraryPdfReaderPath(view.pdfId)}>
                <BookOpen className="h-4 w-4" />
                {t.dpIndex.openPdf}
              </Link>
            </Button>
          ) : null}
        </div>

        <section className="mb-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            {t.dpIndex.brand}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            {isRoot ? t.dpIndex.heading : view.title}
          </h1>
          {isRoot ? (
            <p className="mt-3 text-muted-foreground">
              {t.dpIndex.description} {view.bookTitle} · {view.edition}.
            </p>
          ) : null}

          {!isRoot && view.breadcrumbs.length > 1 ? (
            <nav className="mt-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <Link
                href={divinePrincipleHref()}
                className="hover:text-primary hover:underline"
              >
                {t.dpIndex.heading}
              </Link>
              {view.breadcrumbs.slice(0, -1).map((crumb) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5" />
                  <Link
                    href={divinePrincipleHref(crumb.id)}
                    className="hover:text-primary hover:underline"
                  >
                    {crumb.title}
                  </Link>
                </span>
              ))}
            </nav>
          ) : null}
        </section>

        {view.paragraphs.length > 0 ? (
          <article className="mb-10 space-y-5 text-base leading-relaxed text-foreground">
            {view.paragraphs.map((paragraph, index) => (
              <p key={`${view.id}-${index}`}>{paragraph}</p>
            ))}
          </article>
        ) : null}

        {view.children.length > 0 ? (
          <section className="space-y-2">
            {!isRoot && view.paragraphs.length > 0 ? (
              <h2 className="mb-4 font-display text-lg font-semibold text-primary-deep">
                {t.dpIndex.subindex}
              </h2>
            ) : null}
            <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
              {view.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={divinePrincipleHref(child.id)}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-secondary/50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ListTree className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-primary-deep">
                        {child.title}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {child.hasChildren
                          ? t.dpIndex.openSubindex
                          : t.dpIndex.readText}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!isRoot && (view.previousId || view.nextId || view.previousLeafId || view.nextLeafId) ? (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
            {view.children.length > 0 ? (
              <>
                {view.previousId ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={divinePrincipleHref(view.previousId)}>
                      <ArrowLeft className="h-4 w-4" />
                      {t.dpIndex.previous}
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                {view.nextId ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={divinePrincipleHref(view.nextId)}>
                      {t.dpIndex.next}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                {view.previousLeafId ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={divinePrincipleHref(view.previousLeafId)}>
                      <ArrowLeft className="h-4 w-4" />
                      {t.dpIndex.previous}
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                {view.nextLeafId ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={divinePrincipleHref(view.nextLeafId)}>
                      {t.dpIndex.next}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
