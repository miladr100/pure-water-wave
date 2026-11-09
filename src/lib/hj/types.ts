// The contract between the HJ Team panel's API routes (`/api/painel`,
// `/api/admin/hj`) and its screens. Money is always integer cents; dates
// that name a calendar day are `yyyy-mm-dd` strings in Brazil's calendar.
// See docs/painel for the requirements these shapes serve.

export const HJ_PROGRAMAS = ["HJA", "HJR", "PW", "STG", "UPA"] as const;
export type HjPrograma = (typeof HJ_PROGRAMAS)[number];

export const PROJETO_TIPOS = ["arrecadacao", "testemunho"] as const;
export type ProjetoTipo = (typeof PROJETO_TIPOS)[number];

// A report leaves the member as "enviado"; the captain (or an educator)
// turns it into "validado" or sends it back as "devolvido", which the member
// corrects and sends again.
export const RELATORIO_ESTADOS = ["enviado", "validado", "devolvido"] as const;
export type RelatorioEstado = (typeof RELATORIO_ESTADOS)[number];

export const CONVIDADO_ETAPAS = ["pre_gateway", "gateway", "sistema1", "sistema2", "jardim"] as const;
export type ConvidadoEtapa = (typeof CONVIDADO_ETAPAS)[number];

export const ACONTECIMENTO_TIPOS = ["contato", "gateway", "conferencia", "ficha", "etapa", "nota"] as const;
export type AcontecimentoTipo = (typeof ACONTECIMENTO_TIPOS)[number];

export const CONFERENCIAS_SISTEMA1 = 16;

export type Papeis = {
  membro: boolean;
  capitao: boolean;
  educador: boolean;
  administrador: boolean;
};

export type PessoaRef = { id: string; nome: string };

export type ProjetoResumo = {
  id: string;
  nome: string;
  tipo: ProjetoTipo;
  inicio: string;
  fim: string;
  ativo: boolean;
  // yyyy-mm-dd of the day the answer was built, in Brazil's calendar
  hoje: string;
  diaAtual: number;
  totalDias: number;
  diasDescanso: string[];
  moeda: string;
};

export type RegraNovaMeta = {
  fator: number;
  arredondarCents: number;
  minimoCents: number;
};

export type ProjetoAdmin = ProjetoResumo & {
  metaDiariaPadraoCents: number;
  metaTotalCents: number;
  metasPrograma: { programa: HjPrograma; metaCents: number }[];
  regraNovaMeta: RegraNovaMeta;
  equipes: number;
  membros: number;
};

export type ProjetoBody = {
  nome: string;
  tipo: ProjetoTipo;
  inicio: string;
  fim: string;
  ativo?: boolean;
  diasDescanso?: string[];
  moeda?: string;
  metaDiariaPadraoCents?: number;
  metaTotalCents?: number;
  metasPrograma?: { programa: HjPrograma; metaCents: number }[];
  regraNovaMeta?: Partial<RegraNovaMeta>;
  // copy teams (and their members) from this project
  copiarEquipesDe?: string | null;
};

export type EquipeResumo = {
  id: string;
  nome: string;
  programa: HjPrograma;
  capitao: PessoaRef | null;
  educador: PessoaRef | null;
};

export type RelatorioRow = {
  id: string;
  data: string;
  dinheiroCents: number;
  pixCents: number;
  despesasCents: number;
  liquidoCents: number;
  itens: number;
  contatos: number;
  observacoes: string;
  estado: RelatorioEstado;
  motivoDevolucao: string;
  enviadoEm: string;
  validadoPor: PessoaRef | null;
  validadoEm: string | null;
  membro: PessoaRef;
  equipe: { id: string; nome: string; programa: HjPrograma };
};

export type RelatorioBody = {
  data: string;
  dinheiroCents: number;
  pixCents: number;
  despesasCents: number;
  itens?: number;
  contatos?: number;
  observacoes?: string;
};

export type ValidacaoBody = {
  acao: "validar" | "devolver";
  motivo?: string;
};

export type DiaResumo = {
  data: string;
  descanso: boolean;
  // null when nothing was sent that day
  liquidoCents: number | null;
  estado: RelatorioEstado | null;
};

export type RmResumo = {
  metaCents: number;
  mediaCents: number;
  recordeCents: number;
  totalCents: number;
  diasEnviados: number;
  ultimos7: DiaResumo[];
};

export type ConvidadoAlerta = {
  tipo: "sem_contato" | "gateway_parado" | "ficha_pendente" | "sistema1_parado";
  texto: string;
};

export type ConvidadoDatas = {
  primeiroContato: string | null;
  gateway: string | null;
  fichaAssinada: string | null;
  inicioSistema1: string | null;
  fimSistema1: string | null;
  inicioSistema2: string | null;
  jardim: string | null;
};

export type ConvidadoRow = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  origem: string;
  etapa: ConvidadoEtapa;
  conferencias: number;
  ultimoContato: string | null;
  proximoObjetivo: string;
  responsavel: PessoaRef;
  equipe: { id: string; nome: string; programa: HjPrograma } | null;
  alerta: ConvidadoAlerta | null;
  datas: ConvidadoDatas;
  atualizadoEm: string;
};

