import type { UserLanguage } from "@/lib/user-languages";

export type AppMessages = {
  common: {
    library: string;
    supportMaterials: string;
    videos: string;
    tools: string;
    menu: string;
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
    hdhTitle: string;
    hdhSubtitle: (firstName: string) => string;
    videoManualTitle: string;
    videoManualSubtitle: (firstName: string) => string;
    dpIndexTitle: string;
    dpIndexSubtitle: (firstName: string) => string;
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
    kit1SupportVideosTitle: string;
    kit1SupportVideosHint: string;
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
    hdhName: string;
    hdhDescription: string;
    videoManualName: string;
    videoManualDescription: string;
    dpIndexName: string;
    dpIndexDescription: string;
  };
  dpIndex: {
    brand: string;
    heading: string;
    description: string;
    subindex: string;
    openSubindex: string;
    readText: string;
    backToTools: string;
    backToIndex: string;
    previous: string;
    next: string;
    openPdf: string;
  };
  videoManual: {
    brand: string;
    heading: string;
    description: string;
    video: (n: number) => string;
    questionsCount: (n: number) => string;
    openVideo: string;
    backToVideos: string;
    previousVideo: string;
    nextVideo: string;
    watchVideo: string;
    questionsTitle: string;
    questionsHint: string;
    answer: string;
    complement: string;
    tip: string;
    bonus: string;
    conclusion: string;
  };
  hdh: {
    brand: string;
    day: (n: number) => string;
    daysHeading: string;
    daysDescription: string;
    questionsCount: (n: number) => string;
    openDay: string;
    completed: string;
    backToDays: string;
    previousDay: string;
    nextDay: string;
    readingTitle: string;
    questionsTitle: string;
    inspirationTitle: string;
    inspirationHint: string;
    inspirationPlaceholder: string;
    answerPlaceholder: string;
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    loadFailed: string;
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
  feedback: {
    button: string;
    title: string;
    description: string;
    typeLabel: string;
    typeError: string;
    typeSuggestion: string;
    messageLabel: string;
    messagePlaceholder: string;
    linkLabel: string;
    linkPlaceholder: string;
    imagesLabel: string;
    imagesHint: string;
    removeImage: string;
    send: string;
    sending: string;
    sent: string;
    sendFailed: string;
  };
};

const pt: AppMessages = {
  common: {
    library: "Biblioteca",
    supportMaterials: "Material de apoio",
    videos: "Vídeos",
    tools: "Ferramentas",
    menu: "Menu",
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
    hdhTitle: "Hoon Dok Hae e Meditação",
    hdhSubtitle: (firstName) =>
      `Olá, ${firstName}. Leia a palavra, reflita e registre sua inspiração.`,
    videoManualTitle: "Manual de Apoio aos Vídeos",
    videoManualSubtitle: (firstName) =>
      `Olá, ${firstName}. Navegue pelas perguntas e respostas de cada vídeo.`,
    dpIndexTitle: "Princípio Divino Indexado",
    dpIndexSubtitle: (firstName) =>
      `Olá, ${firstName}. Navegue pelo sumário e abra o texto de cada seção.`,
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
    kit1SupportVideosTitle: "Vídeos de Apoio ao Kit 1",
    kit1SupportVideosHint: "Toque no card para abrir o vídeo.",
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
    hdhName: "Hoon Dok Hae e Meditação",
    hdhDescription:
      "Livro de Hoon Dok Hae e meditação das Palavras dos Verdadeiros Pais. Cada dia um tema, com leitura, perguntas de reflexão e espaço para a inspiração.",
    videoManualName: "Manual de Apoio aos Vídeos",
    videoManualDescription:
      "Perguntas e respostas do Kit 1, organizadas por vídeo do seminário de 7 dias, para facilitar o estudo e a condução.",
    dpIndexName: "Princípio Divino Indexado",
    dpIndexDescription:
      "O livro do Princípio Divino com sumário navegável: toque no título para abrir os subíndices ou o texto.",
  },
  dpIndex: {
    brand: "Exposição do Princípio Divino",
    heading: "Princípio Divino Indexado",
    description:
      "Escolha um título do índice. Cada item abre os subcapítulos ou o texto correspondente, como na leitura por capítulos e versículos.",
    subindex: "Índice desta seção",
    openSubindex: "Abrir subíndice",
    readText: "Abrir texto",
    backToTools: "Todas as ferramentas",
    backToIndex: "Voltar ao índice",
    previous: "Anterior",
    next: "Próximo",
    openPdf: "Abrir o livro em PDF",
  },
  videoManual: {
    brand: "Kit 1 — Princípio Divino",
    heading: "Manual de Apoio aos Vídeos",
    description:
      "Escolha um vídeo para ver as perguntas, respostas, complementos e dicas de condução.",
    video: (n) => `Vídeo ${n}`,
    questionsCount: (n) =>
      n === 1 ? "1 pergunta e resposta" : `${n} perguntas e respostas`,
    openVideo: "Abrir perguntas",
    backToVideos: "Todos os vídeos",
    previousVideo: "Vídeo anterior",
    nextVideo: "Próximo vídeo",
    watchVideo: "Assistir vídeo",
    questionsTitle: "Perguntas e respostas",
    questionsHint: "Toque em uma pergunta para ver a resposta, o complemento e a dica.",
    answer: "Resposta",
    complement: "Complemento",
    tip: "Dica",
    bonus: "Bônus",
    conclusion: "Conclusão",
  },
  hdh: {
    brand: "Palavras dos Verdadeiros Pais",
    day: (n) => `Dia ${n}`,
    daysHeading: "Hoon Dok Hae e Meditação",
    daysDescription:
      "Escolha um dia para ler o tema, responder às perguntas de reflexão e guardar a inspiração recebida.",
    questionsCount: (n) =>
      n === 1 ? "1 pergunta de reflexão" : `${n} perguntas de reflexão`,
    openDay: "Abrir leitura",
    completed: "Salvo",
    backToDays: "Todos os dias",
    previousDay: "Dia anterior",
    nextDay: "Próximo dia",
    readingTitle: "Leitura",
    questionsTitle: "Perguntas de reflexão",
    inspirationTitle: "Inspiração",
    inspirationHint:
      "Escreva o que o Céu falou ao seu coração enquanto lia e meditava.",
    inspirationPlaceholder: "Registre aqui a sua inspiração...",
    answerPlaceholder: "Escreva a sua reflexão...",
    save: "Salvar reflexão",
    saving: "Salvando...",
    saved: "Reflexão salva.",
    saveFailed: "Não foi possível salvar a reflexão.",
    loadFailed: "Não foi possível carregar a reflexão.",
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
  feedback: {
    button: "Erros e sugestões",
    title: "Reportar erros e sugestões",
    description:
      "Conte o que não está funcionando ou o que podemos melhorar. Enviaremos sua mensagem para a equipe.",
    typeLabel: "Tipo",
    typeError: "Reportar um erro",
    typeSuggestion: "Enviar uma sugestão",
    messageLabel: "Mensagem",
    messagePlaceholder: "Descreva o erro ou a sugestão com o máximo de detalhes possível...",
    linkLabel: "Link (opcional)",
    linkPlaceholder: "https://...",
    imagesLabel: "Imagens (opcional)",
    imagesHint: "Até 3 imagens (JPG, PNG, WEBP ou GIF), no máximo 4 MB cada.",
    removeImage: "Remover imagem",
    send: "Enviar",
    sending: "Enviando...",
    sent: "Mensagem enviada. Obrigado!",
    sendFailed: "Não foi possível enviar a mensagem.",
  },
};

const en: AppMessages = {
  common: {
    library: "Library",
    supportMaterials: "Support materials",
    videos: "Videos",
    tools: "Tools",
    menu: "Menu",
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
    hdhTitle: "Hoon Dok Hae and Meditation",
    hdhSubtitle: (firstName) =>
      `Hello, ${firstName}. Read the Word, reflect, and record your inspiration.`,
    videoManualTitle: "Video Support Manual",
    videoManualSubtitle: (firstName) =>
      `Hello, ${firstName}. Browse the questions and answers for each video.`,
    dpIndexTitle: "Indexed Divine Principle",
    dpIndexSubtitle: (firstName) =>
      `Hello, ${firstName}. Browse the table of contents and open each section.`,
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
    kit1SupportVideosTitle: "Kit 1 Support Videos",
    kit1SupportVideosHint: "Tap the card to open the video.",
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
    hdhName: "Hoon Dok Hae and Meditation",
    hdhDescription:
      "Hoon Dok Hae and meditation book of the Words of the True Parents. Each day has a theme, with reading, reflection questions, and space for inspiration.",
    videoManualName: "Video Support Manual",
    videoManualDescription:
      "Kit 1 questions and answers, organized by each 7-day seminar video, to make study and guidance easier.",
    dpIndexName: "Indexed Divine Principle",
    dpIndexDescription:
      "The Divine Principle book with a navigable table of contents: tap a title to open subentries or the text itself.",
  },
  dpIndex: {
    brand: "Exposition of the Divine Principle",
    heading: "Indexed Divine Principle",
    description:
      "Choose a title from the index. Each item opens its subchapters or the corresponding text, like reading by chapter and verse.",
    subindex: "Index of this section",
    openSubindex: "Open subindex",
    readText: "Open text",
    backToTools: "All tools",
    backToIndex: "Back to the index",
    previous: "Previous",
    next: "Next",
    openPdf: "Open the PDF book",
  },
  videoManual: {
    brand: "Kit 1 — Divine Principle",
    heading: "Video Support Manual",
    description:
      "Choose a video to see the questions, answers, complements, and guidance tips.",
    video: (n) => `Video ${n}`,
    questionsCount: (n) =>
      n === 1 ? "1 question and answer" : `${n} questions and answers`,
    openVideo: "Open questions",
    backToVideos: "All videos",
    previousVideo: "Previous video",
    nextVideo: "Next video",
    watchVideo: "Watch video",
    questionsTitle: "Questions and answers",
    questionsHint: "Tap a question to see the answer, complement, and tip.",
    answer: "Answer",
    complement: "Complement",
    tip: "Tip",
    bonus: "Bonus",
    conclusion: "Conclusion",
  },
  hdh: {
    brand: "Words of the True Parents",
    day: (n) => `Day ${n}`,
    daysHeading: "Hoon Dok Hae and Meditation",
    daysDescription:
      "Choose a day to read the theme, answer the reflection questions, and save the inspiration you received.",
    questionsCount: (n) =>
      n === 1 ? "1 reflection question" : `${n} reflection questions`,
    openDay: "Open reading",
    completed: "Saved",
    backToDays: "All days",
    previousDay: "Previous day",
    nextDay: "Next day",
    readingTitle: "Reading",
    questionsTitle: "Reflection questions",
    inspirationTitle: "Inspiration",
    inspirationHint:
      "Write what Heaven spoke to your heart as you read and meditated.",
    inspirationPlaceholder: "Record your inspiration here...",
    answerPlaceholder: "Write your reflection...",
    save: "Save reflection",
    saving: "Saving...",
    saved: "Reflection saved.",
    saveFailed: "Could not save the reflection.",
    loadFailed: "Could not load the reflection.",
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
  feedback: {
    button: "Errors & suggestions",
    title: "Report errors and suggestions",
    description:
      "Tell us what is not working or what we can improve. We will send your message to the team.",
    typeLabel: "Type",
    typeError: "Report an error",
    typeSuggestion: "Send a suggestion",
    messageLabel: "Message",
    messagePlaceholder: "Describe the error or suggestion with as much detail as possible...",
    linkLabel: "Link (optional)",
    linkPlaceholder: "https://...",
    imagesLabel: "Images (optional)",
    imagesHint: "Up to 3 images (JPG, PNG, WEBP, or GIF), 4 MB each.",
    removeImage: "Remove image",
    send: "Send",
    sending: "Sending...",
    sent: "Message sent. Thank you!",
    sendFailed: "Could not send the message.",
  },
};

const es: AppMessages = {
  common: {
    library: "Biblioteca",
    supportMaterials: "Material de apoyo",
    videos: "Videos",
    tools: "Herramientas",
    menu: "Menú",
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
    hdhTitle: "Hoon Dok Hae y Meditación",
    hdhSubtitle: (firstName) =>
      `Hola, ${firstName}. Lee la Palabra, reflexiona y registra tu inspiración.`,
    videoManualTitle: "Manual de Apoyo a los Videos",
    videoManualSubtitle: (firstName) =>
      `Hola, ${firstName}. Navega por las preguntas y respuestas de cada video.`,
    dpIndexTitle: "Principio Divino Indexado",
    dpIndexSubtitle: (firstName) =>
      `Hola, ${firstName}. Navega por el índice y abre el texto de cada sección.`,
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
    kit1SupportVideosTitle: "Videos de Apoyo al Kit 1",
    kit1SupportVideosHint: "Toca la tarjeta para abrir el video.",
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
    hdhName: "Hoon Dok Hae y Meditación",
    hdhDescription:
      "Libro de Hoon Dok Hae y meditación de las Palabras de los Verdaderos Padres. Cada día un tema, con lectura, preguntas de reflexión y espacio para la inspiración.",
    videoManualName: "Manual de Apoyo a los Videos",
    videoManualDescription:
      "Preguntas y respuestas del Kit 1, organizadas por cada video del seminario de 7 días, para facilitar el estudio y la conducción.",
    dpIndexName: "Principio Divino Indexado",
    dpIndexDescription:
      "El libro del Principio Divino con índice navegable: toca el título para abrir los subíndices o el texto.",
  },
  dpIndex: {
    brand: "El Principio Divino",
    heading: "Principio Divino Indexado",
    description:
      "Elige un título del índice. Cada elemento abre los subcapítulos o el texto correspondiente, como en la lectura por capítulos y versículos.",
    subindex: "Índice de esta sección",
    openSubindex: "Abrir subíndice",
    readText: "Abrir texto",
    backToTools: "Todas las herramientas",
    backToIndex: "Volver al índice",
    previous: "Anterior",
    next: "Siguiente",
    openPdf: "Abrir el libro en PDF",
  },
  videoManual: {
    brand: "Kit 1 — Principio Divino",
    heading: "Manual de Apoyo a los Videos",
    description:
      "Elige un video para ver las preguntas, respuestas, complementos y consejos de conducción.",
    video: (n) => `Video ${n}`,
    questionsCount: (n) =>
      n === 1 ? "1 pregunta y respuesta" : `${n} preguntas y respuestas`,
    openVideo: "Abrir preguntas",
    backToVideos: "Todos los videos",
    previousVideo: "Video anterior",
    nextVideo: "Siguiente video",
    watchVideo: "Ver video",
    questionsTitle: "Preguntas y respuestas",
    questionsHint: "Toca una pregunta para ver la respuesta, el complemento y el consejo.",
    answer: "Respuesta",
    complement: "Complemento",
    tip: "Consejo",
    bonus: "Bono",
    conclusion: "Conclusión",
  },
  hdh: {
    brand: "Palabras de los Verdaderos Padres",
    day: (n) => `Día ${n}`,
    daysHeading: "Hoon Dok Hae y Meditación",
    daysDescription:
      "Elige un día para leer el tema, responder las preguntas de reflexión y guardar la inspiración recibida.",
    questionsCount: (n) =>
      n === 1 ? "1 pregunta de reflexión" : `${n} preguntas de reflexión`,
    openDay: "Abrir lectura",
    completed: "Guardado",
    backToDays: "Todos los días",
    previousDay: "Día anterior",
    nextDay: "Siguiente día",
    readingTitle: "Lectura",
    questionsTitle: "Preguntas de reflexión",
    inspirationTitle: "Inspiración",
    inspirationHint:
      "Escribe lo que el Cielo habló a tu corazón mientras leías y meditabas.",
    inspirationPlaceholder: "Registra aquí tu inspiración...",
    answerPlaceholder: "Escribe tu reflexión...",
    save: "Guardar reflexión",
    saving: "Guardando...",
    saved: "Reflexión guardada.",
    saveFailed: "No fue posible guardar la reflexión.",
    loadFailed: "No fue posible cargar la reflexión.",
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
  feedback: {
    button: "Errores y sugerencias",
    title: "Reportar errores y sugerencias",
    description:
      "Cuéntanos qué no está funcionando o qué podemos mejorar. Enviaremos tu mensaje al equipo.",
    typeLabel: "Tipo",
    typeError: "Reportar un error",
    typeSuggestion: "Enviar una sugerencia",
    messageLabel: "Mensaje",
    messagePlaceholder: "Describe el error o la sugerencia con el mayor detalle posible...",
    linkLabel: "Enlace (opcional)",
    linkPlaceholder: "https://...",
    imagesLabel: "Imágenes (opcional)",
    imagesHint: "Hasta 3 imágenes (JPG, PNG, WEBP o GIF), máximo 4 MB cada una.",
    removeImage: "Quitar imagen",
    send: "Enviar",
    sending: "Enviando...",
    sent: "Mensaje enviado. ¡Gracias!",
    sendFailed: "No fue posible enviar el mensaje.",
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
