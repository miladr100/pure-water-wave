import { readFile } from "fs/promises";
import path from "path";

import { getLibraryPdfFilePath } from "@/lib/library-pdf-files";
import { LIBRARY_PDFS, type LibraryPdf } from "@/lib/library-pdfs";
import {
  extractSnippetAroundMatch,
  normalizeSearchText,
} from "@/lib/pdf-search";

export type LibrarySearchResult = {
  pdfId: string;
  pdfTitle: string;
  pdfSubtitle: string;
  pageNumber: number;
  snippet: string;
};

export const MAX_LIBRARY_SEARCH_RESULTS = 50;

const SEARCH_INDEX_DIR = path.join(process.cwd(), "content", "search-index");

type SearchIndexPage = {
  pageNumber: number;
  text: string;
};

type SearchIndex = {
  pages: SearchIndexPage[];
};

async function loadSearchIndex(pdfId: string) {
  try {
    const indexPath = path.join(SEARCH_INDEX_DIR, `${pdfId}.json`);
    const raw = await readFile(indexPath, "utf-8");
    return JSON.parse(raw) as SearchIndex;
  } catch {
    return null;
  }
}

async function loadPdfDocument(pdfId: string) {
  const filePath = getLibraryPdfFilePath(pdfId);

  if (!filePath) {
    return null;
  }

  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const buffer = await readFile(filePath);

  return getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  }).promise;
}

function collectMatchesFromPages(
  pdfMeta: LibraryPdf,
  pages: SearchIndexPage[],
  normalizedQuery: string,
  query: string,
  remainingSlots: number,
) {
  const results: LibrarySearchResult[] = [];

  for (const page of pages) {
    if (results.length >= remainingSlots) {
      break;
    }

    const normalizedPageText = normalizeSearchText(page.text);
    let matchIndex = normalizedPageText.indexOf(normalizedQuery);

    while (matchIndex !== -1 && results.length < remainingSlots) {
      results.push({
        pdfId: pdfMeta.id,
        pdfTitle: pdfMeta.title,
        pdfSubtitle: pdfMeta.subtitle,
        pageNumber: page.pageNumber,
        snippet: extractSnippetAroundMatch(page.text, query, matchIndex),
      });

      matchIndex = normalizedPageText.indexOf(
        normalizedQuery,
        matchIndex + normalizedQuery.length,
      );
    }
  }

  return results;
}

async function searchSinglePdfFromIndex(
  pdfMeta: LibraryPdf,
  normalizedQuery: string,
  query: string,
  remainingSlots: number,
) {
  const index = await loadSearchIndex(pdfMeta.id);

  if (!index) {
    return null;
  }

  return collectMatchesFromPages(
    pdfMeta,
    index.pages,
    normalizedQuery,
    query,
    remainingSlots,
  );
}

async function searchSinglePdfFromFile(
  pdfMeta: LibraryPdf,
  normalizedQuery: string,
  query: string,
  remainingSlots: number,
) {
  const pdf = await loadPdfDocument(pdfMeta.id);

  if (!pdf) {
    return [];
  }

  const results: LibrarySearchResult[] = [];

  try {
    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages && results.length < remainingSlots;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      const normalizedPageText = normalizeSearchText(pageText);
      let matchIndex = normalizedPageText.indexOf(normalizedQuery);

      while (matchIndex !== -1 && results.length < remainingSlots) {
        results.push({
          pdfId: pdfMeta.id,
          pdfTitle: pdfMeta.title,
          pdfSubtitle: pdfMeta.subtitle,
          pageNumber,
          snippet: extractSnippetAroundMatch(pageText, query, matchIndex),
        });

        matchIndex = normalizedPageText.indexOf(
          normalizedQuery,
          matchIndex + normalizedQuery.length,
        );
      }
    }
  } finally {
    await pdf.destroy();
  }

  return results;
}

async function searchSinglePdf(
  pdfMeta: LibraryPdf,
  normalizedQuery: string,
  query: string,
  remainingSlots: number,
) {
  if (remainingSlots <= 0) {
    return [];
  }

  const indexedResults = await searchSinglePdfFromIndex(
    pdfMeta,
    normalizedQuery,
    query,
    remainingSlots,
  );

  if (indexedResults) {
    return indexedResults;
  }

  return searchSinglePdfFromFile(
    pdfMeta,
    normalizedQuery,
    query,
    remainingSlots,
  );
}

export async function searchAllLibraryPdfs(query: string) {
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeSearchText(trimmedQuery);

  if (!normalizedQuery) {
    return [];
  }

  const results: LibrarySearchResult[] = [];

  for (const pdfMeta of LIBRARY_PDFS) {
    const remainingSlots = MAX_LIBRARY_SEARCH_RESULTS - results.length;

    if (remainingSlots <= 0) {
      break;
    }

    const pdfResults = await searchSinglePdf(
      pdfMeta,
      normalizedQuery,
      trimmedQuery,
      remainingSlots,
    );
    results.push(...pdfResults);
  }

  return results;
}
