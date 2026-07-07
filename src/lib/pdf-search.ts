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

export type PageHighlightLayout = {
  items: Array<{
    str: string;
    itemIndex: number;
    normStart: number;
    normEnd: number;
  }>;
  normalizedQuery: string;
  pageMatches: Array<PdfSearchMatch & { globalIndex: number }>;
  activeGlobalIndex: number;
};

export async function buildPageHighlightLayout(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  query: string,
  searchResults: PdfSearchMatch[],
  currentResultIndex: number,
): Promise<PageHighlightLayout | null> {
  const normalizedQuery = normalizeSearchText(query.trim());

  if (!normalizedQuery) {
    return null;
  }

  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();

  let normOffset = 0;
  const items = content.items.map((item, itemIndex) => {
    const str = "str" in item ? item.str : "";
    const normStart = normOffset;
    const normPart = normalizeSearchText(str);
    normOffset += normPart.length;

    if (itemIndex < content.items.length - 1) {
      normOffset += 1;
    }

    return { str, itemIndex, normStart, normEnd: normOffset };
  });

  const pageMatches = searchResults
    .map((match, globalIndex) => ({ ...match, globalIndex }))
    .filter((match) => match.pageNumber === pageNumber);

  const activeMatch = searchResults[currentResultIndex];
  const activeGlobalIndex =
    activeMatch?.pageNumber === pageNumber ? currentResultIndex : -1;

  return {
    items,
    normalizedQuery,
    pageMatches,
    activeGlobalIndex,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyHighlightRanges(
  value: string,
  ranges: Array<{ start: number; end: number; isActive: boolean }>,
) {
  if (ranges.length === 0) {
    return escapeHtml(value);
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let result = "";
  let cursor = 0;

  for (const range of sorted) {
    const start = Math.max(0, Math.min(value.length, range.start));
    const end = Math.max(start, Math.min(value.length, range.end));

    if (end <= start) {
      continue;
    }

    result += escapeHtml(value.slice(cursor, start));
    const className = range.isActive
      ? "pdf-search-highlight-active"
      : "pdf-search-highlight";
    result += `<mark class="${className}">${escapeHtml(value.slice(start, end))}</mark>`;
    cursor = end;
  }

  result += escapeHtml(value.slice(cursor));
  return result;
}

export function highlightPdfTextItem(
  str: string,
  itemIndex: number,
  layout: PageHighlightLayout,
) {
  const item = layout.items[itemIndex];

  if (!item || !layout.normalizedQuery) {
    return escapeHtml(str);
  }

  const ranges: Array<{ start: number; end: number; isActive: boolean }> = [];

  for (const match of layout.pageMatches) {
    const matchStart = match.matchIndex;
    const matchEnd = matchStart + layout.normalizedQuery.length;

    if (matchStart >= item.normEnd || matchEnd <= item.normStart) {
      continue;
    }

    const relativeNormStart = Math.max(0, matchStart - item.normStart);
    const relativeNormEnd = Math.min(
      normalizeSearchText(str).length,
      matchEnd - item.normStart,
    );
    const start = mapNormalizedIndexToOriginal(str, relativeNormStart);
    const end = mapNormalizedIndexToOriginal(str, relativeNormEnd);

    ranges.push({
      start,
      end,
      isActive: match.globalIndex === layout.activeGlobalIndex,
    });
  }

  if (ranges.length === 0) {
    return escapeHtml(str);
  }

  return applyHighlightRanges(str, ranges);
}

export function highlightPdfText(str: string, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery || !normalizeSearchText(str).includes(normalizedQuery)) {
    return escapeHtml(str);
  }

  const matchIndex = normalizeSearchText(str).indexOf(normalizedQuery);
  const start = mapNormalizedIndexToOriginal(str, matchIndex);
  const end = mapNormalizedIndexToOriginal(
    str,
    matchIndex + normalizedQuery.length,
  );

  return applyHighlightRanges(str, [{ start, end, isActive: true }]);
}
