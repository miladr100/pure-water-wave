import type { UserLanguage } from "@/lib/user-languages";

// The HJ Team panel's copy. The panel serves the Brazilian teams, so
// Portuguese is the reference and, for now, the only text; the other two
// languages fall back to it until the group asks for translations. Every
// screen reads copy through `usePainelMessages()`.
export type PainelMessages = {
  areas: { painel: string; rm: string; rmShort: string; testemunho: string; academia: string; biblioteca: string; admin: string; switchLabel: string };
  shell: {
    painelTitle: string;
    adminTitle: string;
    libraryTitle: string;
    collapse: string;
    expand: string;
    more: string;
    library: string;
    logout: string;
  };
  nav: {
    inicio: string;
    arrecadacao: string;
    testemunho: string;
    equipe: string;
    pessoas: string;
    academia: string;
    equipes: string;
    organizacao: string;
    configuracoes: string;
    perfil: string;
    biblioteca: string;
    materiais: string;
    videos: string;
    ferramentas: string;
    ia: string;
    relatorioDia: string;
    minhaEquipe: string;
    convidados: string;
    caixa: string;
    reunioes: string;
    porArea: string;
    visaoGeral: string;
    alunos: string;
    cursos: string;
    perguntas: string;
    correcoes: string;
    verComoAluno: string;
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    save: string;
    saving: string;
    edit: string;
    cancel: string;
    close: string;
    back: string;
    search: string;
    all: string;
    none: string;
    today: string;
    day: (n: number, total: number) => string;
    rest: string;
    noProject: string;
    noTeam: string;
  };
  estados: Record<"enviado" | "validado" | "devolvido", string>;
  inicio: {
    greeting: (name: string) => string;
    pending: string;
    pendingBody: string;
    sentBody: string;
    validatedBody: string;
    returnedBody: string;
    returnedList: (n: number) => string;
    restBody: string;
    fill: string;
    fix: string;
    view: string;
    goal: string;
    goalHint: (media: string, recorde: string) => string;
    totalProject: string;
    last7: string;
    testemunho: string;
    guests: (n: number) => string;
    needAttention: (n: number) => string;
    seeGuests: string;
    teamToday: string;
    teamSent: (sent: number, total: number) => string;
    teamPending: (n: number) => string;
    openTeam: string;
    academyContinue: string;
    academyOpen: string;
  };
  relatorio: {
    title: string;
    description: string;
    dayLabel: string;
    dinheiro: string;
    pix: string;
    despesas: string;
    liquido: string;
    itens: string;
    contatos: string;
    observacoes: string;
    send: string;
    resend: string;
    sending: string;
    sent: string;
    resent: string;
    returnedReason: string;
    history: string;
    noHistory: string;
    alreadyValidated: string;
    numbersHint: string;
    whatsapp: string;
    copy: string;
    copied: string;
  };
  equipe: {
    title: string;
    captain: string;
    educator: string;
    membersToday: string;
    pending: string;
    noPending: string;
    validate: string;
    sendBack: string;
    reason: string;
    reasonPlaceholder: string;
    validated: string;
    returned: string;
    history: string;
    totalToday: string;
    notSent: string;
    meta: string;
    media: string;
    total: string;
    notCaptain: string;
  };
  testemunho: {
    title: string;
    mine: string;
    team: string;
    add: string;
    newGuest: string;
    name: string;
    phone: string;
    city: string;
    origin: string;
    stage: string;
    firstContact: string;
    nextGoal: string;
    notes: string;
    create: string;
    created: string;
    empty: string;
    conferences: (n: number) => string;
    lastContact: (text: string) => string;
    noContact: string;
    journey: string;
    timeline: string;
    suggestions: string;
    register: string;
    registerContact: string;
    registerConference: string;
    registerGateway: string;
    registerFicha: string;
    registerNote: string;
    noteText: string;
    date: string;
    saved: string;
    moveTo: (stage: string) => string;
    responsible: string;
    stageDates: string;
    edit: string;
    filterStage: string;
    filterAlert: string;
    onlyAlerts: string;
  };
  admin: {
    homeTitle: string;
    raised: string;
    ofGoal: (goal: string) => string;
    members: string;
    teams: string;
    sentToday: string;
    pendingValidation: string;
    returned: string;
    byProgram: string;
    byTeam: string;
    testemunhoSummary: string;
    alerts: (n: number) => string;
    resultsTab: string;
    reportsTab: string;
    goalsTab: string;
    accountingTab: string;
    exportCsv: string;
    filters: string;
    project: string;
    program: string;
    team: string;
    educator: string;
    searchMember: string;
    perDay: string;
    totals: string;
    cash: string;
    pix: string;
    expenses: string;
    net: string;
    dayReports: string;
    noReports: string;
    peopleTitle: string;
    membersTab: string;
    educatorsTab: string;
    adminsTab: string;
    pastorsTab: string;
    newMember: string;
    newEducator: string;
    importCsv: string;
    makeEducator: string;
    removeEducator: string;
    makeAdmin: string;
    removeAdmin: string;
    rolesSaved: string;
    teamsReleased: (n: number) => string;
    teamsTitle: string;
    newTeam: string;
    editTeam: string;
    teamName: string;
    captain: string;
    noCaptain: string;
    membersLabel: string;
    addMember: string;
    removeMember: string;
    saveTeam: string;
    teamSaved: string;
    deleteTeam: string;
    teamDeleted: string;
    orgTitle: string;
    projectsTitle: string;
    newProject: string;
    editProject: string;
    projectName: string;
    projectType: string;
    start: string;
    end: string;
    active: string;
    restDays: string;
    restDaysHint: string;
    dailyGoal: string;
    totalGoal: string;
    programGoals: string;
    newGoalRule: string;
    factor: string;
    rounding: string;
    minimum: string;
    copyTeamsFrom: string;
    dontCopy: string;
    projectSaved: string;
    tipos: Record<"arrecadacao" | "testemunho", string>;
    settingsTitle: string;
    settingsBody: string;
    academyTitle: string;
    academyBody: string;
    arrecadacaoSection: string;
    testemunhoSection: string;
    noTestemunhoProject: string;
    guestsByTeam: string;
    recentEvents: string;
    noRecentEvents: string;
  };
  pessoa: {
    profileTitle: string;
    basicData: string;
    age: (n: number) => string;
    noAge: string;
    birthday: string;
    program: string;
    cohort: string;
    noProgram: string;
    noCohort: string;
    memberSince: string;
    memberFor: (years: number) => string;
    course: string;
    courseHint: string;
    formation: string;
    formationHint: string;
    educatorSection: string;
    educatorSectionBody: string;
    cheonBo: string;
    secondGen: string;
    parents: string;
    liberated: string;
    faithPattern: string;
    notes: string;
    notesHint: string;
    yes: string;
    no: string;
    unknown: string;
    saved: string;
    myHjSection: string;
    myHjBody: string;
    team: string;
    educator: string;
    guests: string;
    rmSummary: string;
    academyLink: string;
    allPrograms: string;
    allCohorts: string;
    programsTitle: string;
    programsBody: string;
    cohorts: string;
    newCohort: string;
    cohortName: string;
    inactive: string;
    programSaved: string;
  };
  reunioes: {
    title: string;
    bodyMember: string;
    bodyEducator: string;
    ask: string;
    asked: string;
    with: string;
    mine: string;
    reason: string;
    reasonHint: string;
    availability: string;
    availabilityHint: string;
    send: string;
    emptyMember: string;
    emptyEducator: string;
    estados: Record<"solicitada" | "confirmada" | "remarcar" | "recusada" | "cancelada" | "realizada", string>;
    acoes: Record<"confirmar" | "remarcar" | "recusar", string>;
    answer: string;
    when: string;
    where: string;
    whereHint: string;
    message: string;
    reply: string;
    markDone: string;
    cancel: string;
    cancelConfirm: string;
    saved: string;
    new: string;
    askedOn: (date: string) => string;
    notified: (channels: string) => string;
    noChannel: string;
    closed: (n: number) => string;
    homeCard: string;
    homeBody: string;
    homePending: (n: number) => string;
  };
  caixa: {
    title: string;
    body: string;
    adminTitle: string;
    adminBody: string;
    balance: string;
    in: string;
    out: string;
    newEntry: string;
    type: string;
    tipos: Record<"entrada" | "saida", string>;
    category: string;
    categorias: Record<"rm" | "doacao" | "estadia" | "alimentacao" | "transporte" | "material" | "outro", string>;
    amount: string;
    description: string;
    date: string;
    posted: string;
    deleted: string;
    deleteConfirm: string;
    noEntries: string;
    stayFee: string;
    stayFeeHint: string;
    stayFeeMissing: string;
    postStay: string;
    postStayBody: (membros: number, taxa: string) => string;
    from: string;
    to: string;
    stayPosted: string;
    byCategory: string;
    readOnly: string;
    automatic: string;
    team: string;
    entries: string;
    lastEntry: string;
    total: string;
    noTeam: string;
    saveFee: string;
  };
  config: {
    body: string;
    testemunhoModule: string;
    visibleNow: string;
    hiddenNow: string;
    projectRunning: (nome: string, periodo: string) => string;
    modos: Record<"auto" | "visivel" | "oculto", { title: string; body: string }>;
    educatorsAlways: string;
    laterTitle: string;
    saved: string;
  };
  missao: {
    title: string;
    body: string;
    resultsTitle: string;
    resultsBody: string;
    regiao: string;
    pais: string;
    local: string;
    equipe: string;
    semArea: string;
    addRegiao: string;
    addPais: string;
    addLocal: string;
    name: string;
    byProgram: string;
    guests: string;
    forms: string;
    alerts: string;
    members: string;
    membersWithGuest: string;
    noTeams: string;
    areaLabel: string;
    noArea: string;
    saved: string;
    deleted: string;
    expandAll: string;
    collapseAll: string;
  };
  biblioteca: {
    title: string;
    description: string;
    add: string;
    editItem: string;
    tipos: Record<"livro" | "material" | "video", string>;
    tipo: string;
    idioma: string;
    titulo: string;
    subtitulo: string;
    url: string;
    urlHint: string;
    urlVideo: string;
    urlVideoHint: string;
    thumbnail: string;
    published: string;
    hidden: string;
    hide: string;
    publish: string;
    saved: string;
    remove: string;
    removed: string;
    empty: string;
    shipped: string;
    shippedHint: string;
    addedBooks: string;
    addedVideos: string;
    open: string;
  };
};

