import type { UserLanguage } from "@/lib/user-languages";

export type AppMessages = {
  common: {
    library: string;
    supportMaterials: string;
    videos: string;
    tools: string;
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
    videosTitle: string;
    videosSubtitle: (firstName: string) => string;
    toolsTitle: string;
    toolsSubtitle: (firstName: string) => string;
    journalTitle: string;
    journalSubtitle: (firstName: string) => string;
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
    videosPageHeading: string;
    videosPageDescription: string;
    downloadsTitle: string;
    downloadsHint: string;
    videosTitle: string;
    videosHint: string;
    subregion2VideosTitle: string;
    testimonialsTitle: string;
    faithTestimonialsTitle: string;
    ahaTestimonialsTitle: string;
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
  tools: {
    heading: string;
    description: string;
    open: string;
    hjJournalName: string;
    hjJournalDescription: string;
  };
  journal: {
    brand: string;
    day: (n: number) => string;
    date: string;
    hoonDokTitle: string;
    hoonDokWords: string;
    hoonDokAha: string;
    goalTitle: string;
    goal: string;
    actionPlan: string;
    analysisTitle: string;
    analysisPlaceholder: string;
    ratingLabel: string;
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    loadFailed: string;
    previousDays: string;
    emptyDays: string;
    newDay: string;
    dateInUse: string;
    jumpToDay: string;
    previousDay: string;
    nextDay: string;
    dayWithDate: (n: number, date: string) => string;
  };
  settings: {
    open: string;
    title: string;
    description: string;
    name: string;
    saveName: string;
    saving: string;
    nameUpdated: string;
    nameFailed: string;
    passwordSection: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    changePassword: string;
    changingPassword: string;
    passwordUpdated: string;
    passwordFailed: string;
    passwordsMismatch: string;
    appearance: string;
    light: string;
    dark: string;
  };
};

const pt: AppMessages = {
  common: {
    library: "Biblioteca",
    supportMaterials: "Material de apoio",
    videos: "Vídeos",
    tools: "Ferramentas",
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
      `Olá, ${firstName}. Baixe os arquivos disponíveis.`,
    videosTitle: "Vídeos",
    videosSubtitle: (firstName) =>
      `Olá, ${firstName}. Assista às trilhas de formação.`,
    toolsTitle: "Ferramentas",
    toolsSubtitle: (firstName) =>
      `Olá, ${firstName}. Acesse ferramentas para o seu dia a dia.`,
    journalTitle: "HJ Journal",
    journalSubtitle: (firstName) =>
      `Olá, ${firstName}. Registre a reflexão e o objetivo do dia.`,
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
      "Arquivos para download para apoiar seu trabalho pastoral.",
    videosPageHeading: "Trilhas de vídeos",
    videosPageDescription:
      "Vídeos de formação para apoiar seu trabalho pastoral.",
    downloadsTitle: "Materiais para download",
    downloadsHint: "Toque no card para baixar o arquivo.",
    videosTitle: "Vídeos de Estudo do Princípio Divino",
    videosHint: "Toque no card para abrir o vídeo no YouTube.",
    subregion2VideosTitle: "Vídeos de Estudo do Princípio Divino da Subregião 2",
    testimonialsTitle: "Testemunhos sobre Restauração Material",
    faithTestimonialsTitle: "Testemunhos sobre Vida de Fé",
    ahaTestimonialsTitle: "Testemunhos sobre Ahá",
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
  tools: {
    heading: "Ferramentas",
    description:
      "Aplicativos para apoiar sua rotina de estudo, reflexão e prática.",
    open: "Abrir",
    hjJournalName: "HJ Journal",
    hjJournalDescription:
      "Diário Hyo Jeong para a reflexão da palavra, anotações do ahá e análise de cada dia da jornada.",
  },
  journal: {
    brand: "Hyo Jeong Journal",
    day: (n) => `Dia ${n}`,
    date: "Data",
    hoonDokTitle: "Leitura do Hoon Dok do dia",
    hoonDokWords: "Palavras do HD",
    hoonDokAha: "“Aha”",
    goalTitle: "Objetivo do dia",
    goal: "Objetivo",
    actionPlan: "Plano de ação para alcançar o objetivo",
    analysisTitle: "Análise das atividades de hoje",
    analysisPlaceholder: "Escreva como foi o seu dia e o que aprendeu...",
    ratingLabel: "Como foi o seu dia?",
    save: "Salvar dia",
    saving: "Salvando...",
    saved: "Dia salvo.",
    saveFailed: "Não foi possível salvar o diário.",
    loadFailed: "Não foi possível carregar o diário.",
    previousDays: "Dias anteriores",
    emptyDays: "Nenhum dia salvo ainda. Preencha e salve o primeiro registro.",
    newDay: "Novo dia",
    dateInUse: "Já existe um dia salvo nesta data.",
    jumpToDay: "Ir para o dia",
    previousDay: "Dia anterior",
    nextDay: "Próximo dia",
    dayWithDate: (n, date) => `Dia ${n} · ${date}`,
  },
  settings: {
    open: "Abrir configurações",
    title: "Configurações",
    description: "Atualize seu nome, senha, aparência e idioma.",
    name: "Nome",
    saveName: "Salvar nome",
    saving: "Salvando...",
    nameUpdated: "Nome atualizado.",
    nameFailed: "Não foi possível atualizar o nome.",
    passwordSection: "Alterar senha",
    currentPassword: "Senha atual",
    newPassword: "Nova senha",
    confirmPassword: "Confirmar nova senha",
    changePassword: "Alterar senha",
    changingPassword: "Alterando...",
    passwordUpdated: "Senha alterada.",
    passwordFailed: "Não foi possível alterar a senha.",
    passwordsMismatch: "As senhas não coincidem.",
    appearance: "Aparência",
    light: "Claro",
    dark: "Escuro",
  },
};

const en: AppMessages = {
  common: {
    library: "Library",
    supportMaterials: "Support materials",
    videos: "Videos",
    tools: "Tools",
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
      `Hello, ${firstName}. Download the available files.`,
    videosTitle: "Videos",
    videosSubtitle: (firstName) =>
      `Hello, ${firstName}. Watch the training video tracks.`,
    toolsTitle: "Tools",
    toolsSubtitle: (firstName) =>
      `Hello, ${firstName}. Open tools for your daily practice.`,
    journalTitle: "HJ Journal",
    journalSubtitle: (firstName) =>
      `Hello, ${firstName}. Record today's reflection and goal.`,
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
    description: "Downloadable files to support your pastoral work.",
    videosPageHeading: "Video tracks",
    videosPageDescription: "Training videos to support your pastoral work.",
    downloadsTitle: "Downloads",
    downloadsHint: "Tap the card to download the file.",
    videosTitle: "Divine Principle Study Videos",
    videosHint: "Tap the card to open the video on YouTube.",
    subregion2VideosTitle: "Divine Principle Study Videos from Subregion 2",
    testimonialsTitle: "Testimonies on Fundraising",
    faithTestimonialsTitle: "Testimonies on the Life of Faith",
    ahaTestimonialsTitle: "Testimonies on Ahá",
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
  tools: {
    heading: "Tools",
    description:
      "Apps to support your study, reflection, and daily practice.",
    open: "Open",
    hjJournalName: "HJ Journal",
    hjJournalDescription:
      "Hyo Jeong journal for reflection on the Word, aha notes, and analysis of each day of the journey.",
  },
  journal: {
    brand: "Hyo Jeong Journal",
    day: (n) => `Day ${n}`,
    date: "Date",
    hoonDokTitle: "Today's Hoon Dok reading",
    hoonDokWords: "HD words",
    hoonDokAha: "“Aha”",
    goalTitle: "Goal of the day",
    goal: "Goal",
    actionPlan: "Action plan to reach the goal",
    analysisTitle: "Analysis of today's activities",
    analysisPlaceholder: "Write how your day went and what you learned...",
    ratingLabel: "How was your day?",
    save: "Save day",
    saving: "Saving...",
    saved: "Day saved.",
    saveFailed: "Could not save the journal.",
    loadFailed: "Could not load the journal.",
    previousDays: "Previous days",
    emptyDays: "No days saved yet. Fill in and save your first entry.",
    newDay: "New day",
    dateInUse: "A day is already saved on this date.",
    jumpToDay: "Go to day",
    previousDay: "Previous day",
    nextDay: "Next day",
    dayWithDate: (n, date) => `Day ${n} · ${date}`,
  },
  settings: {
    open: "Open settings",
    title: "Settings",
    description: "Update your name, password, appearance, and language.",
    name: "Name",
    saveName: "Save name",
    saving: "Saving...",
    nameUpdated: "Name updated.",
    nameFailed: "Could not update the name.",
    passwordSection: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    changePassword: "Change password",
    changingPassword: "Changing...",
    passwordUpdated: "Password changed.",
    passwordFailed: "Could not change the password.",
    passwordsMismatch: "Passwords do not match.",
    appearance: "Appearance",
    light: "Light",
    dark: "Dark",
  },
};

const es: AppMessages = {
  common: {
    library: "Biblioteca",
    supportMaterials: "Material de apoyo",
    videos: "Videos",
    tools: "Herramientas",
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
      `Hola, ${firstName}. Descarga los archivos disponibles.`,
    videosTitle: "Videos",
    videosSubtitle: (firstName) =>
      `Hola, ${firstName}. Mira las pistas de formación.`,
    toolsTitle: "Herramientas",
    toolsSubtitle: (firstName) =>
      `Hola, ${firstName}. Accede a herramientas para tu día a día.`,
    journalTitle: "HJ Journal",
    journalSubtitle: (firstName) =>
      `Hola, ${firstName}. Registra la reflexión y el objetivo del día.`,
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
      "Archivos para descargar para apoyar tu trabajo pastoral.",
    videosPageHeading: "Pistas de videos",
    videosPageDescription:
      "Videos de formación para apoyar tu trabajo pastoral.",
    downloadsTitle: "Materiales para descargar",
    downloadsHint: "Toca la tarjeta para descargar el archivo.",
    videosTitle: "Videos de Estudio del Principio Divino",
    videosHint: "Toca la tarjeta para abrir el video en YouTube.",
    subregion2VideosTitle: "Videos de Estudio del Principio Divino de la Subregión 2",
    testimonialsTitle: "Testimonios sobre Restauración Material",
    faithTestimonialsTitle: "Testimonios sobre Vida de Fe",
    ahaTestimonialsTitle: "Testimonios sobre Ahá",
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
  tools: {
    heading: "Herramientas",
    description:
      "Aplicaciones para apoyar tu estudio, reflexión y práctica diaria.",
    open: "Abrir",
    hjJournalName: "HJ Journal",
    hjJournalDescription:
      "Diario Hyo Jeong para la reflexión de la Palabra, las anotaciones del ahá y el análisis de cada día de la jornada.",
  },
  journal: {
    brand: "Hyo Jeong Journal",
    day: (n) => `Día ${n}`,
    date: "Fecha",
    hoonDokTitle: "Lectura del Hoon Dok del día",
    hoonDokWords: "Palabras del HD",
    hoonDokAha: "“Aha”",
    goalTitle: "Objetivo del día",
    goal: "Objetivo",
    actionPlan: "Plan de acción para alcanzar el objetivo",
    analysisTitle: "Análisis de las actividades de hoy",
    analysisPlaceholder: "Escribe cómo fue tu día y lo que aprendiste...",
    ratingLabel: "¿Cómo fue tu día?",
    save: "Guardar día",
    saving: "Guardando...",
    saved: "Día guardado.",
    saveFailed: "No fue posible guardar el diario.",
    loadFailed: "No fue posible cargar el diario.",
    previousDays: "Días anteriores",
    emptyDays: "Aún no hay días guardados. Completa y guarda el primer registro.",
    newDay: "Nuevo día",
    dateInUse: "Ya hay un día guardado en esta fecha.",
    jumpToDay: "Ir al día",
    previousDay: "Día anterior",
    nextDay: "Siguiente día",
    dayWithDate: (n, date) => `Día ${n} · ${date}`,
  },
  settings: {
    open: "Abrir configuración",
    title: "Configuración",
    description: "Actualiza tu nombre, contraseña, apariencia e idioma.",
    name: "Nombre",
    saveName: "Guardar nombre",
    saving: "Guardando...",
    nameUpdated: "Nombre actualizado.",
    nameFailed: "No fue posible actualizar el nombre.",
    passwordSection: "Cambiar contraseña",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar nueva contraseña",
    changePassword: "Cambiar contraseña",
    changingPassword: "Cambiando...",
    passwordUpdated: "Contraseña cambiada.",
    passwordFailed: "No fue posible cambiar la contraseña.",
    passwordsMismatch: "Las contraseñas no coinciden.",
    appearance: "Apariencia",
    light: "Claro",
    dark: "Oscuro",
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
