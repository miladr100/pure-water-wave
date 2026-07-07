"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Document, Page } from "react-pdf";

import { LogoutButton } from "@/components/logout-button";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getProtectedPdfApiUrl,
  type LibraryPdf,
} from "@/lib/library-pdfs";
import {
  buildPageHighlightLayout,
  highlightPdfTextItem,
  searchPdfDocument,
  type PageHighlightLayout,
  type PdfSearchMatch,
} from "@/lib/pdf-search";
import type { SessionPayload } from "@/lib/auth";
import "@/lib/pdf-worker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

type PdfViewerProps = {
  pdf: LibraryPdf;
  session: SessionPayload;
  initialPage?: number;
  initialQuery?: string;
};

const MIN_SCALE = 0.7;
const MAX_SCALE = 2;
const SCALE_STEP = 0.15;

export function PdfViewer({
  pdf,
  session,
  initialPage,
  initialQuery,
}: PdfViewerProps) {
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [activeQuery, setActiveQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PdfSearchMatch[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [pageHighlightLayout, setPageHighlightLayout] =
    useState<PageHighlightLayout | null>(null);
  const pendingInitialSearch = useRef(initialQuery?.trim() || "");

  const fileSource = useMemo(
    () => ({
      url: getProtectedPdfApiUrl(pdf.id),
      withCredentials: true,
    }),
    [pdf.id],
  );

  useEffect(() => {
    setPageNumber(initialPage && initialPage > 0 ? initialPage : 1);
    setNumPages(0);
    setLoadError(null);
    setSearchQuery(initialQuery ?? "");
    setActiveQuery("");
    setSearchResults([]);
    setCurrentResultIndex(0);
    setPageHighlightLayout(null);
    pendingInitialSearch.current = initialQuery?.trim() || "";
    pdfRef.current = null;
  }, [pdf.id, initialPage, initialQuery]);

  async function runDocumentSearch(
    loadedPdf: PDFDocumentProxy,
    query: string,
    preferredPage?: number,
  ) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setActiveQuery("");
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }

    setIsSearching(true);

    try {
      const results = await searchPdfDocument(loadedPdf, trimmedQuery);
      setActiveQuery(trimmedQuery);
      setSearchResults(results);
      setCurrentResultIndex(0);

      if (results.length === 0) {
        return;
      }

      if (preferredPage) {
        const resultIndex = results.findIndex(
          (result) => result.pageNumber === preferredPage,
        );

        if (resultIndex >= 0) {
          setCurrentResultIndex(resultIndex);
          setPageNumber(preferredPage);
          return;
        }
      }

      setPageNumber(results[0].pageNumber);
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    if (!pdfRef.current || !activeQuery || searchResults.length === 0) {
      setPageHighlightLayout(null);
      return;
    }

    let cancelled = false;

    void buildPageHighlightLayout(
      pdfRef.current,
      pageNumber,
      activeQuery,
      searchResults,
      currentResultIndex,
    ).then((layout) => {
      if (!cancelled) {
        setPageHighlightLayout(layout);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeQuery, pageNumber, searchResults, currentResultIndex, numPages]);

  const customTextRenderer = useCallback(
    ({ str, itemIndex }: { str: string; itemIndex: number }) => {
      if (!pageHighlightLayout) {
        return str;
      }

      return highlightPdfTextItem(str, itemIndex, pageHighlightLayout);
    },
    [pageHighlightLayout],
  );

  function goToPreviousPage() {
    setPageNumber((current) => Math.max(current - 1, 1));
  }

  function goToNextPage() {
    setPageNumber((current) =>
      numPages > 0 ? Math.min(current + 1, numPages) : current + 1,
    );
  }

  function goToSearchResult(index: number) {
    const match = searchResults[index];

    if (!match) {
      return;
    }

    setCurrentResultIndex(index);
    setPageNumber(match.pageNumber);
  }

  function goToPreviousResult() {
    if (searchResults.length === 0) {
      return;
    }

    const nextIndex =
      (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    goToSearchResult(nextIndex);
  }

  function goToNextResult() {
    if (searchResults.length === 0) {
      return;
    }

    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    goToSearchResult(nextIndex);
  }

  async function handleSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      setActiveQuery("");
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }

    if (!pdfRef.current) {
      return;
    }

    await runDocumentSearch(pdfRef.current, query);
  }

  function zoomOut() {
    setScale((current) => Math.max(current - SCALE_STEP, MIN_SCALE));
  }

  function zoomIn() {
    setScale((current) => Math.min(current + SCALE_STEP, MAX_SCALE));
  }

  const searchStatus =
    activeQuery && !isSearching
      ? searchResults.length > 0
        ? `${currentResultIndex + 1} de ${searchResults.length} ocorrências`
        : "Nenhum resultado encontrado"
      : null;

  return (
    <div
      className="flex min-h-screen select-none flex-col bg-gradient-to-b from-background via-secondary/30 to-background"
      onContextMenu={(event) => event.preventDefault()}
    >
      <header className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-primary-deep">
                {pdf.title}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {pdf.subtitle} · {session.fullName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/biblioteca">
                <ArrowLeft className="h-4 w-4" />
                Biblioteca
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="border-b border-border/60 bg-card/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar termo no livro..."
                className="pl-9"
                disabled={isSearching || Boolean(loadError)}
              />
            </div>
            <Button type="submit" disabled={isSearching || Boolean(loadError)}>
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </form>

          {searchStatus ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{searchStatus}</p>
              {searchResults.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousResult}
                  >
                    Ocorrência anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToNextResult}
                  >
                    Próxima ocorrência
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-b border-border/60 bg-card/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-28 text-center text-sm text-muted-foreground">
              Página {pageNumber} de {numPages || "—"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={numPages === 0 || pageNumber >= numPages}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-16 text-center text-sm text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="flex flex-1 justify-center overflow-auto px-4 py-8">
        <div className="w-full max-w-5xl">
          {loadError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
              {loadError}
            </div>
          ) : (
            <Document
              file={fileSource}
              loading={
                <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
                  Carregando material...
                </div>
              }
              onLoadSuccess={(loadedPdf) => {
                pdfRef.current = loadedPdf;
                setNumPages(loadedPdf.numPages);
                setLoadError(null);

                const queryFromUrl = pendingInitialSearch.current;

                if (queryFromUrl) {
                  pendingInitialSearch.current = "";
                  void runDocumentSearch(loadedPdf, queryFromUrl, initialPage);
                } else if (initialPage && initialPage > 0) {
                  setPageNumber(initialPage);
                }
              }}
              onLoadError={() => {
                setLoadError("Não foi possível carregar este material.");
              }}
              error={null}
              className="flex justify-center"
            >
              <Page
                key={`${pdf.id}-${pageNumber}-${scale}-${activeQuery}-${currentResultIndex}`}
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer={false}
                customTextRenderer={
                  activeQuery && pageHighlightLayout
                    ? customTextRenderer
                    : undefined
                }
                className="overflow-hidden rounded-lg bg-white shadow-card"
              />
            </Document>
          )}
        </div>
      </main>
    </div>
  );
}
