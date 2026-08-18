import type { UserLanguage } from "@/lib/user-languages";

export type AppMessages = {
  common: {
    library: string;
    supportMaterials: string;
    logout: string;
    loggingOut: string;
    language: string;
    page: string;
    of: string;
    search: string;
    searching: string;
  };
  header: {
    libraryTitle: string;
    librarySubtitle: (firstName: string) => string;
    supportTitle: string;
    supportSubtitle: (firstName: string) => string;
  };
  dashboard: {
    heading: string;
    description: string;
  };
  aiCta: {
    title: string;
    description: string;
    button: string;
  };
  search: {
    title: string;
    description: string;
    placeholder: string;
    invalidResponse: string;
    failed: string;
    resultsCount: (count: number) => string;
    noResults: (query: string) => string;
    pageLabel: (page: number) => string;
  };
  pwa: {
    title: string;
    iosDescription: string;
    share: string;
    addToHome: string;
    androidDescription: string;
    install: string;
    notNow: string;
    gotIt: string;
    dismissAria: string;
  };
  pdfCard: {
    readMaterial: string;
    openingBook: string;
  };
  support: {
    heading: string;
    description: string;
    downloadsTitle: string;
    downloadsHint: string;
    videosTitle: string;
    videosHint: string;
    testimonialsTitle: string;
    emptyDownloads: string;
    emptyVideos: string;
    swipeHint: string;
    downloadPdf: string;
    downloadSubtitle: string;
  };
  reader: {
    searchPlaceholder: string;
    occurrenceOf: (current: number, total: number) => string;
    noResults: string;
    previousOccurrence: string;
    nextOccurrence: string;
    previousPage: string;
    nextPage: string;
    goToPage: string;
    zoomOut: string;
    zoomIn: string;
    loading: string;
    loadError: string;
    openingTitle: string;
    openingDescription: string;
  };
  aiChat: {
    title: string;
    subtitle: (fullName: string) => string;
    banner: string;
    welcome: string;
    assistant: string;
    sources: string;
    thinking: string;
    placeholder: string;
    sendHint: string;
    ask: string;
    sending: string;
    invalidResponse: string;
    failed: string;
    noAnswer: string;
    errorReply: (message: string) => string;
  };
};