export type Acontecimento = {
  id: string;
  tipo: AcontecimentoTipo;
  texto: string;
  data: string;
  autor: PessoaRef;
};

export type ConvidadoDetalhe = ConvidadoRow & {
  notas: string;
  acontecimentos: Acontecimento[];
  sugestoes: string[];
};

export type ConvidadoBody = {
  nome: string;
  telefone?: string;
  cidade?: string;
  origem?: string;
  etapa?: ConvidadoEtapa;
  conferencias?: number;
  proximoObjetivo?: string;
  notas?: string;
  datas?: Partial<ConvidadoDatas>;
  // an educator may file a guest under another member
  responsavelId?: string;
};

export type AcontecimentoBody = {
  tipo: AcontecimentoTipo;
  texto?: string;
  data?: string;
};

// ---------- member side ----------

export type PainelInicio = {
  membro: PessoaRef & { papeis: Papeis };
  projeto: ProjetoResumo | null;
  equipe: EquipeResumo | null;
  hoje: { data: string; descanso: boolean; relatorio: RelatorioRow | null };
  // earlier days the captain sent back, still to be corrected
  devolvidos: RelatorioRow[];
  rm: RmResumo | null;
  equipeHoje: { enviados: number; total: number; liquidoCents: number; pendentes: number } | null;
  testemunho: { total: number; atencao: { id: string; nome: string; alerta: ConvidadoAlerta }[] };
};

export type MeusRelatorios = {
  projeto: ProjetoResumo | null;
  rm: RmResumo | null;
  relatorios: RelatorioRow[];
};

export type EquipePainel = {
  equipe: EquipeResumo;
  projeto: ProjetoResumo;
  hoje: string;
  totalHojeCents: number;
  membros: {
    id: string;
    nome: string;
    capitao: boolean;
    hoje: RelatorioRow | null;
    totalCents: number;
    mediaCents: number;
    metaCents: number;
  }[];
  // sent, waiting for the captain
  pendentes: RelatorioRow[];
  historico: RelatorioRow[];
  // report id → whether this person may validate it (a captain does not
  // validate their own report; the educator does)
  podeValidar: Record<string, boolean>;
};

// ---------- educator / administrator side ----------

export type AdminHjInicio = {
  projeto: ProjetoResumo | null;
  totais: {
    liquidoCents: number;
    metaCents: number;
    membros: number;
    equipes: number;
    enviadosHoje: number;
    pendentesValidacao: number;
    devolvidos: number;
  };
  programas: { programa: HjPrograma; liquidoCents: number; metaCents: number; membros: number }[];
  equipes: {
    id: string;
    nome: string;
    programa: HjPrograma;
    educador: PessoaRef | null;
    capitao: PessoaRef | null;
    membros: number;
    enviadosHoje: number;
    liquidoHojeCents: number;
    liquidoCents: number;
  }[];
  // The testimony drive running today (a project of type "testemunho"),
  // with the guests of every team as they stand.
  testemunho: {
    projeto: ProjetoResumo | null;
    convidados: number;
    porEtapa: Record<ConvidadoEtapa, number>;
    alertas: number;
    porEquipe: { id: string; nome: string; programa: HjPrograma; convidados: number; alertas: number; sistema1: number; jardim: number }[];
    recentes: { id: string; convidado: PessoaRef; tipo: AcontecimentoTipo; texto: string; data: string; autor: PessoaRef }[];
  };
};

export type ResultadoLinha = {
  membro: PessoaRef;
  equipe: { id: string; nome: string; programa: HjPrograma };
  educador: PessoaRef | null;
  porDia: Record<string, { liquidoCents: number; estado: RelatorioEstado }>;
  totalCents: number;
  mediaCents: number;
  recordeCents: number;
  metaCents: number;
  diasEnviados: number;
};

export type AdminResultados = {
  projeto: ProjetoResumo | null;
  dias: { data: string; descanso: boolean }[];
  linhas: ResultadoLinha[];
  totais: {
    porDia: Record<string, number>;
    dinheiroCents: number;
    pixCents: number;
    despesasCents: number;
    liquidoCents: number;
    metaCents: number;
  };
  programas: { programa: HjPrograma; liquidoCents: number; metaCents: number; membros: number }[];
  filtros: {
    projetos: { id: string; nome: string }[];
    programas: HjPrograma[];
    equipes: { id: string; nome: string; programa: HjPrograma }[];
    educadores: PessoaRef[];
  };
};

export type PessoaRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  pais: string;
  papeis: Papeis;
  equipe: { id: string; nome: string; programa: HjPrograma } | null;
  criadoEm: string;
  ultimoAcesso: string | null;
};

export type PapeisBody = {
  educador?: boolean;
  administrador?: boolean;
};

export type EquipeAdmin = {
  id: string;
  nome: string;
  programa: HjPrograma;
  projeto: { id: string; nome: string };
  educador: PessoaRef | null;
  capitao: PessoaRef | null;
  membros: PessoaRef[];
  liquidoCents: number;
};

export type EquipeBody = {
  nome: string;
  programa: HjPrograma;
  projetoId: string;
  educadorId?: string | null;
  capitaoId?: string | null;
  membroIds?: string[];
};

export type ApiErrorBody = { error: string; code?: string; [key: string]: unknown };
