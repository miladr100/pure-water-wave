import bookEn from "@/lib/divine-principle-index-en.json";
import bookEs from "@/lib/divine-principle-index-es.json";
import bookPt from "@/lib/divine-principle-index-pt.json";
import {
  divinePrincipleHref,
  type DivinePrincipleNavItem,
  type DivinePrincipleView,
} from "@/lib/divine-principle-index-path";
import type { UserLanguage } from "@/lib/user-languages";

export type { DivinePrincipleNavItem, DivinePrincipleView };
export { divinePrincipleHref };

export type DivinePrincipleNode = {
  id: string;
  title: string;
  paragraphs?: string[];
  children?: DivinePrincipleNode[];
};

type DivinePrincipleBook = {
  title: string;
  edition: string;
  nodes: DivinePrincipleNode[];
  pdfId: string | null;
};

const BOOKS: Record<UserLanguage, DivinePrincipleBook> = {
  pt: {
    title: bookPt.title,
    edition: bookPt.edition,
    nodes: bookPt.nodes as DivinePrincipleNode[],
    pdfId: "principio-divino-pt",
  },
  en: {
    title: bookEn.title,
    edition: bookEn.edition,
    nodes: bookEn.nodes as DivinePrincipleNode[],
    pdfId: null,
  },
  es: {
    title: bookEs.title,
    edition: bookEs.edition,
    nodes: bookEs.nodes as DivinePrincipleNode[],
    pdfId: "principio-divino-es",
  },
};

function getBook(language: UserLanguage = "pt"): DivinePrincipleBook {
  return BOOKS[language] ?? BOOKS.pt;
}

function walk(
  nodes: DivinePrincipleNode[],
  visit: (node: DivinePrincipleNode, parent: DivinePrincipleNode | null) => void,
  parent: DivinePrincipleNode | null = null,
) {
  for (const node of nodes) {
    visit(node, parent);
    if (node.children?.length) {
      walk(node.children, visit, node);
    }
  }
}

function findNode(
  id: string,
  book: DivinePrincipleBook,
): DivinePrincipleNode | null {
  if (!id) {
    return {
      id: "",
      title: book.title,
      children: book.nodes,
    };
  }

  let found: DivinePrincipleNode | null = null;
  walk(book.nodes, (node) => {
    if (node.id === id) found = node;
  });
  return found;
}

function usableParagraphs(paragraphs?: string[]) {
  return (paragraphs ?? [])
    .map((paragraph) =>
      paragraph
        .replace(/^(?:\d+\.)+\d+\.?\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .replace(/^(?:[A-ZÁÉÍÓÚÂÊÔÃÕÀÑ]\s+){3,}/, "")
        .trim(),
    )
    .filter((paragraph) => paragraph.replace(/\s/g, "").length > 80);
}

function toNavItem(node: DivinePrincipleNode): DivinePrincipleNavItem {
  return {
    id: node.id,
    title: node.title,
    hasChildren: Boolean(node.children?.length),
    hasText: usableParagraphs(node.paragraphs).length > 0,
  };
}

function siblingIds(
  parent: DivinePrincipleNode | null,
  currentId: string,
  book: DivinePrincipleBook,
) {
  const siblings = parent?.children ?? book.nodes;
  const index = siblings.findIndex((node) => node.id === currentId);
  return {
    previousId: index > 0 ? siblings[index - 1].id : null,
    nextId:
      index >= 0 && index < siblings.length - 1 ? siblings[index + 1].id : null,
  };
}

function leafIds(book: DivinePrincipleBook) {
  const ids: string[] = [];
  walk(book.nodes, (node) => {
    if (!node.children?.length) ids.push(node.id);
  });
  return ids;
}

export function getDivinePrinciplePathIds(language: UserLanguage = "pt") {
  const ids: string[] = [];
  walk(getBook(language).nodes, (node) => {
    ids.push(node.id);
  });
  return ids;
}

export function pathToDivinePrincipleId(path?: string[]) {
  if (!path?.length) return "";
  return path.join("/");
}

export function getDivinePrincipleView(
  path?: string[],
  language: UserLanguage = "pt",
): DivinePrincipleView | null {
  const book = getBook(language);
  const id = pathToDivinePrincipleId(path);
  const node = findNode(id, book);

  if (!node) {
    return null;
  }

  const root: DivinePrincipleNode = {
    id: "",
    title: book.title,
    children: book.nodes,
  };

  let parent: DivinePrincipleNode | undefined;
  if (id) {
    walk(book.nodes, (current, currentParent) => {
      if (current.id === id) parent = currentParent ?? root;
    });
  }

  const breadcrumbs: DivinePrincipleNavItem[] = [];
  if (id) {
    const segments = id.split("/");
    for (let index = 0; index < segments.length; index += 1) {
      const crumbId = segments.slice(0, index + 1).join("/");
      const crumb = findNode(crumbId, book);
      if (crumb) breadcrumbs.push(toNavItem(crumb));
    }
  }

  const siblings = siblingIds(id ? parent ?? null : null, id, book);
  const leaves = leafIds(book);
  const leafIndex = leaves.indexOf(id);

  return {
    id: node.id,
    title: node.title,
    bookTitle: book.title,
    edition: book.edition,
    pdfId: book.pdfId,
    paragraphs: usableParagraphs(node.paragraphs),
    children: (node.children ?? []).map(toNavItem),
    breadcrumbs,
    parentId: id ? (parent?.id ?? "") : null,
    previousId: id ? siblings.previousId : null,
    nextId: id ? siblings.nextId : null,
    previousLeafId: leafIndex > 0 ? leaves[leafIndex - 1] : null,
    nextLeafId:
      leafIndex >= 0 && leafIndex < leaves.length - 1
        ? leaves[leafIndex + 1]
        : null,
  };
}