const pt: PainelMessages = {
  areas: { painel: "Painel", rm: "Restauração Material", rmShort: "RM", testemunho: "Testemunho", academia: "Academia", biblioteca: "Biblioteca", admin: "Administração", switchLabel: "Módulo" },
  shell: {
    painelTitle: "Painel HJ Team",
    adminTitle: "Administração",
    libraryTitle: "Biblioteca Água Pura",
    collapse: "Recolher",
    expand: "Expandir",
    more: "Mais",
    library: "Biblioteca",
    logout: "Sair",
  },
  nav: {
    inicio: "Início",
    arrecadacao: "Arrecadação",
    testemunho: "Testemunho",
    equipe: "Equipe",
    pessoas: "Pessoas",
    academia: "Academia",
    equipes: "Equipes",
    organizacao: "Organização",
    configuracoes: "Configurações",
    perfil: "Perfil",
    biblioteca: "Biblioteca",
    materiais: "Materiais",
    videos: "Vídeos",
    ferramentas: "Ferramentas",
    ia: "Fale com a IA",
    relatorioDia: "Relatório do dia",
    minhaEquipe: "Minha equipe",
    convidados: "Convidados",
    caixa: "Caixa",
    reunioes: "Reuniões",
    porArea: "Por área",
    visaoGeral: "Visão geral",
    alunos: "Alunos",
    cursos: "Cursos",
    perguntas: "Perguntas",
    correcoes: "Correções",
    verComoAluno: "Ver como aluno",
  },
  common: {
    loading: "Carregando…",
    error: "Algo deu errado. Tente de novo.",
    retry: "Tentar de novo",
    save: "Salvar",
    saving: "Salvando…",
    edit: "Editar",
    cancel: "Cancelar",
    close: "Fechar",
    back: "Voltar",
    search: "Buscar",
    all: "Todos",
    none: "Nenhum",
    today: "hoje",
    day: (n, total) => `dia ${n} de ${total}`,
    rest: "dia de descanso",
    noProject: "Não há um projeto de arrecadação ativo no momento.",
    noTeam: "Você ainda não está em uma equipe deste projeto. Fale com o seu educador.",
  },
  estados: { enviado: "Enviado", validado: "Validado", devolvido: "Devolvido" },
  inicio: {
    greeting: (name) => `Olá, ${name}`,
    pending: "Pendente",
    pendingBody: "Você ainda não enviou o resultado de hoje. Leva menos de dois minutos.",
    sentBody: "Resultado de hoje enviado. O capitão vai validar.",
    validatedBody: "Resultado de hoje validado.",
    returnedBody: "O capitão devolveu o seu relatório de hoje:",
    returnedList: (n) => (n === 1 ? "1 dia devolvido para corrigir" : `${n} dias devolvidos para corrigir`),
    restBody: "Hoje é dia de descanso. Nada para enviar.",
    fill: "Preencher relatório de RM",
    fix: "Corrigir e reenviar",
    view: "Ver relatório",
    goal: "Minha meta diária",
    goalHint: (media, recorde) => `média ${media} · recorde ${recorde}`,
    totalProject: "Total no projeto",
    last7: "Últimos 7 dias",
    testemunho: "Testemunho",
    guests: (n) => (n === 1 ? "1 convidado" : `${n} convidados`),
    needAttention: (n) => (n === 1 ? "1 precisa de atenção" : `${n} precisam de atenção`),
    seeGuests: "Ver meus convidados",
    teamToday: "Minha equipe hoje",
    teamSent: (sent, total) => `${sent} de ${total} enviaram`,
    teamPending: (n) => (n === 1 ? "1 relatório para validar" : `${n} relatórios para validar`),
    openTeam: "Abrir equipe",
    academyContinue: "Academia · continuar",
    academyOpen: "Ir para a academia",
  },
  relatorio: {
    title: "Relatório de RM",
    description: "Os mesmos campos da mensagem de WhatsApp, uma vez por dia.",
    dayLabel: "Dia",
    dinheiro: "Dinheiro",
    pix: "Pix",
    despesas: "Despesas",
    liquido: "Líquido",
    itens: "Itens vendidos",
    contatos: "Contatos",
    observacoes: "Observações",
    send: "Enviar relatório",
    resend: "Reenviar relatório",
    sending: "Enviando…",
    sent: "Relatório enviado. O capitão vai validar.",
    resent: "Relatório reenviado.",
    returnedReason: "Devolvido pelo capitão",
    history: "Meus dias",
    noHistory: "Nenhum relatório ainda neste projeto.",
    alreadyValidated: "Este dia já foi validado. Para alterar, fale com o capitão.",
    numbersHint: "Em reais, sem centavos: 350 ou 1.250",
    whatsapp: "Mensagem para o grupo",
    copy: "Copiar mensagem",
    copied: "Mensagem copiada",
  },
  equipe: {
    title: "Equipe",
    captain: "Capitã(o)",
    educator: "Educador(a)",
    membersToday: "Membros hoje",
    pending: "Para validar",
    noPending: "Nada para validar agora.",
    validate: "Validar",
    sendBack: "Devolver",
    reason: "Motivo",
    reasonPlaceholder: "O que precisa corrigir?",
    validated: "Relatório validado",
    returned: "Relatório devolvido",
    history: "Histórico da equipe",
    totalToday: "Total hoje",
    notSent: "não enviou",
    meta: "meta",
    media: "média",
    total: "total",
    notCaptain: "A página da equipe é da capitã ou do capitão. Os seus resultados estão em Arrecadação.",
  },
  testemunho: {
    title: "Testemunho",
    mine: "Meus convidados",
    team: "Da equipe",
    add: "Novo convidado",
    newGuest: "Novo convidado",
    name: "Nome",
    phone: "Telefone",
    city: "Cidade",
    origin: "Como conheceu",
    stage: "Etapa",
    firstContact: "Primeiro contato",
    nextGoal: "Próximo objetivo",
    notes: "Notas",
    create: "Salvar convidado",
    created: "Convidado salvo",
    empty: "Nenhum convidado ainda. Comece pelo primeiro contato.",
    conferences: (n) => `${n} de 16 conferências`,
    lastContact: (text) => `último contato ${text}`,
    noContact: "sem contato registrado",
    journey: "Jornada",
    timeline: "Acontecimentos",
    suggestions: "Próximo passo",
    register: "Registrar",
    registerContact: "Contato",
    registerConference: "Conferência",
    registerGateway: "Gateway",
    registerFicha: "Ficha assinada",
    registerNote: "Nota",
    noteText: "O que aconteceu?",
    date: "Data",
    saved: "Registrado",
    moveTo: (stage) => `Passar para ${stage}`,
    responsible: "Responsável",
    stageDates: "Datas",
    edit: "Editar dados",
    filterStage: "Etapa",
    filterAlert: "Atenção",
    onlyAlerts: "Só quem precisa de atenção",
  },
  admin: {
    homeTitle: "Visão geral",
    raised: "Arrecadado",
    ofGoal: (goal) => `de ${goal}`,
    members: "membros",
    teams: "equipes",
    sentToday: "enviaram hoje",
    pendingValidation: "para validar",
    returned: "devolvidos",
    byProgram: "Por programa",
    byTeam: "Por equipe",
    testemunhoSummary: "Testemunho",
    alerts: (n) => (n === 1 ? "1 convidado precisa de atenção" : `${n} convidados precisam de atenção`),
    resultsTab: "Resultados",
    reportsTab: "Relatórios do dia",
    goalsTab: "Metas",
    accountingTab: "Contabilidade",
    exportCsv: "Exportar CSV",
    filters: "Filtros",
    project: "Projeto",
    program: "Programa",
    team: "Equipe",
    educator: "Educador",
    searchMember: "Buscar membro",
    perDay: "Por dia",
    totals: "Totais",
    cash: "Dinheiro",
    pix: "Pix",
    expenses: "Despesas",
    net: "Líquido",
    dayReports: "Relatórios do dia",
    noReports: "Nenhum relatório neste dia.",
    peopleTitle: "Pessoas",
    membersTab: "Membros",
    educatorsTab: "Educadores",
    adminsTab: "Administradores",
    pastorsTab: "Pastores",
    newMember: "Novo membro",
    newEducator: "Novo educador(a)",
    importCsv: "Importar CSV",
    makeEducator: "Tornar educador",
    removeEducator: "Tirar de educador",
    makeAdmin: "Tornar administrador",
    removeAdmin: "Tirar de administrador",
    rolesSaved: "Papéis atualizados",
    teamsReleased: (n) => (n === 1 ? "1 equipe ficou sem educador" : `${n} equipes ficaram sem educador`),
    teamsTitle: "Equipes",
    newTeam: "Nova equipe",
    editTeam: "Editar equipe",
    teamName: "Nome da equipe",
    captain: "Capitã(o)",
    noCaptain: "Sem capitão",
    membersLabel: "Membros",
    addMember: "Adicionar membro",
    removeMember: "Tirar",
    saveTeam: "Salvar equipe",
    teamSaved: "Equipe salva",
    deleteTeam: "Apagar equipe",
    teamDeleted: "Equipe apagada",
    orgTitle: "Organização",
    projectsTitle: "Projetos",
    newProject: "Novo projeto",
    editProject: "Editar projeto",
    projectName: "Nome",
    projectType: "Tipo",
    start: "Início",
    end: "Fim",
    active: "Ativo",
    restDays: "Dias de descanso",
    restDaysHint: "Uma data por linha (aaaa-mm-dd)",
    dailyGoal: "Meta diária inicial",
    totalGoal: "Meta total",
    programGoals: "Metas por programa",
    newGoalRule: "Regra da nova meta",
    factor: "Fator",
    rounding: "Arredondar para",
    minimum: "Mínimo",
    copyTeamsFrom: "Copiar equipes de",
    dontCopy: "Não copiar",
    projectSaved: "Projeto salvo",
    tipos: { arrecadacao: "Arrecadação", testemunho: "Testemunho" },
    settingsTitle: "Configurações",
    settingsBody: "Lembretes, horários e integrações ficam aqui quando forem definidos com o grupo.",
    academyTitle: "Academia",
    academyBody: "A administração da academia continua como está: alunos, cursos, perguntas e correções.",
    arrecadacaoSection: "Arrecadação",
    testemunhoSection: "Testemunho",
    noTestemunhoProject: "Não há um projeto de testemunho ativo.",
    guestsByTeam: "Convidados por equipe",
    recentEvents: "Últimos acontecimentos",
    noRecentEvents: "Nenhum acontecimento registrado ainda.",
  },
  pessoa: {
    profileTitle: "Perfil",
    basicData: "Dados básicos",
    age: (n) => `${n} anos`,
    noAge: "Idade não informada",
    birthday: "Nascimento",
    program: "Programa",
    cohort: "Turma",
    noProgram: "Sem programa",
    noCohort: "Sem turma",
    memberSince: "Membro desde",
    memberFor: (years) => (years === 0 ? "há menos de 1 ano" : years === 1 ? "há 1 ano" : `há ${years} anos`),
    course: "Curso universitário",
    courseHint: "Em que curso se formou (ou está cursando).",
    formation: "Outras formações",
    formationHint: "Cursos, especializações, idiomas.",
    educatorSection: "Informações do educador",
    educatorSectionBody: "Só educadores veem e preenchem esta parte. A pessoa não a vê no próprio perfil.",
    cheonBo: "Família Cheon Bo",
    secondGen: "Segunda geração",
    parents: "Pais",
    liberated: "Espíritos centrais libertados",
    faithPattern: "Padrão de vida de fé",
    notes: "Anotações do educador",
    notesHint: "Como foi o contato, o que combinar, o que acompanhar.",
    yes: "Sim",
    no: "Não",
    unknown: "Não sei",
    saved: "Perfil salvo",
    myHjSection: "HJ Team",
    myHjBody: "Programa e turma são definidos pelo educador. Os outros campos são seus.",
    team: "Equipe",
    educator: "Educador(a) responsável",
    guests: "Convidados",
    rmSummary: "Restauração Material",
    academyLink: "Ver na academia",
    allPrograms: "Todos os programas",
    allCohorts: "Todas as turmas",
    programsTitle: "Programas e turmas",
    programsBody: "As siglas são fixas (as equipes e as metas usam). Nome, situação e turmas são seus.",
    cohorts: "Turmas",
    newCohort: "Nova turma",
    cohortName: "Nome da turma",
    inactive: "Inativa",
    programSaved: "Programa salvo",
  },
  reunioes: {
    title: "Reuniões",
    bodyMember: "Peça uma conversa individual com o seu educador. Ele responde por aqui e você recebe aviso.",
    bodyEducator: "Pedidos de reunião dos membros. Confirme um horário, sugira outro ou responda.",
    ask: "Pedir reunião",
    asked: "Pedido enviado. Seu educador foi avisado.",
    with: "Com quem",
    mine: "meu educador",
    reason: "Motivo",
    reasonHint: "O que você quer conversar?",
    availability: "Quando você pode",
    availabilityHint: "Ex.: qualquer dia depois das 19h, sábado de manhã",
    send: "Enviar pedido",
    emptyMember: "Você ainda não pediu nenhuma reunião.",
    emptyEducator: "Nenhum pedido de reunião por enquanto.",
    estados: { solicitada: "Pedido enviado", confirmada: "Confirmada", remarcar: "Outro horário", recusada: "Não confirmada", cancelada: "Cancelada", realizada: "Realizada" },
    acoes: { confirmar: "Confirmar", remarcar: "Sugerir outro horário", recusar: "Não agora" },
    answer: "Responder",
    when: "Data e hora",
    where: "Onde",
    whereHint: "Centro, chamada de vídeo, link…",
    message: "Mensagem",
    reply: "Resposta",
    markDone: "Realizada",
    cancel: "Cancelar",
    cancelConfirm: "Cancelar esta reunião?",
    saved: "Reunião atualizada",
    new: "Novo",
    askedOn: (date) => `Pedido em ${date}`,
    notified: (channels) => `aviso por ${channels}`,
    noChannel: "sino",
    closed: (n) => (n === 1 ? "1 reunião encerrada" : `${n} reuniões encerradas`),
    homeCard: "Falar com o educador",
    homeBody: "Está com dificuldade? Peça uma reunião individual. Seu educador recebe o pedido na hora.",
    homePending: (n) => (n === 1 ? "1 pedido aguardando resposta" : `${n} pedidos aguardando resposta`),
  },
  caixa: {
    title: "Caixa da equipe",
    body: "O dinheiro da equipe durante o testemunho: o que entra, o que sai e quanto sobra.",
    adminTitle: "Caixa das equipes",
    adminBody: "Saldo de cada equipe no testemunho. Abra uma equipe para ver e lançar.",
    balance: "Saldo",
    in: "Entradas",
    out: "Saídas",
    newEntry: "Novo lançamento",
    type: "Tipo",
    tipos: { entrada: "Entrada", saida: "Saída" },
    category: "Categoria",
    categorias: { rm: "Resultado de RM", doacao: "Doação", estadia: "Estadia", alimentacao: "Alimentação", transporte: "Transporte", material: "Material", outro: "Outro" },
    amount: "Valor",
    description: "Descrição",
    date: "Data",
    posted: "Lançamento feito",
    deleted: "Lançamento apagado",
    deleteConfirm: "Apagar este lançamento?",
    noEntries: "Nenhum lançamento ainda.",
    stayFee: "Taxa de estadia",
    stayFeeHint: "Por membro, por dia. O educador define; a capitã lança o período.",
    stayFeeMissing: "Sem taxa de estadia definida para esta equipe.",
    postStay: "Lançar estadia do período",
    postStayBody: (membros, taxa) => `${membros} membros × dias × ${taxa} por dia, como uma saída.`,
    from: "De",
    to: "Até",
    stayPosted: "Estadia lançada",
    byCategory: "Por categoria",
    readOnly: "Só a capitã, o capitão e o educador lançam no caixa; você vê.",
    automatic: "automático",
    team: "Equipe",
    entries: "Lançamentos",
    lastEntry: "Último",
    total: "Total",
    noTeam: "Você não está em uma equipe do testemunho.",
    saveFee: "Salvar taxa",
  },
  config: {
    body: "O que aparece para os membros e como o painel se comporta.",
    testemunhoModule: "Módulo Testemunho",
    visibleNow: "Visível para os membros",
    hiddenNow: "Oculto para os membros",
    projectRunning: (nome, periodo) => `Projeto de testemunho ativo: ${nome} (${periodo}).`,
    modos: {
      auto: { title: "Automático", body: "Aparece para os membros enquanto houver um projeto de testemunho ativo; some quando ele termina." },
      visivel: { title: "Sempre visível", body: "Os membros veem o módulo mesmo sem projeto ativo." },
      oculto: { title: "Oculto", body: "Os membros não veem o módulo; os convidados ficam guardados." },
    },
    educatorsAlways: "Educadores e administradores sempre veem o módulo, para preparar o próximo testemunho.",
    laterTitle: "Lembretes e integrações",
    saved: "Configuração salva",
  },
  missao: {
    title: "Áreas de missão",
    body: "Região → país → local (centro de testemunho). Cada equipe aponta para um local; o país e a região vêm daí.",
    resultsTitle: "Resultados por área",
    resultsBody: "Convidados por região, país, local e equipe no projeto de testemunho ativo.",
    regiao: "Região",
    pais: "País",
    local: "Local",
    equipe: "Equipe",
    semArea: "Sem área definida",
    addRegiao: "Nova região",
    addPais: "Novo país",
    addLocal: "Novo local",
    name: "Nome",
    byProgram: "Por programa",
    guests: "Convidados",
    forms: "Fichas",
    alerts: "Atenção",
    members: "Membros",
    membersWithGuest: "Com convidado",
    noTeams: "Nenhuma equipe no projeto de testemunho ainda.",
    areaLabel: "Área de missão (local)",
    noArea: "Sem área",
    saved: "Área salva",
    deleted: "Área apagada",
    expandAll: "Abrir tudo",
    collapseAll: "Fechar tudo",
  },
  biblioteca: {
    title: "Biblioteca",
    description: "Livros, materiais e vídeos que aparecem na biblioteca para pastores, membros e educadores. Os que vêm com o site ficam listados abaixo; aqui você adiciona novos por link.",
    add: "Adicionar à biblioteca",
    editItem: "Editar item",
    tipos: { livro: "Livros", material: "Materiais", video: "Vídeos" },
    tipo: "Tipo",
    idioma: "Idioma",
    titulo: "Título",
    subtitulo: "Subtítulo",
    url: "Link do arquivo",
    urlHint: "Um PDF ou documento acessível por link (Google Drive, Bunny, site). Abre em uma nova aba.",
    urlVideo: "Link do vídeo",
    urlVideoHint: "YouTube (a miniatura vem sozinha) ou outro link de vídeo.",
    thumbnail: "Link da miniatura (opcional)",
    published: "Publicado na biblioteca",
    hidden: "Oculto",
    hide: "Ocultar",
    publish: "Publicar",
    saved: "Item salvo",
    remove: "Apagar da biblioteca",
    removed: "Item apagado",
    empty: "Nada adicionado ainda neste tipo. Use \"Adicionar à biblioteca\".",
    shipped: "Já na biblioteca (vem com o site)",
    shippedHint: "Estes itens fazem parte do código do site e mudam em uma atualização, não por aqui.",
    addedBooks: "Outros livros",
    addedVideos: "Outros vídeos",
    open: "Abrir",
  },
};

const MESSAGES: Record<UserLanguage, PainelMessages> = { pt, en: pt, es: pt };

export function getPainelMessages(language: UserLanguage) {
  return MESSAGES[language] ?? pt;
}
