import type { UserLanguage } from "@/lib/user-languages";

// The HJ Team panel's copy. The panel serves the Brazilian teams, so
// Portuguese is the reference and, for now, the only text; the other two
// languages fall back to it until the group asks for translations. Every
// screen reads copy through `usePainelMessages()`.
export type PainelMessages = {
  areas: { painel: string; academia: string; admin: string; switchLabel: string };
  shell: {
    painelTitle: string;
    adminTitle: string;
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
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    save: string;
    saving: string;
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
  };
};

const pt: PainelMessages = {
  areas: { painel: "Painel", academia: "Academia", admin: "Administração", switchLabel: "Área" },
  shell: {
    painelTitle: "Painel HJ Team",
    adminTitle: "Administração",
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
  },
  common: {
    loading: "Carregando…",
    error: "Algo deu errado. Tente de novo.",
    retry: "Tentar de novo",
    save: "Salvar",
    saving: "Salvando…",
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
  },
};

const MESSAGES: Record<UserLanguage, PainelMessages> = { pt, en: pt, es: pt };

export function getPainelMessages(language: UserLanguage) {
  return MESSAGES[language] ?? pt;
}
