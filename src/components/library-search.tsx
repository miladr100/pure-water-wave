"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLibraryPdfReaderPath } from "@/lib/library-pdfs";
import { getSnippetHighlightParts } from "@/lib/pdf-search";
import type { LibrarySearchResult } from "@/lib/pdf-library-search";

function SearchResultSnippet({ snippet, query }: { snippet: string; query: string }) {
  const { before, match, after } = getSnippetHighlightParts(snippet, query);

  if (!match) {
    return <span>{snippet}</span>;
  }

  return (
    <span>
      {before}
      <mark className="rounded-sm bg-amber-200/50 px-0.5 text-foreground ring-1 ring-amber-500/60 dark:bg-amber-500/25">
        {match}
      </mark>
      {after}
    </span>
  );
}

function buildReaderUrl(result: LibrarySearchResult, query: string) {
  const params = new URLSearchParams({
    page: String(result.pageNumber),
    q: query,
  });

  return `${getLibraryPdfReaderPath(result.pdfId)}?${params.toString()}`;
}

export function LibrarySearch() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState<LibrarySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setActiveQuery("");
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/biblioteca/search?q=${encodeURIComponent(trimmedQuery)}`,
      );
      const data = (await response.json()) as {
        error?: string;
        results?: LibrarySearchResult[];
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível buscar");
      }

      setActiveQuery(trimmedQuery);
      setResults(data.results ?? []);
      setHasSearched(true);
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Não foi possível buscar",
      );
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }

  const statusMessage = hasSearched
    ? error
      ? null
      : results.length > 0
        ? `${results.length} ocorrência${results.length === 1 ? "" : "s"} encontrada${results.length === 1 ? "" : "s"}`
        : `Nenhum resultado para “${activeQuery}”`
    : null;

  return (
    <section className="mb-10 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-primary-deep">
          Buscar em todos os livros
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pesquise um termo e veja em qual livro e trecho ele aparece.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Digite um termo ou frase..."
            className="pl-9"
            disabled={isSearching}
          />
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      ) : null}

      {statusMessage ? (
        <p className="mt-3 text-sm text-muted-foreground">{statusMessage}</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {results.map((result, index) => (
            <li key={`${result.pdfId}-${result.pageNumber}-${index}`}>
              <Link
                href={buildReaderUrl(result, activeQuery)}
                className="block rounded-xl border border-border/60 bg-background/80 p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium text-primary-deep">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    {result.pdfTitle}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{result.pdfSubtitle}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    Página {result.pageNumber}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  <SearchResultSnippet snippet={result.snippet} query={activeQuery} />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
