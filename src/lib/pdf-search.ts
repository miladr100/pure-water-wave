import type { PDFDocumentProxy } from "pdfjs-dist";

export type PdfSearchMatch = {
  pageNumber: number;
  matchIndex: number;
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export async function searchPdfDocument(pdf: PDFDocumentProxy, query: string) {
  const normalizedQuery = normalizeSearchText(query.trim());

  if (!normalizedQuery) {
    return [];
  }

  const results: PdfSearchMatch[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    const normalizedPageText = normalizeSearchText(pageText);

    let startIndex = normalizedPageText.indexOf(normalizedQuery);

    while (startIndex !== -1) {
      results.push({ pageNumber, matchIndex: startIndex });
      startIndex = normalizedPageText.indexOf(
        normalizedQuery,
        startIndex + normalizedQuery.length,
      );
    }
  }

  return results;
}

export function mapNormalizedIndexToOriginal(
  original: string,
  normalizedIndex: number,
) {
  if (normalizedIndex <= 0) {
    return 0;
  }

  const normalized = normalizeSearchText(original);

  if (normalizedIndex >= normalized.length) {
    return original.length;
  }

  for (let i = 0; i <= original.length; i++) {
    if (normalizeSearchText(original.slice(0, i)).length >= normalizedIndex) {
      return i;
    }
  }

  return original.length;
}

export function extractSnippetAroundMatch(
  pageText: string,
  query: string,
  normalizedMatchIndex: number,
  contextLength = 120,
) {
  const normalizedQuery = normalizeSearchText(query.trim());

  if (!normalizedQuery) {
    return "";
  }

  const matchStart = mapNormalizedIndexToOriginal(pageText, normalizedMatchIndex);
  const matchEnd = mapNormalizedIndexToOriginal(
    pageText,
    normalizedMatchIndex + normalizedQuery.length,
  );
  const start = Math.max(0, matchStart - contextLength);
  const end = Math.min(pageText.length, matchEnd + contextLength);

  let snippet = pageText.slice(start, end).replace(/\s+/g, " ").trim();

  if (start > 0) {
    snippet = `…${snippet}`;
  }

  if (end < pageText.length) {
    snippet = `${snippet}…`;
  }

  return snippet;
}

export function getSnippetHighlightParts(snippet: string, query: string) {
  const normalizedQuery = normalizeSearchText(query.trim());

  if (!normalizedQuery) {
    return { before: snippet, match: "", after: "" };
  }

  const normalizedSnippet = normalizeSearchText(snippet);
  const matchIndex = normalizedSnippet.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return { before: snippet, match: "", after: "" };
  }

  const start = mapNormalizedIndexToOriginal(snippet, matchIndex);
  const end = mapNormalizedIndexToOriginal(
    snippet,
    matchIndex + normalizedQuery.length,
  );

  return {
    before: snippet.slice(0, start),
    match: snippet.slice(start, end),
    after: snippet.slice(end),
  };
}

export function highlightPdfText(str: string, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery || !normalizeSearchText(str).includes(normalizedQuery)) {
    return str;
  }

  return `<mark class="pdf-search-highlight">${str}</mark>`;
}