const pt: AppMessages = {
  common: {
    library: "Biblioteca",
    supportMaterials: "Material de apoio",
    logout: "Sair",
    loggingOut: "Saindo...",
    language: "Idioma",
    page: "Página",
    of: "de",
    search: "Buscar",
    searching: "Buscando...",
  },
  header: {
    libraryTitle: "Biblioteca Água Pura",
    librarySubtitle: (firstName) =>
      `Olá, ${firstName}. Explore os materiais disponíveis.`,
    supportTitle: "Material de apoio",
    supportSubtitle: (firstName) =>
      `Olá, ${firstName}. Baixe arquivos e assista aos vídeos.`,
  },
  dashboard: {
    heading: "Sua biblioteca pastoral",
    description:
      "Livros e materiais de formação para apoiar seu ministério com jovens, famílias e lideranças.",
  },
  aiCta: {
    title: "Fale com a IA",
    description:
      "Busque informações dos livros perguntando à nossa IA. Ela responde com base nos materiais da biblioteca e indica as fontes.",
    button: "Fale com a IA",
  },
  search: {
    title: "Buscar em todos os livros",
    description: "Pesquise um termo e veja em qual livro e trecho ele aparece.",
    placeholder: "Digite um termo ou frase...",
    invalidResponse:
      "O servidor retornou uma resposta inválida. Tente novamente em instantes.",
    failed: "Não foi possível buscar",
    resultsCount: (count) =>
      `${count} ocorrência${count === 1 ? "" : "s"} encontrada${count === 1 ? "" : "s"}`,
    noResults: (query) => `Nenhum resultado para “${query}”`,
    pageLabel: (page) => `Página ${page}`,
  },
  pwa: {
    title: "Instalar no celular",
    iosDescription:
      "No Safari, toque em {share} e depois em {addToHome} para abrir a biblioteca como app.",
    share: "Compartilhar",
    addToHome: "Adicionar à Tela de Início",
    androidDescription:
      "Instale a Biblioteca Água Pura no seu celular para acessar os livros com mais rapidez, como um aplicativo.",
    install: "Instalar biblioteca",
    notNow: "Agora não",
    gotIt: "Entendi",
    dismissAria: "Fechar aviso de instalação",
  },
  pdfCard: {
    readMaterial: "Ler material",
    openingBook: "Abrindo livro...",
  },
  support: {
    heading: "Materiais de apoio",
    description:
      "Arquivos para download e vídeos de formação para apoiar seu trabalho pastoral.",
    downloadsTitle: "Materiais para download",
    downloadsHint: "Toque no card para baixar o arquivo.",
    videosTitle: "Vídeos de Estudo do Princípio Divino",
    videosHint: "Toque no card para abrir o vídeo no YouTube.",
    testimonialsTitle: "Testemunhos sobre Restauração Material",
    emptyDownloads: "Nenhum material para download ainda.",
    emptyVideos: "Nenhum vídeo disponível ainda.",
    swipeHint: "Deslize ou use as setas",
    downloadPdf: "Baixar PDF",
    downloadSubtitle: "Material para download (PDF)",
  },
  reader: {
    searchPlaceholder: "Buscar termo no livro...",
    occurrenceOf: (current, total) =>
      `${current} de ${total} ocorrências`,
    noResults: "Nenhum resultado encontrado",
    previousOccurrence: "Ocorrência anterior",
    nextOccurrence: "Próxima ocorrência",
    previousPage: "Página anterior",
    nextPage: "Próxima página",
    goToPage: "Ir para página",
    zoomOut: "Diminuir zoom",
    zoomIn: "Aumentar zoom",
    loading: "Carregando material...",
    loadError: "Não foi possível carregar este material.",
    openingTitle: "Abrindo livro...",
    openingDescription: "Preparando o leitor. Isso pode levar alguns segundos.",
  },
  aiChat: {
    title: "Fale com a IA",
    subtitle: (fullName) => `Respostas com base nos livros · ${fullName}`,
    banner:
      "A IA busca trechos nos livros da biblioteca e responde com citações. Confira sempre as fontes indicadas.",
    welcome:
      "Olá! Posso ajudar a encontrar respostas com base nos livros da biblioteca. Faça uma pergunta sobre o conteúdo dos materiais.",
    assistant: "Assistente",
    sources: "Fontes nos livros",
    thinking: "Consultando os livros...",
    placeholder: "Ex.: O que ensina o Princípio Divino sobre a criação?",
    sendHint: "Enter envia · Shift+Enter quebra linha",
    ask: "Perguntar",
    sending: "Enviando",
    invalidResponse:
      "O servidor retornou uma resposta inválida. Tente novamente.",
    failed: "Não foi possível obter a resposta",
    noAnswer: "Não encontrei uma resposta nos livros.",
    errorReply: (message) => `Não consegui responder agora: ${message}`,
  },
};

