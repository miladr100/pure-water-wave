export type LibraryPdf = {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  filename: string;
  coverColor: string;
};

export const LIBRARY_PDFS: LibraryPdf[] = [
  {
    id: "principio-divino-pt",
    title: "Princípio Divino",
    subtitle: "7ª Edição 2014",
    language: "Português",
    filename: "Principio Divino 7ª Edição 2014.pdf",
    coverColor: "from-primary-deep to-primary",
  },
  {
    id: "principio-divino-ko",
    title: "Princípio Divino",
    subtitle: "Edição em coreano",
    language: "Coreano",
    filename: "Princípio Divino Coreano.pdf",
    coverColor: "from-primary-deep to-primary",
  },
  {
    id: "principio-divino-es",
    title: "Principio Divino",
    subtitle: "Libro 3 colores",
    language: "Espanhol",
    filename: "Libro Principio Divino 3 Colores Espanhol.pdf",
    coverColor: "from-primary-deep to-primary",
  },
  {
    id: "novas-essencias-unificacao",
    title: "Novas Essências do Pensamento de Unificação",
    subtitle: "Edição atual",
    language: "Português",
    filename: "Novas Essencias do Pensamento de Unificacao atual.pdf",
    coverColor: "from-primary-deep to-primary",
  },
  {
    id: "epopeia-povo-han",
    title: "A Epopeia da História do Povo Han Escolhido da Coreia",
    subtitle: "História e formação",
    language: "Português",
    filename: "A Epopeia da História do Povo Han Escolhido da Coreia.pdf",
    coverColor: "from-primary-deep to-primary",
  },
  {
    id: "vontade-de-deus-e-o-mundo",
    title: "A Vontade de Deus e o Mundo",
    subtitle: "Formação pastoral",
    language: "Português",
    filename: "A vontade de Deus e o Mundo.pdf",
    coverColor: "from-primary-deep to-primary",
  },
  {
    id: "biblia-sagrada-pt",
    title: "Bíblia Sagrada",
    subtitle: "Edição em português",
    language: "Português",
    filename: "Bíblia Sagrada Português.pdf",
    coverColor: "from-primary-deep to-primary",
  },
];

export function getLibraryPdfById(id: string) {
  return LIBRARY_PDFS.find((pdf) => pdf.id === id) ?? null;
}

export function getProtectedPdfApiUrl(id: string) {
  return `/api/biblioteca/pdf/${id}`;
}

export function getLibraryPdfReaderPath(id: string) {
  return `/biblioteca/ler/${id}`;
}

export function getLibraryPdfPreviewUrl(id: string) {
  return `/library-previews/${id}.jpg`;
}
