export type LibraryPdf = {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  filename: string;
  coverColor: string;
};

const COVER_COLOR = "from-primary-deep to-primary";

export const LIBRARY_PDFS: LibraryPdf[] = [
  {
    id: "principio-divino-pt",
    title: "Princípio Divino",
    subtitle: "7ª Edição 2014",
    language: "Português",
    filename: "Principio Divino 7ª Edição 2014_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "guia-estudo-principio-divino-pt",
    title: "Guia de Estudo do Princípio Divino (Q&A)",
    subtitle: "Perguntas e respostas",
    language: "Português",
    filename: "Guia de Estudo do Princípio Divino (Q&A)_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "novas-essencias-unificacao-pt",
    title: "Novas Essências do Pensamento de Unificação",
    subtitle: "Pensamento de Unificação",
    language: "Português",
    filename: "Novas Essencias do Pensamento de Unificacao_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "epopeia-povo-han-pt",
    title: "A Epopeia da História do Povo Han Escolhido da Coreia",
    subtitle: "História e formação",
    language: "Português",
    filename: "A Epopeia da História do Povo Han Escolhido da Coreia_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "vontade-de-deus-e-o-mundo-pt",
    title: "A Vontade de Deus e o Mundo",
    subtitle: "Formação pastoral",
    language: "Português",
    filename: "A Vontade de Deus e o Mundo_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "filha-unigenita-pt",
    title: "A Filha Unigênita — a Verdadeira Mãe — nas Palavras dos Verdadeiros Pais",
    subtitle: "Verdadeiros Pais",
    language: "Português",
    filename:
      "A Filha Unigênita - a Verdadeira Mãe - nas Palavras dos Verdadeiros Pais_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "valor-verdadeiros-pais-pt",
    title: "O Valor dos Verdadeiros Pais na Providência do Céu",
    subtitle: "Providência celestial",
    language: "Português",
    filename: "O Valor dos Verdadeiros Pais na Providência do Céu_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "biblia-sagrada-pt",
    title: "Bíblia Sagrada",
    subtitle: "Edição em português",
    language: "Português",
    filename: "Bíblia Sagrada_PT.pdf",
    coverColor: COVER_COLOR,
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
