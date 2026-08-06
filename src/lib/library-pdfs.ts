import {
  USER_LANGUAGE_LABELS,
  type UserLanguage,
} from "@/lib/user-languages";

export type LibraryPdfFolder = "PT" | "ES";

export type LibraryPdf = {
  id: string;
  title: string;
  subtitle: string;
  /** Código da língua do livro (pt | es). */
  language: Extract<UserLanguage, "pt" | "es">;
  /** Pasta em content/pdfs/. */
  folder: LibraryPdfFolder;
  filename: string;
  coverColor: string;
  /** Id usado na prévia; se omitido, usa o próprio id. */
  previewId?: string;
};

const COVER_COLOR = "from-primary-deep to-primary";

export const LIBRARY_PDFS: LibraryPdf[] = [
  // Português
  {
    id: "principio-divino-pt",
    title: "Princípio Divino",
    subtitle: "7ª Edição 2014",
    language: "pt",
    folder: "PT",
    filename: "Principio Divino 7ª Edição 2014_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "guia-estudo-principio-divino-pt",
    title: "Guia de Estudo do Princípio Divino (Q&A)",
    subtitle: "Perguntas e respostas",
    language: "pt",
    folder: "PT",
    filename: "Guia de Estudo do Princípio Divino (Q&A)_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "novas-essencias-unificacao-pt",
    title: "Novas Essências do Pensamento de Unificação",
    subtitle: "Pensamento de Unificação",
    language: "pt",
    folder: "PT",
    filename: "Novas Essencias do Pensamento de Unificacao_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "epopeia-povo-han-pt",
    title: "A Epopeia da História do Povo Han Escolhido da Coreia",
    subtitle: "História e formação",
    language: "pt",
    folder: "PT",
    filename: "A Epopeia da História do Povo Han Escolhido da Coreia_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "vontade-de-deus-e-o-mundo-pt",
    title: "A Vontade de Deus e o Mundo",
    subtitle: "Formação pastoral",
    language: "pt",
    folder: "PT",
    filename: "A Vontade de Deus e o Mundo_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "filha-unigenita-pt",
    title: "A Filha Unigênita — a Verdadeira Mãe — nas Palavras dos Verdadeiros Pais",
    subtitle: "Verdadeiros Pais",
    language: "pt",
    folder: "PT",
    filename:
      "A Filha Unigênita - a Verdadeira Mãe - nas Palavras dos Verdadeiros Pais_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "valor-verdadeiros-pais-pt",
    title: "O Valor dos Verdadeiros Pais na Providência do Céu",
    subtitle: "Providência celestial",
    language: "pt",
    folder: "PT",
    filename: "O Valor dos Verdadeiros Pais na Providência do Céu_PT.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "biblia-sagrada-pt",
    title: "Bíblia Sagrada",
    subtitle: "Edição em português",
    language: "pt",
    folder: "PT",
    filename: "Bíblia Sagrada_PT.pdf",
    coverColor: COVER_COLOR,
  },

  // Espanhol
  {
    id: "principio-divino-es",
    title: "Principio Divino",
    subtitle: "Edición en español",
    language: "es",
    folder: "ES",
    filename: "Principio Divino_ES.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "guia-estudo-principio-divino-es",
    title: "Guía de Estudio del Principio Divino (Q&A)",
    subtitle: "Preguntas y respuestas",
    language: "es",
    folder: "ES",
    filename: "Guía de Estudio del Principio Divino (Q&A)_ES.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "epopeia-povo-han-es",
    title: "La epopeya de la historia del pueblo Han elegido de Corea",
    subtitle: "Historia y formación",
    language: "es",
    folder: "ES",
    filename: "La epopeya de la historia del pueblo Han elegido de Corea_ES.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "vontade-de-deus-e-o-mundo-es",
    title: "La Voluntad de Dios y el Mundo",
    subtitle: "Formación pastoral",
    language: "es",
    folder: "ES",
    filename: "La Voluntad de Dios y el Mundo_ES.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "filha-unigenita-es",
    title:
      "La Hija Unigénita — la Madre Verdadera — en las Palabras de los Padres Verdaderos",
    subtitle: "Padres Verdaderos",
    language: "es",
    folder: "ES",
    filename:
      "La Hija Unigénita - la Madre Verdadera - en las Palabras de los Padres Verdaderos_ES.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "valor-verdadeiros-pais-es",
    title: "El Valor de los Padres Verdaderos en la Providencia del Cielo",
    subtitle: "Providencia celestial",
    language: "es",
    folder: "ES",
    filename:
      "El Valor de los Padres Verdaderos en la Providencia del Cielo_ES.pdf",
    coverColor: COVER_COLOR,
  },
  {
    id: "biblia-sagrada-es",
    title: "La Santa Biblia",
    subtitle: "Edición en español",
    language: "es",
    folder: "ES",
    filename: "La Santa Biblia_ES.pdf",
    coverColor: COVER_COLOR,
  },
];

/** Inglês ainda não tem pasta EN; usa os livros em português. */
export function resolveLibraryContentLanguage(
  language: UserLanguage,
): Extract<UserLanguage, "pt" | "es"> {
  return language === "es" ? "es" : "pt";
}

export function getLibraryPdfsByLanguage(language: UserLanguage) {
  const contentLanguage = resolveLibraryContentLanguage(language);
  return LIBRARY_PDFS.filter((pdf) => pdf.language === contentLanguage);
}

export function getLibraryPdfById(id: string) {
  return LIBRARY_PDFS.find((pdf) => pdf.id === id) ?? null;
}

export function getLibraryPdfLanguageLabel(pdf: LibraryPdf) {
  return USER_LANGUAGE_LABELS[pdf.language];
}

export function getProtectedPdfApiUrl(id: string) {
  return `/api/biblioteca/pdf/${id}`;
}

export function getLibraryPdfReaderPath(id: string) {
  return `/biblioteca/ler/${id}`;
}

export function getLibraryPdfPreviewUrl(pdf: LibraryPdf | string) {
  const previewId =
    typeof pdf === "string" ? pdf : (pdf.previewId ?? pdf.id);
  return `/library-previews/${previewId}.jpg`;
}
