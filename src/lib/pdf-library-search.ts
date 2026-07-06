import { readFile } from "fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

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

async function searchSinglePdf(
  pdfMeta: LibraryPdf,
  normalizedQuery: string,
  query: string,
  remainingSlots: number,
) {
  const filePath = getLibraryPdfFilePath(pdfMeta.id);

  if (!filePath || remainingSlots <= 0) {
    return [];
  }

  const buffer = await readFile(filePath);
  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  }).promise;

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
