import type { UserLanguage } from "@/lib/user-languages";

// Same pattern as the library: one typed object per language, Portuguese is
// the reference. Every screen reads copy through `useLocale().t`; a hardcoded
// string in a component is a bug.
export type AppMessages = {
  common: {
    academy: string;
    admin: string;
    menu: string;
    logout: string;
    loggingOut: string;
    language: string;
    search: string;
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    back: string;
    loading: string;
    error: string;
    retry: string;
    yes: string;
    no: string;
    all: string;
    none: string;
    minutes: (n: number) => string;
    lessons: (n: number) => string;
    questions: (n: number) => string;
    activities: (n: number) => string;
  };
  header: {
    profile: string;
    academyTitle: string;
    academySubtitle: (firstName: string) => string;
    adminTitle: string;
    adminSubtitle: (firstName: string) => string;
    myCourses: string;
    catalog: string;
    myQuestions: string;
    overview: string;
    students: string;
    tutors: string;
    courses: string;
    inbox: string;
    grading: string;
    viewAcademy: string;
    viewAdmin: string;
    notifications: string;
    noNotifications: string;
    answeredBy: (name: string) => string;
  };
  auth: {
    login: string;
    loginDescription: string;
    email: string;
    password: string;
    confirmPassword: string;
    enter: string;
    entering: string;
    forgot: string;
    notRegistered: string;
    register: string;
    registerTitle: string;
    registerDescription: string;
    fullName: string;
    phone: string;
    country: string;
    city: string;
    birthYear: string;
    selectCountry: string;
    iAmTutor: string;
    tutorSecret: string;
    tutorSecretHint: string;
    create: string;
    creating: string;
    haveAccount: string;
    passwordsMismatch: string;
    passwordTooShort: string;
    emailInUse: string;
    backToSite: string;
    failed: string;
  };
  dashboard: {
    greeting: (firstName: string) => string;
    description: string;
    continueTitle: string;
    continueCta: string;
    myCourses: string;
    availableCourses: string;
    noCoursesYet: string;
    exploreCta: string;
    recommendedStart: string;
  };
  catalog: {
    otherLanguageHint: string;
    heading: string;
    description: string;
    view: string;
    continue: string;
    review: string;
    comingSoon: string;
    unlocked: string;
    completed: string;
    untranslated: string;
    starter: string;
    empty: string;
  };
  course: {
    enroll: string;
    enrolling: string;
    enrolled: string;
    continueCourse: string;
    progress: (pct: number) => string;
    module: (n: number) => string;
    lesson: (n: number) => string;
    activity: string;
    finalActivity: string;
    moduleActivity: string;
    locked: string;
    lockedModule: string;
    lockedLessons: string;
    lockedModules: string;
    lockedNotEnrolled: string;
    passed: (pct: number) => string;
    failed: (pct: number) => string;
    doActivity: string;
    retryActivity: string;
    viewResult: string;
    completedTitle: string;
    completedBody: string;
    unlocksTitle: string;
    courseLockedTitle: string;
    courseLockedBody: string;
    courseLockedOpeners: string;
    about: string;
    speaker: string;
    comingSoonBody: string;
    watch: string;
    rewatch: string;
    inProgressTitle: string;
    inProgressBody: string;
  };
  player: {
    resumeTitle: string;
    resumeContinue: string;
    resumeRestart: string;
    seekBlocked: string;
    materials: string;
    nextLesson: string;
    goToActivity: string;
    goToFinal: string;
    courseDone: string;
    backToCourse: string;
    play: string;
    pause: string;
    speed: string;
    saving: string;
    upNext: (title: string) => string;
    watchOnYoutube: string;
    notReady: string;
    fullscreen: string;
    skipBack: string;
    skipForward: string;
    seek: string;
  };
  exam: {
    introTitle: string;
    introBody: string;
    introReviewNote: string;
    start: string;
    questionOf: (n: number, total: number) => string;
    multiHint: string;
    textHint: string;
    reflectionHint: string;
    trueLabel: string;
    falseLabel: string;
    submit: string;
    submitting: string;
    answeredOf: (answered: number, required: number) => string;
    resultTitle: string;
    score: (correct: number, total: number, pct: number) => string;
    passed: string;
    notPassed: (threshold: number) => string;
    correct: string;
    incorrect: string;
    pending: string;
    reviewed: string;
    sent: string;
    correctAnswer: string;
    explanationOk: string;
    explanationBad: string;
    tutorFeedback: string;
    retry: string;
    nextLesson: string;
    finalActivity: string;
    viewCourse: string;
    unansweredError: string;
    locked: string;
  };
  questions: {
    title: string;
    placeholder: string;
    ask: string;
    asking: string;
    yourQuestions: string;
    answered: string;
    pending: string;
    empty: string;
    tooMany: string;
    heading: string;
    description: string;
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
  profile: {
    heading: string;
    description: string;
    photoSection: string;
    changePhoto: string;
    removePhoto: string;
    photoHint: string;
    uploading: string;
    photoSaved: string;
    photoTooLarge: string;
    dataSection: string;
    birthday: string;
    saved: string;
    accountSection: string;
    newEmail: string;
    confirmWithPassword: string;
    changeEmail: string;
    emailChanged: string;
    preferencesSection: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    otherLanguage: string;
    otherLanguageHint: string;
    tutorSection: string;
    tutorHint: string;
    tutorNone: string;
    noTutorsYet: string;
    tutorSaved: string;
    memberSince: (date: string) => string;
    incompleteTitle: string;
    incompleteBody: string;
    incompleteCta: string;
  };
  admin: {
    overviewHeading: string;
    overviewDescription: string;
    statStudents: string;
    statTutors: string;
    statCourses: string;
    statOpenQuestions: string;
    statGrading: string;
    statFirstContact: string;
    recentStudents: string;
    recentQuestions: string;
    studentsHeading: string;
    studentsDescription: string;
    searchStudents: string;
    filterAll: string;
    filterNoContact: string;
    filterContacted: string;
    colName: string;
    colCountry: string;
    colTutor: string;
    colCourses: string;
    colSignedUp: string;
    colFirstContact: string;
    colLastSeen: string;
    noStudents: string;
    firstContactDone: string;
    firstContactPending: string;
    markFirstContact: string;
    unmarkFirstContact: string;
    notes: string;
    notesPlaceholder: string;
    assignTutor: string;
    noTutor: string;
    convertToTutor: string;
    convertConfirm: string;
    revokeTutor: string;
    enrollments: string;
    noEnrollments: string;
    examState: { aprovado: string; reprovado: string; pendente: string };
    tutorsHeading: string;
    tutorsDescription: string;
    noTutors: string;
    coursesHeading: string;
    coursesDescription: string;
    newCourse: string;
    published: string;
    draft: string;
    publish: string;
    unpublish: string;
    noCourses: string;
    courseTitle: string;
    courseSlug: string;
    courseDescription: string;
    courseCover: string;
    courseSpeaker: string;
    courseLanguage: string;
    courseStarter: string;
    courseOrder: string;
    coursePrerequisites: string;
    coursePrerequisitesHint: string;
    modules: string;
    newModule: string;
    moduleTitle: string;
    lessonsOf: string;
    newLesson: string;
    lessonTitle: string;
    lessonDescription: string;
    lessonDuration: string;
    lessonVideo: string;
    providerYoutube: string;
    providerBunny: string;
    youtubeIdHint: string;
    bunnyIdHint: string;
    uploadVideo: string;
    uploading: (pct: number) => string;
    processing: string;
    materials: string;
    materialLabel: string;
    materialUrl: string;
    addMaterial: string;
    activity: string;
    newActivity: string;
    finalActivityLabel: string;
    moduleActivityLabel: string;
    passThreshold: string;
    requiredToAdvance: string;
    questionsHeading: string;
    newQuestion: string;
    questionType: string;
    qtypes: Record<"single" | "multi" | "truefalse" | "text" | "reflection", string>;
    questionText: string;
    statementIsTrue: string;
    explanation: string;
    options: string;
    addOption: string;
    correct: string;
    deleteConfirm: string;
    cannotDeleteWithProgress: string;
    saved: string;
    inboxHeading: string;
    inboxDescription: string;
    answerPlaceholder: string;
    answer: string;
    answering: string;
    archive: string;
    noQuestions: string;
    gradingHeading: string;
    gradingDescription: string;
    feedbackPlaceholder: string;
    markReviewed: string;
    noGrading: string;
    reflectionTag: string;
    languageTabs: Record<UserLanguage, string>;
    tutorView: string;
    openInAcademy: string;
    edit: string;
    create: string;
    moveUp: string;
    moveDown: string;
    statusOpen: string;
    statusAnswered: string;
    statusArchived: string;
    videoReady: string;
  };
};

const pt: AppMessages = {
  common: {
    academy: "Academia",
    admin: "Painel",
    menu: "Menu",
    logout: "Sair",
    loggingOut: "Saindo...",
    language: "Idioma",
    search: "Buscar",
    save: "Salvar",
    saving: "Salvando...",
    cancel: "Cancelar",
    delete: "Excluir",
    back: "Voltar",
    loading: "Carregando...",
    error: "Algo deu errado. Tente novamente.",
    retry: "Tentar novamente",
    yes: "Sim",
    no: "Não",
    all: "Todos",
    none: "Nenhum",
    minutes: (n) => `${n} min`,
    lessons: (n) => (n === 1 ? "1 aula" : `${n} aulas`),
    questions: (n) => (n === 1 ? "1 pergunta" : `${n} perguntas`),
    activities: (n) => (n === 1 ? "1 atividade" : `${n} atividades`),
  },
  header: {
    profile: "Meu perfil",
    academyTitle: "Academia Água Pura",
    academySubtitle: (firstName) => `Bem-vindo(a), ${firstName}`,
    adminTitle: "Painel de tutores",
    adminSubtitle: (firstName) => `Olá, ${firstName}`,
    myCourses: "Meus cursos",
    catalog: "Cursos",
    myQuestions: "Minhas perguntas",
    overview: "Visão geral",
    students: "Alunos",
    tutors: "Tutores",
    courses: "Cursos",
    inbox: "Perguntas",
    grading: "Correções",
    viewAcademy: "Ver a academia",
    viewAdmin: "Painel",
    notifications: "Notificações",
    noNotifications: "Nenhuma resposta nova.",
    answeredBy: (name) => `Respondida por ${name}`,
  },
  auth: {
    login: "Entrar",
    loginDescription: "Acesse a Academia Água Pura com seu e-mail e senha.",
    email: "E-mail",
    password: "Senha",
    confirmPassword: "Confirmar senha",
    enter: "Entrar",
    entering: "Entrando...",
    forgot: "Esqueci minha senha",
    notRegistered: "Este usuário não está cadastrado",
    register: "Criar minha conta",
    registerTitle: "Criar conta",
    registerDescription: "A academia é gratuita. Preencha seus dados para começar.",
    fullName: "Nome completo",
    phone: "Telefone (WhatsApp)",
    country: "País",
    city: "Cidade",
    birthYear: "Ano de nascimento",
    selectCountry: "Selecione o país",
    iAmTutor: "Sou tutor(a) da equipe Água Pura",
    tutorSecret: "Segredo de tutor",
    tutorSecretHint: "Peça o segredo à coordenação. Sem ele a conta é criada como aluno.",
    create: "Criar conta",
    creating: "Criando...",
    haveAccount: "Já tenho conta",
    passwordsMismatch: "As senhas não coincidem.",
    passwordTooShort: "A senha deve ter pelo menos 6 caracteres.",
    emailInUse: "Este e-mail já está em uso.",
    backToSite: "Voltar para o site",
    failed: "Não foi possível entrar. Tente novamente.",
  },
  dashboard: {
    greeting: (firstName) => `Olá, ${firstName}!`,
    description: "Continue de onde parou ou escolha um novo curso.",
    continueTitle: "Continuar assistindo",
    continueCta: "Continuar",
    myCourses: "Meus cursos",
    availableCourses: "Cursos disponíveis",
    noCoursesYet: "Você ainda não está inscrito em nenhum curso.",
    exploreCta: "Explorar cursos",
    recommendedStart: "Recomendamos começar por:",
  },
  catalog: {
    otherLanguageHint: "Não vê o curso que procura? Ative \"Ver cursos em outros idiomas\" no seu perfil.",
    heading: "Cursos",
    description: "Trilhas em vídeo com atividades de revisão e acompanhamento de tutores.",
    view: "Ver curso",
    continue: "Continuar",
    review: "Revisar",
    comingSoon: "Em breve",
    unlocked: "Desbloqueado",
    completed: "Concluído",
    untranslated: "Conteúdo ainda não traduzido para o seu idioma.",
    starter: "Comece por aqui",
    empty: "Nenhum curso publicado ainda.",
  },
  course: {
    enroll: "Inscrever-me grátis",
    enrolling: "Inscrevendo...",
    enrolled: "Inscrito",
    continueCourse: "Continuar curso",
    progress: (pct) => `${pct}% concluído`,
    module: (n) => `Módulo ${n}`,
    lesson: (n) => `Aula ${n}`,
    activity: "Atividade de revisão",
    finalActivity: "Atividade final",
    moduleActivity: "Atividade do módulo",
    locked: "Bloqueado",
    lockedModule: "Conclua a atividade do módulo anterior para desbloquear.",
    lockedLessons: "Assista todas as aulas do módulo para liberar a atividade.",
    lockedModules: "Conclua todos os módulos para liberar a atividade final.",
    lockedNotEnrolled: "Inscreva-se no curso para assistir.",
    passed: (pct) => `Aprovado · ${pct}%`,
    failed: (pct) => `Não aprovado · ${pct}%`,
    doActivity: "Fazer atividade",
    retryActivity: "Tentar de novo",
    viewResult: "Ver resultado",
    completedTitle: "Parabéns, você concluiu o curso!",
    completedBody: "Continue sua jornada com os cursos que acabaram de se abrir para você.",
    unlocksTitle: "Novos cursos desbloqueados",
    courseLockedTitle: "Este curso ainda está bloqueado",
    courseLockedBody: "Conclua um dos cursos abaixo para desbloqueá-lo.",
    courseLockedOpeners: "Cursos que desbloqueiam este:",
    about: "Sobre este curso",
    speaker: "Palestrante",
    comingSoonBody: "As aulas deste curso ainda estão sendo preparadas.",
    watch: "Assistir",
    rewatch: "Rever",
    inProgressTitle: "Falta pouco!",
    inProgressBody: "Você ainda não concluiu este curso. Continue de onde parou.",
  },
  player: {
    resumeTitle: "Continuar de onde parou?",
    resumeContinue: "Continuar",
    resumeRestart: "Começar de novo",
    seekBlocked: "Você não pode adiantar o conteúdo até assisti-lo uma vez.",
    materials: "Materiais de apoio",
    nextLesson: "Próxima aula",
    goToActivity: "Fazer a atividade do módulo",
    goToFinal: "Fazer a atividade final",
    courseDone: "Ver curso concluído",
    backToCourse: "Voltar ao curso",
    play: "Reproduzir",
    pause: "Pausar",
    speed: "Velocidade",
    saving: "Salvando progresso...",
    upNext: (title) => `A seguir: ${title}`,
    watchOnYoutube: "Abrir no YouTube",
    notReady: "O vídeo desta aula ainda não está disponível.",
    fullscreen: "Tela cheia",
    skipBack: "Voltar 10 segundos",
    skipForward: "Avançar 10 segundos",
    seek: "Posição do vídeo",
  },
  exam: {
    introTitle: "Atividade de revisão",
    introBody:
      "As perguntas de múltipla escolha são corrigidas na hora. As respostas escritas são lidas por um tutor e não contam na nota. Você pode refazer a atividade quantas vezes quiser.",
    introReviewNote: "Você pode mudar suas respostas antes de enviar.",
    start: "Começar",
    questionOf: (n, total) => `Pergunta ${n} de ${total}`,
    multiHint: "Pode haver mais de uma resposta correta.",
    textHint: "Responda com suas palavras. Um tutor vai ler sua resposta.",
    reflectionHint: "Não há resposta certa. Você pode deixar em branco.",
    trueLabel: "Verdadeiro",
    falseLabel: "Falso",
    submit: "Enviar respostas",
    submitting: "Enviando...",
    answeredOf: (answered, required) => `${answered} de ${required} respondidas`,
    resultTitle: "Resultado",
    score: (correct, total, pct) => `${correct} de ${total} corretas · ${pct}%`,
    passed: "Aprovado!",
    notPassed: (threshold) => `Você precisa de ${threshold}% para avançar.`,
    correct: "Correta",
    incorrect: "Incorreta",
    pending: "Aguardando revisão",
    reviewed: "Revisada",
    sent: "Enviada",
    correctAnswer: "Resposta correta",
    explanationOk: "Muito bem. Na verdade foi assim:",
    explanationBad: "Incorreto. Na verdade foi assim:",
    tutorFeedback: "Comentário do tutor",
    retry: "Refazer atividade",
    nextLesson: "Próxima aula",
    finalActivity: "Ir para a atividade final",
    viewCourse: "Ver o curso",
    unansweredError: "Responda todas as perguntas obrigatórias antes de enviar.",
    locked: "Esta atividade ainda está bloqueada.",
  },
  questions: {
    title: "Perguntas sobre esta aula",
    placeholder: "Escreva sua pergunta para o tutor...",
    ask: "Enviar pergunta",
    asking: "Enviando...",
    yourQuestions: "Suas perguntas nesta aula",
    answered: "Respondida",
    pending: "Aguardando resposta",
    empty: "Você ainda não fez perguntas.",
    tooMany: "Você já tem 5 perguntas em aberto neste curso. Aguarde as respostas.",
    heading: "Minhas perguntas",
    description: "Tudo o que você perguntou aos tutores, com as respostas.",
  },
  settings: {
    open: "Abrir configurações",
    title: "Configurações",
    description: "Atualize seu nome, sua senha, o tema e o idioma.",
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
  profile: {
    heading: "Meu perfil",
    description: "Seus dados, sua conta e como você prefere usar a academia.",
    photoSection: "Foto",
    changePhoto: "Trocar foto",
    removePhoto: "Remover foto",
    photoHint: "JPG, PNG ou WebP, até 4 MB. A foto é recortada em quadrado.",
    uploading: "Enviando...",
    photoSaved: "Foto atualizada.",
    photoTooLarge: "A imagem é grande demais (máximo 4 MB).",
    dataSection: "Meus dados",
    birthday: "Data de nascimento",
    saved: "Dados salvos.",
    accountSection: "Conta",
    newEmail: "Novo e-mail",
    confirmWithPassword: "Confirme com sua senha atual",
    changeEmail: "Alterar e-mail",
    emailChanged: "E-mail alterado. Use o novo e-mail para entrar.",
    preferencesSection: "Preferências",
    theme: "Tema",
    themeLight: "Claro",
    themeDark: "Escuro",
    themeSystem: "Sistema",
    otherLanguage: "Ver cursos em outros idiomas",
    otherLanguageHint: "Por padrão você vê só os cursos gravados no seu idioma.",
    tutorSection: "Meu tutor",
    tutorHint: "Quem acompanha o seu caminho na academia. Você pode mudar quando quiser.",
    tutorNone: "Sem tutor por enquanto",
    noTutorsYet: "Ainda não há tutores disponíveis.",
    tutorSaved: "Tutor atualizado.",
    memberSince: (date) => `Na academia desde ${date}`,
    incompleteTitle: "Complete seu perfil",
    incompleteBody: "Falta telefone ou data de nascimento. Isso ajuda o tutor a entrar em contato.",
    incompleteCta: "Completar perfil",
  },
  admin: {
    overviewHeading: "Visão geral",
    overviewDescription: "O que precisa da sua atenção hoje.",
    statStudents: "Alunos",
    statTutors: "Tutores",
    statCourses: "Cursos publicados",
    statOpenQuestions: "Perguntas abertas",
    statGrading: "Respostas a revisar",
    statFirstContact: "Sem primeiro contato",
    recentStudents: "Últimos cadastros",
    recentQuestions: "Últimas perguntas",
    studentsHeading: "Alunos",
    studentsDescription: "Todos os alunos cadastrados, com progresso e primeiro contato.",
    searchStudents: "Buscar por nome ou e-mail",
    filterAll: "Todos",
    filterNoContact: "Sem primeiro contato",
    filterContacted: "Já contatados",
    colName: "Nome",
    colCountry: "País",
    colTutor: "Tutor",
    colCourses: "Cursos",
    colSignedUp: "Cadastro",
    colFirstContact: "Primeiro contato",
    colLastSeen: "Último acesso",
    noStudents: "Nenhum aluno encontrado.",
    firstContactDone: "Feito",
    firstContactPending: "Pendente",
    markFirstContact: "Marcar primeiro contato",
    unmarkFirstContact: "Desfazer primeiro contato",
    notes: "Anotações do tutor",
    notesPlaceholder: "Como foi o contato, o que o aluno precisa...",
    assignTutor: "Tutor responsável",
    noTutor: "Sem tutor",
    convertToTutor: "Converter em tutor",
    convertConfirm: "Esta pessoa passará a ter acesso ao painel. Confirmar?",
    revokeTutor: "Voltar a aluno",
    enrollments: "Inscrições",
    noEnrollments: "Ainda não se inscreveu em nenhum curso.",
    examState: { aprovado: "Aprovado", reprovado: "Reprovado", pendente: "Pendente" },
    tutorsHeading: "Tutores",
    tutorsDescription: "Quem acompanha os alunos e administra a academia.",
    noTutors: "Nenhum tutor ainda.",
    coursesHeading: "Cursos",
    coursesDescription: "Crie trilhas, aulas e atividades de revisão.",
    newCourse: "Novo curso",
    published: "Publicado",
    draft: "Rascunho",
    publish: "Publicar",
    unpublish: "Despublicar",
    noCourses: "Nenhum curso ainda. Crie o primeiro.",
    courseTitle: "Título",
    courseSlug: "Endereço (slug)",
    courseDescription: "Descrição",
    courseCover: "URL da capa",
    courseSpeaker: "Palestrante",
    courseLanguage: "Idioma dos vídeos",
    courseStarter: "Curso recomendado para começar",
    courseOrder: "Ordem",
    coursePrerequisites: "Pré-requisitos",
    coursePrerequisitesHint: "O aluno precisa concluir qualquer um destes cursos para ver este.",
    modules: "Módulos",
    newModule: "Novo módulo",
    moduleTitle: "Título do módulo",
    lessonsOf: "Aulas",
    newLesson: "Nova aula",
    lessonTitle: "Título da aula",
    lessonDescription: "Descrição",
    lessonDuration: "Duração (min)",
    lessonVideo: "Vídeo",
    providerYoutube: "YouTube",
    providerBunny: "Bunny Stream (privado)",
    youtubeIdHint: "Cole o link ou o ID do vídeo no YouTube.",
    bunnyIdHint: "GUID do vídeo na biblioteca Bunny Stream, ou envie o arquivo.",
    uploadVideo: "Enviar vídeo",
    uploading: (pct) => `Enviando... ${pct}%`,
    processing: "Processando no Bunny...",
    materials: "Materiais de apoio",
    materialLabel: "Nome",
    materialUrl: "Link",
    addMaterial: "Adicionar material",
    activity: "Atividade de revisão",
    newActivity: "Criar atividade",
    finalActivityLabel: "Atividade final do curso",
    moduleActivityLabel: "Atividade do módulo",
    passThreshold: "Nota mínima (%)",
    requiredToAdvance: "Obrigatória para avançar ao próximo módulo",
    questionsHeading: "Perguntas",
    newQuestion: "Nova pergunta",
    questionType: "Tipo",
    qtypes: {
      single: "Múltipla escolha (uma correta)",
      multi: "Múltipla escolha (várias corretas)",
      truefalse: "Verdadeiro ou falso",
      text: "Resposta escrita (revisada pelo tutor)",
      reflection: "Reflexão (opcional)",
    },
    questionText: "Enunciado",
    statementIsTrue: "A afirmação é verdadeira",
    explanation: "Explicação (mostrada depois da correção)",
    options: "Alternativas",
    addOption: "Adicionar alternativa",
    correct: "Correta",
    deleteConfirm: "Excluir definitivamente?",
    cannotDeleteWithProgress: "Não é possível excluir: há alunos com progresso aqui. Despublique em vez disso.",
    saved: "Salvo.",
    inboxHeading: "Perguntas dos alunos",
    inboxDescription: "Responda e o aluno recebe uma notificação na academia.",
    answerPlaceholder: "Escreva a resposta...",
    answer: "Responder",
    answering: "Enviando...",
    archive: "Arquivar",
    noQuestions: "Nenhuma pergunta por enquanto.",
    gradingHeading: "Respostas escritas",
    gradingDescription: "Leia as respostas abertas e deixe um comentário para o aluno.",
    feedbackPlaceholder: "Comentário para o aluno (opcional)",
    markReviewed: "Marcar como revisada",
    noGrading: "Nada para revisar.",
    reflectionTag: "Reflexão",
    languageTabs: { pt: "Português", en: "English", es: "Español" },
    tutorView: "Visão de tutor: tudo está desbloqueado e o progresso não é salvo.",
    openInAcademy: "Abrir na academia",
    edit: "Editar",
    create: "Criar",
    moveUp: "Mover para cima",
    moveDown: "Mover para baixo",
    statusOpen: "Abertas",
    statusAnswered: "Respondidas",
    statusArchived: "Arquivadas",
    videoReady: "Vídeo pronto.",
  },
};

const en: AppMessages = {
  common: {
    academy: "Academy",
    admin: "Panel",
    menu: "Menu",
    logout: "Sign out",
    loggingOut: "Signing out...",
    language: "Language",
    search: "Search",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    delete: "Delete",
    back: "Back",
    loading: "Loading...",
    error: "Something went wrong. Please try again.",
    retry: "Try again",
    yes: "Yes",
    no: "No",
    all: "All",
    none: "None",
    minutes: (n) => `${n} min`,
    lessons: (n) => (n === 1 ? "1 lesson" : `${n} lessons`),
    questions: (n) => (n === 1 ? "1 question" : `${n} questions`),
    activities: (n) => (n === 1 ? "1 activity" : `${n} activities`),
  },
  header: {
    profile: "My profile",
    academyTitle: "Pure Water Academy",
    academySubtitle: (firstName) => `Welcome, ${firstName}`,
    adminTitle: "Tutor panel",
    adminSubtitle: (firstName) => `Hello, ${firstName}`,
    myCourses: "My courses",
    catalog: "Courses",
    myQuestions: "My questions",
    overview: "Overview",
    students: "Students",
    tutors: "Tutors",
    courses: "Courses",
    inbox: "Questions",
    grading: "Reviews",
    viewAcademy: "View the academy",
    viewAdmin: "Panel",
    notifications: "Notifications",
    noNotifications: "No new answers.",
    answeredBy: (name) => `Answered by ${name}`,
  },
  auth: {
    login: "Sign in",
    loginDescription: "Access the Pure Water Academy with your email and password.",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    enter: "Sign in",
    entering: "Signing in...",
    forgot: "I forgot my password",
    notRegistered: "This user is not registered",
    register: "Create my account",
    registerTitle: "Create account",
    registerDescription: "The academy is free. Fill in your details to start.",
    fullName: "Full name",
    phone: "Phone (WhatsApp)",
    country: "Country",
    city: "City",
    birthYear: "Year of birth",
    selectCountry: "Select a country",
    iAmTutor: "I am a tutor on the Pure Water team",
    tutorSecret: "Tutor secret",
    tutorSecretHint: "Ask the coordination for the secret. Without it the account is a student account.",
    create: "Create account",
    creating: "Creating...",
    haveAccount: "I already have an account",
    passwordsMismatch: "The passwords do not match.",
    passwordTooShort: "The password must have at least 6 characters.",
    emailInUse: "This email is already in use.",
    backToSite: "Back to the site",
    failed: "Could not sign in. Please try again.",
  },
  dashboard: {
    greeting: (firstName) => `Hi, ${firstName}!`,
    description: "Pick up where you left off or choose a new course.",
    continueTitle: "Continue watching",
    continueCta: "Continue",
    myCourses: "My courses",
    availableCourses: "Available courses",
    noCoursesYet: "You are not enrolled in any course yet.",
    exploreCta: "Explore courses",
    recommendedStart: "We recommend starting with:",
  },
  catalog: {
    otherLanguageHint: "Can't find a course? Turn on \"Show courses in other languages\" in your profile.",
    heading: "Courses",
    description: "Video tracks with review activities and tutor follow-up.",
    view: "View course",
    continue: "Continue",
    review: "Review",
    comingSoon: "Coming soon",
    unlocked: "Unlocked",
    completed: "Completed",
    untranslated: "This content is not translated to your language yet.",
    starter: "Start here",
    empty: "No published courses yet.",
  },
  course: {
    enroll: "Enroll for free",
    enrolling: "Enrolling...",
    enrolled: "Enrolled",
    continueCourse: "Continue course",
    progress: (pct) => `${pct}% complete`,
    module: (n) => `Module ${n}`,
    lesson: (n) => `Lesson ${n}`,
    activity: "Review activity",
    finalActivity: "Final activity",
    moduleActivity: "Module activity",
    locked: "Locked",
    lockedModule: "Pass the previous module's activity to unlock.",
    lockedLessons: "Watch every lesson in the module to unlock the activity.",
    lockedModules: "Complete every module to unlock the final activity.",
    lockedNotEnrolled: "Enroll in the course to watch.",
    passed: (pct) => `Passed · ${pct}%`,
    failed: (pct) => `Not passed · ${pct}%`,
    doActivity: "Do the activity",
    retryActivity: "Try again",
    viewResult: "View result",
    completedTitle: "Congratulations, you completed the course!",
    completedBody: "Keep going with the courses that just opened for you.",
    unlocksTitle: "Newly unlocked courses",
    courseLockedTitle: "This course is still locked",
    courseLockedBody: "Complete one of the courses below to unlock it.",
    courseLockedOpeners: "Courses that unlock this one:",
    about: "About this course",
    speaker: "Speaker",
    comingSoonBody: "The lessons of this course are still being prepared.",
    watch: "Watch",
    rewatch: "Watch again",
    inProgressTitle: "Almost there!",
    inProgressBody: "You have not completed this course yet. Pick up where you left off.",
  },
  player: {
    resumeTitle: "Continue where you left off?",
    resumeContinue: "Continue",
    resumeRestart: "Start over",
    seekBlocked: "You cannot skip ahead until you have watched the content once.",
    materials: "Support materials",
    nextLesson: "Next lesson",
    goToActivity: "Do the module activity",
    goToFinal: "Do the final activity",
    courseDone: "View completed course",
    backToCourse: "Back to the course",
    play: "Play",
    pause: "Pause",
    speed: "Speed",
    saving: "Saving progress...",
    upNext: (title) => `Up next: ${title}`,
    watchOnYoutube: "Open on YouTube",
    notReady: "The video for this lesson is not available yet.",
    fullscreen: "Full screen",
    skipBack: "Back 10 seconds",
    skipForward: "Forward 10 seconds",
    seek: "Video position",
  },
  exam: {
    introTitle: "Review activity",
    introBody:
      "Multiple-choice questions are graded instantly. Written answers are read by a tutor and do not count towards the score. You can retake the activity as many times as you like.",
    introReviewNote: "You can change your answers before submitting.",
    start: "Start",
    questionOf: (n, total) => `Question ${n} of ${total}`,
    multiHint: "There may be more than one correct answer.",
    textHint: "Answer in your own words. A tutor will read it.",
    reflectionHint: "There is no right answer. You may leave it blank.",
    trueLabel: "True",
    falseLabel: "False",
    submit: "Submit answers",
    submitting: "Submitting...",
    answeredOf: (answered, required) => `${answered} of ${required} answered`,
    resultTitle: "Result",
    score: (correct, total, pct) => `${correct} of ${total} correct · ${pct}%`,
    passed: "Passed!",
    notPassed: (threshold) => `You need ${threshold}% to move on.`,
    correct: "Correct",
    incorrect: "Incorrect",
    pending: "Awaiting review",
    reviewed: "Reviewed",
    sent: "Sent",
    correctAnswer: "Correct answer",
    explanationOk: "Well done. Here is what actually happened:",
    explanationBad: "Incorrect. Here is what actually happened:",
    tutorFeedback: "Tutor's comment",
    retry: "Retake activity",
    nextLesson: "Next lesson",
    finalActivity: "Go to the final activity",
    viewCourse: "View the course",
    unansweredError: "Answer every required question before submitting.",
    locked: "This activity is still locked.",
  },
  questions: {
    title: "Questions about this lesson",
    placeholder: "Write your question for the tutor...",
    ask: "Send question",
    asking: "Sending...",
    yourQuestions: "Your questions in this lesson",
    answered: "Answered",
    pending: "Awaiting answer",
    empty: "You have not asked anything yet.",
    tooMany: "You already have 5 open questions in this course. Wait for the answers.",
    heading: "My questions",
    description: "Everything you asked the tutors, with their answers.",
  },
  settings: {
    open: "Open settings",
    title: "Settings",
    description: "Update your name, password, theme and language.",
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
    passwordsMismatch: "The passwords do not match.",
    appearance: "Appearance",
    light: "Light",
    dark: "Dark",
  },
  profile: {
    heading: "My profile",
    description: "Your details, your account and how you prefer to use the academy.",
    photoSection: "Photo",
    changePhoto: "Change photo",
    removePhoto: "Remove photo",
    photoHint: "JPG, PNG or WebP, up to 4 MB. The photo is cropped to a square.",
    uploading: "Uploading...",
    photoSaved: "Photo updated.",
    photoTooLarge: "The image is too large (4 MB maximum).",
    dataSection: "My details",
    birthday: "Date of birth",
    saved: "Details saved.",
    accountSection: "Account",
    newEmail: "New email",
    confirmWithPassword: "Confirm with your current password",
    changeEmail: "Change email",
    emailChanged: "Email changed. Use the new email to sign in.",
    preferencesSection: "Preferences",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    otherLanguage: "Show courses in other languages",
    otherLanguageHint: "By default you only see courses recorded in your language.",
    tutorSection: "My tutor",
    tutorHint: "Who follows your path in the academy. You can change it any time.",
    tutorNone: "No tutor for now",
    noTutorsYet: "No tutors available yet.",
    tutorSaved: "Tutor updated.",
    memberSince: (date) => `In the academy since ${date}`,
    incompleteTitle: "Complete your profile",
    incompleteBody: "Phone or date of birth is missing. It helps your tutor reach you.",
    incompleteCta: "Complete profile",
  },
  admin: {
    overviewHeading: "Overview",
    overviewDescription: "What needs your attention today.",
    statStudents: "Students",
    statTutors: "Tutors",
    statCourses: "Published courses",
    statOpenQuestions: "Open questions",
    statGrading: "Answers to review",
    statFirstContact: "No first contact",
    recentStudents: "Latest sign-ups",
    recentQuestions: "Latest questions",
    studentsHeading: "Students",
    studentsDescription: "Every registered student, with progress and first contact.",
    searchStudents: "Search by name or email",
    filterAll: "All",
    filterNoContact: "No first contact",
    filterContacted: "Contacted",
    colName: "Name",
    colCountry: "Country",
    colTutor: "Tutor",
    colCourses: "Courses",
    colSignedUp: "Signed up",
    colFirstContact: "First contact",
    colLastSeen: "Last seen",
    noStudents: "No students found.",
    firstContactDone: "Done",
    firstContactPending: "Pending",
    markFirstContact: "Mark first contact",
    unmarkFirstContact: "Undo first contact",
    notes: "Tutor notes",
    notesPlaceholder: "How the contact went, what the student needs...",
    assignTutor: "Assigned tutor",
    noTutor: "No tutor",
    convertToTutor: "Convert to tutor",
    convertConfirm: "This person will get access to the panel. Confirm?",
    revokeTutor: "Back to student",
    enrollments: "Enrollments",
    noEnrollments: "Not enrolled in any course yet.",
    examState: { aprovado: "Passed", reprovado: "Failed", pendente: "Pending" },
    tutorsHeading: "Tutors",
    tutorsDescription: "Who follows the students and runs the academy.",
    noTutors: "No tutors yet.",
    coursesHeading: "Courses",
    coursesDescription: "Create tracks, lessons and review activities.",
    newCourse: "New course",
    published: "Published",
    draft: "Draft",
    publish: "Publish",
    unpublish: "Unpublish",
    noCourses: "No courses yet. Create the first one.",
    courseTitle: "Title",
    courseSlug: "Address (slug)",
    courseDescription: "Description",
    courseCover: "Cover URL",
    courseSpeaker: "Speaker",
    courseLanguage: "Video language",
    courseStarter: "Recommended starter course",
    courseOrder: "Order",
    coursePrerequisites: "Prerequisites",
    coursePrerequisitesHint: "The student must complete any one of these courses to see this one.",
    modules: "Modules",
    newModule: "New module",
    moduleTitle: "Module title",
    lessonsOf: "Lessons",
    newLesson: "New lesson",
    lessonTitle: "Lesson title",
    lessonDescription: "Description",
    lessonDuration: "Duration (min)",
    lessonVideo: "Video",
    providerYoutube: "YouTube",
    providerBunny: "Bunny Stream (private)",
    youtubeIdHint: "Paste the YouTube link or video ID.",
    bunnyIdHint: "Video GUID in the Bunny Stream library, or upload the file.",
    uploadVideo: "Upload video",
    uploading: (pct) => `Uploading... ${pct}%`,
    processing: "Processing on Bunny...",
    materials: "Support materials",
    materialLabel: "Name",
    materialUrl: "Link",
    addMaterial: "Add material",
    activity: "Review activity",
    newActivity: "Create activity",
    finalActivityLabel: "Final activity of the course",
    moduleActivityLabel: "Module activity",
    passThreshold: "Pass mark (%)",
    requiredToAdvance: "Required to move to the next module",
    questionsHeading: "Questions",
    newQuestion: "New question",
    questionType: "Type",
    qtypes: {
      single: "Multiple choice (one correct)",
      multi: "Multiple choice (several correct)",
      truefalse: "True or false",
      text: "Written answer (reviewed by a tutor)",
      reflection: "Reflection (optional)",
    },
    questionText: "Statement",
    statementIsTrue: "The statement is true",
    explanation: "Explanation (shown after grading)",
    options: "Options",
    addOption: "Add option",
    correct: "Correct",
    deleteConfirm: "Delete permanently?",
    cannotDeleteWithProgress: "Cannot delete: students have progress here. Unpublish instead.",
    saved: "Saved.",
    inboxHeading: "Student questions",
    inboxDescription: "Answer and the student gets a notification in the academy.",
    answerPlaceholder: "Write the answer...",
    answer: "Answer",
    answering: "Sending...",
    archive: "Archive",
    noQuestions: "No questions for now.",
    gradingHeading: "Written answers",
    gradingDescription: "Read the open answers and leave a comment for the student.",
    feedbackPlaceholder: "Comment for the student (optional)",
    markReviewed: "Mark as reviewed",
    noGrading: "Nothing to review.",
    reflectionTag: "Reflection",
    languageTabs: { pt: "Português", en: "English", es: "Español" },
    tutorView: "Tutor view: everything is unlocked and progress is not saved.",
    openInAcademy: "Open in the academy",
    edit: "Edit",
    create: "Create",
    moveUp: "Move up",
    moveDown: "Move down",
    statusOpen: "Open",
    statusAnswered: "Answered",
    statusArchived: "Archived",
    videoReady: "Video ready.",
  },
};

const es: AppMessages = {
  common: {
    academy: "Academia",
    admin: "Panel",
    menu: "Menú",
    logout: "Salir",
    loggingOut: "Saliendo...",
    language: "Idioma",
    search: "Buscar",
    save: "Guardar",
    saving: "Guardando...",
    cancel: "Cancelar",
    delete: "Eliminar",
    back: "Volver",
    loading: "Cargando...",
    error: "Algo salió mal. Intenta de nuevo.",
    retry: "Reintentar",
    yes: "Sí",
    no: "No",
    all: "Todos",
    none: "Ninguno",
    minutes: (n) => `${n} min`,
    lessons: (n) => (n === 1 ? "1 clase" : `${n} clases`),
    questions: (n) => (n === 1 ? "1 pregunta" : `${n} preguntas`),
    activities: (n) => (n === 1 ? "1 actividad" : `${n} actividades`),
  },
  header: {
    profile: "Mi perfil",
    academyTitle: "Academia Agua Pura",
    academySubtitle: (firstName) => `Te damos la bienvenida, ${firstName}`,
    adminTitle: "Panel de tutores",
    adminSubtitle: (firstName) => `Hola, ${firstName}`,
    myCourses: "Mis cursos",
    catalog: "Cursos",
    myQuestions: "Mis preguntas",
    overview: "Resumen",
    students: "Estudiantes",
    tutors: "Tutores",
    courses: "Cursos",
    inbox: "Preguntas",
    grading: "Revisiones",
    viewAcademy: "Ver la academia",
    viewAdmin: "Panel",
    notifications: "Notificaciones",
    noNotifications: "No hay respuestas nuevas.",
    answeredBy: (name) => `Respondida por ${name}`,
  },
  auth: {
    login: "Ingresar",
    loginDescription: "Accede a la Academia Agua Pura con tu correo y contraseña.",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    enter: "Ingresar",
    entering: "Ingresando...",
    forgot: "Olvidé mi contraseña",
    notRegistered: "Este usuario no está registrado",
    register: "Crear mi cuenta",
    registerTitle: "Crear cuenta",
    registerDescription: "La academia es gratuita. Completa tus datos para empezar.",
    fullName: "Nombre completo",
    phone: "Teléfono (WhatsApp)",
    country: "País",
    city: "Ciudad",
    birthYear: "Año de nacimiento",
    selectCountry: "Selecciona el país",
    iAmTutor: "Soy tutor(a) del equipo Agua Pura",
    tutorSecret: "Secreto de tutor",
    tutorSecretHint: "Pide el secreto a la coordinación. Sin él la cuenta se crea como estudiante.",
    create: "Crear cuenta",
    creating: "Creando...",
    haveAccount: "Ya tengo cuenta",
    passwordsMismatch: "Las contraseñas no coinciden.",
    passwordTooShort: "La contraseña debe tener al menos 6 caracteres.",
    emailInUse: "Este correo ya está en uso.",
    backToSite: "Volver al sitio",
    failed: "No se pudo ingresar. Intenta de nuevo.",
  },
  dashboard: {
    greeting: (firstName) => `¡Hola, ${firstName}!`,
    description: "Continúa donde lo dejaste o elige un curso nuevo.",
    continueTitle: "Seguir viendo",
    continueCta: "Continuar",
    myCourses: "Mis cursos",
    availableCourses: "Cursos disponibles",
    noCoursesYet: "Todavía no estás inscrito en ningún curso.",
    exploreCta: "Explorar cursos",
    recommendedStart: "Te recomendamos empezar por:",
  },
  catalog: {
    otherLanguageHint: "¿No ves el curso que buscás? Activá \"Ver cursos en otros idiomas\" en tu perfil.",
    heading: "Cursos",
    description: "Trayectos en video con actividades de repaso y acompañamiento de tutores.",
    view: "Ver curso",
    continue: "Continuar",
    review: "Repasar",
    comingSoon: "Muy pronto",
    unlocked: "Desbloqueado",
    completed: "Completado",
    untranslated: "Este contenido aún no está traducido a tu idioma.",
    starter: "Empieza por aquí",
    empty: "Todavía no hay cursos publicados.",
  },
  course: {
    enroll: "Inscribirme gratis",
    enrolling: "Inscribiendo...",
    enrolled: "Inscrito",
    continueCourse: "Continuar curso",
    progress: (pct) => `${pct}% completado`,
    module: (n) => `Módulo ${n}`,
    lesson: (n) => `Clase ${n}`,
    activity: "Actividad de repaso",
    finalActivity: "Actividad final",
    moduleActivity: "Actividad del módulo",
    locked: "Bloqueado",
    lockedModule: "Aprueba la actividad del módulo anterior para desbloquear.",
    lockedLessons: "Mira todas las clases del módulo para habilitar la actividad.",
    lockedModules: "Completa todos los módulos para habilitar la actividad final.",
    lockedNotEnrolled: "Inscríbete en el curso para ver.",
    passed: (pct) => `Aprobado · ${pct}%`,
    failed: (pct) => `No aprobado · ${pct}%`,
    doActivity: "Hacer la actividad",
    retryActivity: "Intentar de nuevo",
    viewResult: "Ver resultado",
    completedTitle: "¡Felicitaciones, completaste el curso!",
    completedBody: "Sigue tu camino con los cursos que se acaban de abrir para ti.",
    unlocksTitle: "Nuevos cursos desbloqueados",
    courseLockedTitle: "Este curso todavía está bloqueado",
    courseLockedBody: "Completa uno de los cursos de abajo para desbloquearlo.",
    courseLockedOpeners: "Cursos que desbloquean este:",
    about: "Sobre este curso",
    speaker: "Expositor",
    comingSoonBody: "Las clases de este curso todavía se están preparando.",
    watch: "Ver",
    rewatch: "Volver a ver",
    inProgressTitle: "¡Falta poco!",
    inProgressBody: "Todavía no completaste este curso. Continúa donde lo dejaste.",
  },
  player: {
    resumeTitle: "¿Continuar donde quedaste?",
    resumeContinue: "Continuar",
    resumeRestart: "Empezar de nuevo",
    seekBlocked: "No puedes adelantar el contenido hasta reproducirlo una vez.",
    materials: "Materiales de apoyo",
    nextLesson: "Siguiente clase",
    goToActivity: "Hacer la actividad del módulo",
    goToFinal: "Hacer la actividad final",
    courseDone: "Ver curso completado",
    backToCourse: "Volver al curso",
    play: "Reproducir",
    pause: "Pausar",
    speed: "Velocidad",
    saving: "Guardando progreso...",
    upNext: (title) => `A continuación: ${title}`,
    watchOnYoutube: "Abrir en YouTube",
    notReady: "El video de esta clase todavía no está disponible.",
    fullscreen: "Pantalla completa",
    skipBack: "Retroceder 10 segundos",
    skipForward: "Adelantar 10 segundos",
    seek: "Posición del video",
  },
  exam: {
    introTitle: "Actividad de repaso",
    introBody:
      "Las preguntas de opción múltiple se corrigen al instante. Las respuestas escritas las lee un tutor y no cuentan para la nota. Puedes repetir la actividad las veces que quieras.",
    introReviewNote: "Puedes cambiar tus respuestas antes de enviar.",
    start: "Comenzar",
    questionOf: (n, total) => `Pregunta ${n} de ${total}`,
    multiHint: "Puede haber más de una respuesta correcta.",
    textHint: "Responde con tus palabras. Un tutor la va a leer.",
    reflectionHint: "No hay respuesta correcta. Puedes dejarla en blanco.",
    trueLabel: "Verdadero",
    falseLabel: "Falso",
    submit: "Enviar respuestas",
    submitting: "Enviando...",
    answeredOf: (answered, required) => `${answered} de ${required} respondidas`,
    resultTitle: "Resultado",
    score: (correct, total, pct) => `${correct} de ${total} correctas · ${pct}%`,
    passed: "¡Aprobado!",
    notPassed: (threshold) => `Necesitas ${threshold}% para avanzar.`,
    correct: "Correcta",
    incorrect: "Incorrecta",
    pending: "Pendiente de revisión",
    reviewed: "Revisada",
    sent: "Enviada",
    correctAnswer: "Respuesta correcta",
    explanationOk: "Muy bien. En realidad fue así:",
    explanationBad: "Incorrecto. En realidad fue así:",
    tutorFeedback: "Comentario del tutor",
    retry: "Repetir actividad",
    nextLesson: "Siguiente clase",
    finalActivity: "Ir a la actividad final",
    viewCourse: "Ver el curso",
    unansweredError: "Responde todas las preguntas obligatorias antes de enviar.",
    locked: "Esta actividad todavía está bloqueada.",
  },
  questions: {
    title: "Preguntas sobre esta clase",
    placeholder: "Escribe tu pregunta para el tutor...",
    ask: "Enviar pregunta",
    asking: "Enviando...",
    yourQuestions: "Tus preguntas en esta clase",
    answered: "Respondida",
    pending: "Esperando respuesta",
    empty: "Todavía no hiciste preguntas.",
    tooMany: "Ya tienes 5 preguntas abiertas en este curso. Espera las respuestas.",
    heading: "Mis preguntas",
    description: "Todo lo que preguntaste a los tutores, con las respuestas.",
  },
  settings: {
    open: "Abrir configuración",
    title: "Configuración",
    description: "Actualiza tu nombre, tu contraseña, el tema y el idioma.",
    name: "Nombre",
    saveName: "Guardar nombre",
    saving: "Guardando...",
    nameUpdated: "Nombre actualizado.",
    nameFailed: "No se pudo actualizar el nombre.",
    passwordSection: "Cambiar contraseña",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar nueva contraseña",
    changePassword: "Cambiar contraseña",
    changingPassword: "Cambiando...",
    passwordUpdated: "Contraseña cambiada.",
    passwordFailed: "No se pudo cambiar la contraseña.",
    passwordsMismatch: "Las contraseñas no coinciden.",
    appearance: "Apariencia",
    light: "Claro",
    dark: "Oscuro",
  },
  profile: {
    heading: "Mi perfil",
    description: "Tus datos, tu cuenta y cómo preferís usar la academia.",
    photoSection: "Foto",
    changePhoto: "Cambiar foto",
    removePhoto: "Quitar foto",
    photoHint: "JPG, PNG o WebP, hasta 4 MB. La foto se recorta en cuadrado.",
    uploading: "Subiendo...",
    photoSaved: "Foto actualizada.",
    photoTooLarge: "La imagen es demasiado grande (máximo 4 MB).",
    dataSection: "Mis datos",
    birthday: "Fecha de nacimiento",
    saved: "Datos guardados.",
    accountSection: "Cuenta",
    newEmail: "Nuevo correo",
    confirmWithPassword: "Confirmá con tu contraseña actual",
    changeEmail: "Cambiar correo",
    emailChanged: "Correo cambiado. Usá el nuevo correo para ingresar.",
    preferencesSection: "Preferencias",
    theme: "Tema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeSystem: "Sistema",
    otherLanguage: "Ver cursos en otros idiomas",
    otherLanguageHint: "Por defecto ves solo los cursos grabados en tu idioma.",
    tutorSection: "Mi tutor",
    tutorHint: "Quien acompaña tu camino en la academia. Podés cambiarlo cuando quieras.",
    tutorNone: "Sin tutor por ahora",
    noTutorsYet: "Todavía no hay tutores disponibles.",
    tutorSaved: "Tutor actualizado.",
    memberSince: (date) => `En la academia desde ${date}`,
    incompleteTitle: "Completá tu perfil",
    incompleteBody: "Falta el teléfono o la fecha de nacimiento. Ayuda al tutor a contactarte.",
    incompleteCta: "Completar perfil",
  },
  admin: {
    overviewHeading: "Resumen",
    overviewDescription: "Lo que necesita tu atención hoy.",
    statStudents: "Estudiantes",
    statTutors: "Tutores",
    statCourses: "Cursos publicados",
    statOpenQuestions: "Preguntas abiertas",
    statGrading: "Respuestas por revisar",
    statFirstContact: "Sin primer contacto",
    recentStudents: "Últimos registros",
    recentQuestions: "Últimas preguntas",
    studentsHeading: "Estudiantes",
    studentsDescription: "Todos los estudiantes registrados, con progreso y primer contacto.",
    searchStudents: "Buscar por nombre o correo",
    filterAll: "Todos",
    filterNoContact: "Sin primer contacto",
    filterContacted: "Ya contactados",
    colName: "Nombre",
    colCountry: "País",
    colTutor: "Tutor",
    colCourses: "Cursos",
    colSignedUp: "Registro",
    colFirstContact: "Primer contacto",
    colLastSeen: "Último acceso",
    noStudents: "No se encontraron estudiantes.",
    firstContactDone: "Hecho",
    firstContactPending: "Pendiente",
    markFirstContact: "Marcar primer contacto",
    unmarkFirstContact: "Deshacer primer contacto",
    notes: "Notas del tutor",
    notesPlaceholder: "Cómo fue el contacto, qué necesita el estudiante...",
    assignTutor: "Tutor responsable",
    noTutor: "Sin tutor",
    convertToTutor: "Convertir en tutor",
    convertConfirm: "Esta persona tendrá acceso al panel. ¿Confirmar?",
    revokeTutor: "Volver a estudiante",
    enrollments: "Inscripciones",
    noEnrollments: "Todavía no se inscribió en ningún curso.",
    examState: { aprovado: "Aprobado", reprovado: "Reprobado", pendente: "Pendiente" },
    tutorsHeading: "Tutores",
    tutorsDescription: "Quienes acompañan a los estudiantes y administran la academia.",
    noTutors: "Todavía no hay tutores.",
    coursesHeading: "Cursos",
    coursesDescription: "Crea trayectos, clases y actividades de repaso.",
    newCourse: "Nuevo curso",
    published: "Publicado",
    draft: "Borrador",
    publish: "Publicar",
    unpublish: "Despublicar",
    noCourses: "Todavía no hay cursos. Crea el primero.",
    courseTitle: "Título",
    courseSlug: "Dirección (slug)",
    courseDescription: "Descripción",
    courseCover: "URL de la portada",
    courseSpeaker: "Expositor",
    courseLanguage: "Idioma de los videos",
    courseStarter: "Curso recomendado para empezar",
    courseOrder: "Orden",
    coursePrerequisites: "Prerrequisitos",
    coursePrerequisitesHint: "El estudiante debe completar cualquiera de estos cursos para ver este.",
    modules: "Módulos",
    newModule: "Nuevo módulo",
    moduleTitle: "Título del módulo",
    lessonsOf: "Clases",
    newLesson: "Nueva clase",
    lessonTitle: "Título de la clase",
    lessonDescription: "Descripción",
    lessonDuration: "Duración (min)",
    lessonVideo: "Video",
    providerYoutube: "YouTube",
    providerBunny: "Bunny Stream (privado)",
    youtubeIdHint: "Pega el enlace o el ID del video de YouTube.",
    bunnyIdHint: "GUID del video en la biblioteca Bunny Stream, o sube el archivo.",
    uploadVideo: "Subir video",
    uploading: (pct) => `Subiendo... ${pct}%`,
    processing: "Procesando en Bunny...",
    materials: "Materiales de apoyo",
    materialLabel: "Nombre",
    materialUrl: "Enlace",
    addMaterial: "Agregar material",
    activity: "Actividad de repaso",
    newActivity: "Crear actividad",
    finalActivityLabel: "Actividad final del curso",
    moduleActivityLabel: "Actividad del módulo",
    passThreshold: "Nota mínima (%)",
    requiredToAdvance: "Obligatoria para pasar al siguiente módulo",
    questionsHeading: "Preguntas",
    newQuestion: "Nueva pregunta",
    questionType: "Tipo",
    qtypes: {
      single: "Opción múltiple (una correcta)",
      multi: "Opción múltiple (varias correctas)",
      truefalse: "Verdadero o falso",
      text: "Respuesta escrita (revisada por el tutor)",
      reflection: "Reflexión (opcional)",
    },
    questionText: "Enunciado",
    statementIsTrue: "La afirmación es verdadera",
    explanation: "Explicación (se muestra después de corregir)",
    options: "Opciones",
    addOption: "Agregar opción",
    correct: "Correcta",
    deleteConfirm: "¿Eliminar definitivamente?",
    cannotDeleteWithProgress: "No se puede eliminar: hay estudiantes con progreso aquí. Despublica en su lugar.",
    saved: "Guardado.",
    inboxHeading: "Preguntas de los estudiantes",
    inboxDescription: "Responde y el estudiante recibe una notificación en la academia.",
    answerPlaceholder: "Escribe la respuesta...",
    answer: "Responder",
    answering: "Enviando...",
    archive: "Archivar",
    noQuestions: "No hay preguntas por ahora.",
    gradingHeading: "Respuestas escritas",
    gradingDescription: "Lee las respuestas abiertas y deja un comentario para el estudiante.",
    feedbackPlaceholder: "Comentario para el estudiante (opcional)",
    markReviewed: "Marcar como revisada",
    noGrading: "Nada para revisar.",
    reflectionTag: "Reflexión",
    languageTabs: { pt: "Português", en: "English", es: "Español" },
    tutorView: "Vista de tutor: todo está desbloqueado y el progreso no se guarda.",
    openInAcademy: "Abrir en la academia",
    edit: "Editar",
    create: "Crear",
    moveUp: "Mover arriba",
    moveDown: "Mover abajo",
    statusOpen: "Abiertas",
    statusAnswered: "Respondidas",
    statusArchived: "Archivadas",
    videoReady: "Video listo.",
  },
};

export const APP_MESSAGES: Record<UserLanguage, AppMessages> = { pt, en, es };

export function getAppMessages(language: UserLanguage): AppMessages {
  return APP_MESSAGES[language] ?? pt;
}
