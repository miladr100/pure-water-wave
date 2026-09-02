export type DivinePrincipleNavItem = {
  id: string;
  title: string;
  hasChildren: boolean;
  hasText: boolean;
};

export type DivinePrincipleView = {
  id: string;
  title: string;
  bookTitle: string;
  edition: string;
  pdfId: string | null;
  paragraphs: string[];
  children: DivinePrincipleNavItem[];
  breadcrumbs: DivinePrincipleNavItem[];
  parentId: string | null;
  previousId: string | null;
  nextId: string | null;
  previousLeafId: string | null;
  nextLeafId: string | null;
};

export function divinePrincipleHref(id = "") {
  return id
    ? `/biblioteca/ferramentas/principio-divino-indexado/${id}`
    : "/biblioteca/ferramentas/principio-divino-indexado";
}