const en: AppMessages = {
  common: {
    library: "Library",
    supportMaterials: "Support materials",
    logout: "Log out",
    loggingOut: "Logging out...",
    language: "Language",
    page: "Page",
    of: "of",
    search: "Search",
    searching: "Searching...",
  },
  header: {
    libraryTitle: "Pure Water Library",
    librarySubtitle: (firstName) =>
      `Hello, ${firstName}. Explore the available materials.`,
    supportTitle: "Support materials",
    supportSubtitle: (firstName) =>
      `Hello, ${firstName}. Download files and watch the videos.`,
  },
  dashboard: {
    heading: "Your pastoral library",
    description:
      "Books and training materials to support your ministry with youth, families, and leaders.",
  },
  aiCta: {
    title: "Talk to the AI",
    description:
      "Ask our AI for information from the books. It answers based on the library materials and cites its sources.",
    button: "Talk to the AI",
  },
  search: {
    title: "Search all books",
    description: "Search for a term and see which book and passage it appears in.",
    placeholder: "Type a term or phrase...",
    invalidResponse:
      "The server returned an invalid response. Please try again shortly.",
    failed: "Search failed",
    resultsCount: (count) =>
      `${count} occurrence${count === 1 ? "" : "s"} found`,
    noResults: (query) => `No results for “${query}”`,
    pageLabel: (page) => `Page ${page}`,
  },
  pwa: {
    title: "Install on your phone",
    iosDescription:
      "In Safari, tap {share} and then {addToHome} to open the library as an app.",
    share: "Share",
    addToHome: "Add to Home Screen",
    androidDescription:
      "Install the Pure Water Library on your phone to access the books faster, like an app.",
    install: "Install library",
    notNow: "Not now",
    gotIt: "Got it",
    dismissAria: "Dismiss install prompt",
  },
  pdfCard: {
    readMaterial: "Read material",
    openingBook: "Opening book...",
  },
  support: {
    heading: "Support materials",
    description:
      "Downloadable files and training videos to support your pastoral work.",
    downloadsTitle: "Downloads",
    downloadsHint: "Tap the card to download the file.",
    videosTitle: "Divine Principle Study Videos",
    videosHint: "Tap the card to open the video on YouTube.",
    testimonialsTitle: "Testimonies on Fundraising",
    emptyDownloads: "No downloadable materials yet.",
    emptyVideos: "No videos available yet.",
    swipeHint: "Swipe or use the arrows",
    downloadPdf: "Download PDF",
    downloadSubtitle: "Downloadable material (PDF)",
  },
  reader: {
    searchPlaceholder: "Search term in this book...",
    occurrenceOf: (current, total) =>
      `${current} of ${total} occurrences`,
    noResults: "No results found",
    previousOccurrence: "Previous occurrence",
    nextOccurrence: "Next occurrence",
    previousPage: "Previous page",
    nextPage: "Next page",
    goToPage: "Go to page",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    loading: "Loading material...",
    loadError: "Could not load this material.",
    openingTitle: "Opening book...",
    openingDescription: "Preparing the reader. This may take a few seconds.",
  },
  aiChat: {
    title: "Talk to the AI",
    subtitle: (fullName) => `Answers based on the books · ${fullName}`,
    banner:
      "The AI searches passages in the library books and answers with citations. Always check the sources shown.",
    welcome:
      "Hello! I can help find answers based on the library books. Ask a question about the materials.",
    assistant: "Assistant",
    sources: "Sources in the books",
    thinking: "Consulting the books...",
    placeholder: "E.g.: What does the Divine Principle teach about creation?",
    sendHint: "Enter to send · Shift+Enter for a new line",
    ask: "Ask",
    sending: "Sending",
    invalidResponse: "The server returned an invalid response. Please try again.",
    failed: "Could not get an answer",
    noAnswer: "I could not find an answer in the books.",
    errorReply: (message) => `I could not answer right now: ${message}`,
  },
};

const es: AppMessages = {
  common: {
    library: "Biblioteca",
    supportMaterials: "Material de apoyo",
    logout: "Salir",
    loggingOut: "Saliendo...",
    language: "Idioma",
    page: "Página",
    of: "de",
    search: "Buscar",
    searching: "Buscando...",
  },
  header: {
    libraryTitle: "Biblioteca Agua Pura",
    librarySubtitle: (firstName) =>
      `Hola, ${firstName}. Explora los materiales disponibles.`,
    supportTitle: "Material de apoyo",
    supportSubtitle: (firstName) =>
      `Hola, ${firstName}. Descarga archivos y mira los videos.`,
  },
  dashboard: {
    heading: "Tu biblioteca pastoral",
    description:
      "Libros y materiales de formación para apoyar tu ministerio con jóvenes, familias y liderazgos.",
  },
  aiCta: {
    title: "Habla con la IA",
    description:
      "Busca información de los libros preguntando a nuestra IA. Responde con base en los materiales de la biblioteca e indica las fuentes.",
    button: "Habla con la IA",
  },
  search: {
    title: "Buscar en todos los libros",
    description:
      "Busca un término y ve en qué libro y fragmento aparece.",
    placeholder: "Escribe un término o frase...",
    invalidResponse:
      "El servidor devolvió una respuesta inválida. Inténtalo de nuevo en unos instantes.",
    failed: "No fue posible buscar",
    resultsCount: (count) =>
      `${count} ocurrencia${count === 1 ? "" : "s"} encontrada${count === 1 ? "" : "s"}`,
    noResults: (query) => `Ningún resultado para “${query}”`,
    pageLabel: (page) => `Página ${page}`,
  },
  pwa: {
    title: "Instalar en el celular",
    iosDescription:
      "En Safari, toca {share} y luego {addToHome} para abrir la biblioteca como app.",
    share: "Compartir",
    addToHome: "Añadir a la pantalla de inicio",
    androidDescription:
      "Instala la Biblioteca Agua Pura en tu celular para acceder a los libros más rápido, como una aplicación.",
    install: "Instalar biblioteca",
    notNow: "Ahora no",
    gotIt: "Entendido",
    dismissAria: "Cerrar aviso de instalación",
  },
  pdfCard: {
    readMaterial: "Leer material",
    openingBook: "Abriendo libro...",
  },
  support: {
    heading: "Materiales de apoyo",
    description:
      "Archivos para descargar y videos de formación para apoyar tu trabajo pastoral.",
    downloadsTitle: "Materiales para descargar",
    downloadsHint: "Toca la tarjeta para descargar el archivo.",
    videosTitle: "Videos de Estudio del Principio Divino",
    videosHint: "Toca la tarjeta para abrir el video en YouTube.",
    testimonialsTitle: "Testimonios sobre Restauración Material",
    emptyDownloads: "Aún no hay materiales para descargar.",
    emptyVideos: "Aún no hay videos disponibles.",
    swipeHint: "Desliza o usa las flechas",
    downloadPdf: "Descargar PDF",
    downloadSubtitle: "Material para descargar (PDF)",
  },
  reader: {
    searchPlaceholder: "Buscar término en el libro...",
    occurrenceOf: (current, total) =>
      `${current} de ${total} ocurrencias`,
    noResults: "No se encontraron resultados",
    previousOccurrence: "Ocurrencia anterior",
    nextOccurrence: "Siguiente ocurrencia",
    previousPage: "Página anterior",
    nextPage: "Página siguiente",
    goToPage: "Ir a la página",
    zoomOut: "Alejar",
    zoomIn: "Acercar",
    loading: "Cargando material...",
    loadError: "No fue posible cargar este material.",
    openingTitle: "Abriendo libro...",
    openingDescription:
      "Preparando el lector. Esto puede tardar unos segundos.",
  },
  aiChat: {
    title: "Habla con la IA",
    subtitle: (fullName) => `Respuestas con base en los libros · ${fullName}`,
    banner:
      "La IA busca fragmentos en los libros de la biblioteca y responde con citas. Revisa siempre las fuentes indicadas.",
    welcome:
      "¡Hola! Puedo ayudar a encontrar respuestas con base en los libros de la biblioteca. Haz una pregunta sobre el contenido de los materiales.",
    assistant: "Asistente",
    sources: "Fuentes en los libros",
    thinking: "Consultando los libros...",
    placeholder: "Ej.: ¿Qué enseña el Principio Divino sobre la creación?",
    sendHint: "Enter envía · Shift+Enter nueva línea",
    ask: "Preguntar",
    sending: "Enviando",
    invalidResponse:
      "El servidor devolvió una respuesta inválida. Inténtalo de nuevo.",
    failed: "No fue posible obtener la respuesta",
    noAnswer: "No encontré una respuesta en los libros.",
    errorReply: (message) => `No pude responder ahora: ${message}`,
  },
};

export const APP_MESSAGES: Record<UserLanguage, AppMessages> = {
  pt,
  en,
  es,
};

export function getAppMessages(language: UserLanguage): AppMessages {
  return APP_MESSAGES[language] ?? APP_MESSAGES.pt;
}
