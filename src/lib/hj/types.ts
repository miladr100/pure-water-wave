import type { HjConfidencial, HjPerfil } from "@/lib/hj/perfil";

// The contract between the HJ Team panel's API routes (`/api/painel`,
// `/api/admin/hj`) and its screens. Money is always integer cents; dates
// that name a calendar day are `yyyy-mm-dd` strings in Brazil's calendar.
// See docs/painel for the requirements these shapes serve.

export const HJ_PROGRAMAS = ["HJA", "HJR", "PW", "STG", "UPA"] as const;
export type HjPrograma = (typeof HJ_PROGRAMAS)[number];

export const PROJETO_TIPOS = ["arrecadacao", "testemunho"] as const;

// The testimony module: shown to members while a testimony drive runs
// ("auto"), always, or never. Educators always see it.
export const MODULO_TESTEMUNHO_MODOS = ["auto", "visivel", "oculto"] as const;
export type ModuloTestemunhoModo = (typeof MODULO_TESTEMUNHO_MODOS)[number];

export type Modulos = { rm: boolean; testemunho: boolean };

export type ConfiguracoesAdmin = {
  modulos: { testemunho: ModuloTestemunhoModo };
  projetoTestemunho: ProjetoResumo | null;
  testemunhoVisivelParaMembros: boolean;
};

export type ConfiguracoesBody = { modulos?: { testemunho?: ModuloTestemunhoModo } };

// What the educator told a team or a member, written down.
export const ORIENTACAO_MODULOS = ["testemunho", "rm"] as const;
export type OrientacaoModulo = (typeof ORIENTACAO_MODULOS)[number];

export type OrientacaoRow = {
  id: string;
  modulo: OrientacaoModulo;
  equipe: PessoaRef | null;
  membro: PessoaRef | null;
  texto: string;
  data: string;
  autor: PessoaRef;
  criadaEm: string;
};

export type OrientacaoBody = {
  modulo: OrientacaoModulo;
  equipeId?: string;
  membroId?: string;
  texto: string;
  data?: string;
};

// The four indicators per team and the attention flag (src/lib/hj/testemunho.ts).
export type IndicadoresEquipe = { kit1: number; fichas: number; kit2: number; jardim: number };
export type AtencaoEquipe = { de: keyof IndicadoresEquipe; para: keyof IndicadoresEquipe; texto: string } | null;

export type EquipeTestemunhoRow = {
  id: string;
  nome: string;
  programa: HjPrograma;
  educador: PessoaRef | null;
  capitao: PessoaRef | null;
  membros: number;
  membrosComConvidado: number;
  convidados: number;
  indicadores: IndicadoresEquipe;
  atencao: AtencaoEquipe;
  orientacao: OrientacaoRow | null;
  area: AreaDaEquipe;
};

export type TestemunhoEquipes = {
  projeto: ProjetoResumo | null;
  equipes: EquipeTestemunhoRow[];
  totais: IndicadoresEquipe & { convidados: number; comAtencao: number };
};

// A member's request for a one-to-one with their educator.
export const REUNIAO_ESTADOS = ["solicitada", "confirmada", "remarcar", "recusada", "cancelada", "realizada"] as const;
export type ReuniaoEstado = (typeof REUNIAO_ESTADOS)[number];

export type ReuniaoRow = {
  id: string;
  membro: PessoaRef & { telefone: string; fotoUrl: string | null; equipe: string };
  educador: PessoaRef & { telefone: string };
  motivo: string;
  disponibilidade: string;
  estado: ReuniaoEstado;
  dataHora: string | null;
  local: string;
  resposta: string;
  criadaEm: string;
  respondidaEm: string | null;
  // new for the side asking: the member sees a reply, the educator a request
  nova: boolean;
  avisos: { para: "membro" | "educador"; canal: "email" | "whatsapp"; ok: boolean; detalhe: string; em: string }[];
  // prefilled WhatsApp chat with the other side (manual, free)
  whatsappLink: string | null;
};

export type ReuniaoBody = {
  educadorId?: string;
  motivo: string;
  disponibilidade?: string;
};

export type ReuniaoRespostaBody = {
  acao: "confirmar" | "remarcar" | "recusar" | "realizada" | "cancelar";
  dataHora?: string;
  local?: string;
  resposta?: string;
};

export type ReunioesLista = {
  reunioes: ReuniaoRow[];
  educadores: (PessoaRef & { minha: boolean })[];
  pendentes: number;
};

// The team's cash box during the testimony drive.
export const LANCAMENTO_TIPOS = ["entrada", "saida"] as const;
export type LancamentoTipo = (typeof LANCAMENTO_TIPOS)[number];
export const LANCAMENTO_CATEGORIAS = ["rm", "doacao", "estadia", "alimentacao", "transporte", "material", "outro"] as const;
export type LancamentoCategoria = (typeof LANCAMENTO_CATEGORIAS)[number];

export type LancamentoRow = {
  id: string;
  data: string;
  tipo: LancamentoTipo;
  categoria: LancamentoCategoria;
  valorCents: number;
  descricao: string;
  autor: PessoaRef;
  automatico: boolean;
  periodo: { inicio: string; fim: string } | null;
  criadoEm: string;
};

export type LancamentoBody = {
  data?: string;
  tipo: LancamentoTipo;
  categoria: LancamentoCategoria;
  valorCents: number;
  descricao?: string;
};

export type EstadiaBody = { inicio: string; fim: string };

export type CaixaEquipe = {
  equipe: EquipeResumo & { membros: number; taxaEstadiaCents: number };
  projeto: ProjetoResumo | null;
  saldoCents: number;
  entradasCents: number;
  saidasCents: number;
  porCategoria: { categoria: LancamentoCategoria; tipo: LancamentoTipo; valorCents: number }[];
  lancamentos: LancamentoRow[];
  podeLancar: boolean;
  podeConfigurar: boolean;
};

export type CaixaResumoEquipe = {
  equipe: { id: string; nome: string; programa: HjPrograma };
  capitao: PessoaRef | null;
  educador: PessoaRef | null;
  membros: number;
  taxaEstadiaCents: number;
  saldoCents: number;
  entradasCents: number;
  saidasCents: number;
  lancamentos: number;
  ultimoLancamento: string | null;
};

export type CaixaResumo = {
  projeto: ProjetoResumo | null;
  equipes: CaixaResumoEquipe[];
  totais: { saldoCents: number; entradasCents: number; saidasCents: number };
};

// Mission areas: região → país → local (a "centro de testemunho").
export const AREA_TIPOS = ["regiao", "pais", "local"] as const;
export type AreaTipo = (typeof AREA_TIPOS)[number];
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

export type AreaRef = { id: string; nome: string };

// A team's place in the tree, resolved upwards.
export type AreaDaEquipe = { local: AreaRef; pais: AreaRef | null; regiao: AreaRef | null } | null;

export type AreaNode = {
  id: string;
  tipo: AreaTipo;
  nome: string;
  paiId: string | null;
  ativo: boolean;
  equipes: number;
};

export type AreaBody = {
  tipo: AreaTipo;
  nome: string;
  paiId?: string | null;
  ativo?: boolean;
};

// Guest counts for one node of the tree (an area, a team, the total).
export type TestemunhoContagem = {
  convidados: number;
  porEtapa: Record<ConvidadoEtapa, number>;
  fichas: number;
  alertas: number;
  membros: number;
  membrosComConvidado: number;
  indicadores: IndicadoresEquipe;
  // teams only: the drop between two of the four indicators
  atencao?: AtencaoEquipe;
};

export type TestemunhoNode = TestemunhoContagem & {
  id: string;
  tipo: AreaTipo | "equipe" | "sem_area";
  nome: string;
  programa?: HjPrograma;
  filhos: TestemunhoNode[];
};

export type TestemunhoResultados = {
  projeto: ProjetoResumo | null;
  total: TestemunhoContagem;
  arvore: TestemunhoNode[];
  porPrograma: (TestemunhoContagem & { programa: HjPrograma })[];
};

export type EquipeResumo = {
  id: string;
  nome: string;
  programa: HjPrograma;
  capitao: PessoaRef | null;
  educador: PessoaRef | null;
};

// One expense of the day in the RM report: a category of the accounting
// list (transporte, alimentacao, …) and how much.
export type DespesaItem = { categoria: string; valorCents: number };

export type RelatorioRow = {
  id: string;
  data: string;
  dinheiroCents: number;
  pixCents: number;
  despesasCents: number;
  // always adds up to despesasCents; a report without categories comes as one "outros"
  despesasItens: DespesaItem[];
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
  // either the total alone, or the items (their sum is then the total)
  despesasCents?: number;
  despesasItens?: DespesaItem[];
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
  // `projeto`: the testimony project's dates — the home shows one project, the one being done
  testemunho: { projeto: { ativo: boolean; inicio: string; fim: string } | null; total: number; atencao: { id: string; nome: string; alerta: ConvidadoAlerta }[] };
  // what the educator told the team (testemunho) and the member (RM), latest of each
  orientacoes: { equipe: OrientacaoRow | null; pessoal: OrientacaoRow | null };
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

// The fundraising panorama of the active project: totals, by program and
// by team. Lives in Restauração Material › Resultados; the Painel home
// keeps one line of it (Yeseong, 14/11/2026).
export type ArrecadacaoPanorama = {
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
};

// The course's general numbers — the cards of the Painel home (Yeseong,
// 14/11/2026): how many people, per program, boys and girls, average
// age, who stands out in the RM and in the testimony drive so far.
export type DadosGerais = {
  pessoas: number;
  porPrograma: { programa: HjPrograma; nome: string; pessoas: number }[];
  meninos: number;
  meninas: number;
  semGenero: number;
  idadeMedia: number | null;
  comIdade: number;
  destaquesRm: { membro: PessoaRef; equipe: string; totalCents: number }[];
  destaquesTestemunho: { membro: PessoaRef; equipe: string | null; convidados: number; jardim: number }[];
};

export type AdminHjInicio = ArrecadacaoPanorama & {
  projeto: ProjetoResumo | null;
  geral: DadosGerais;
  // The testimony drive running today (a project of type "testemunho"),
  // with the guests of every team as they stand.
  testemunho: {
    projeto: ProjetoResumo | null;
    convidados: number;
    porEtapa: Record<ConvidadoEtapa, number>;
    alertas: number;
    porEquipe: { id: string; nome: string; programa: HjPrograma; convidados: number; alertas: number; indicadores: IndicadoresEquipe; atencao: AtencaoEquipe }[];
    comAtencao: number;
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
  // the member's inner goal / advice from the last consulta (RM)
  orientacao: OrientacaoRow | null;
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
  // the whole project, whatever the filters
  panorama: ArrecadacaoPanorama | null;
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
  cidade: string;
  fotoUrl: string | null;
  idade: number | null;
  programa: HjPrograma | null;
  turma: string;
  // the one line under the name, per program (see src/lib/hj/perfil.ts)
  resumo: string;
  papeis: Papeis;
  equipe: { id: string; nome: string; programa: HjPrograma } | null;
  criadoEm: string;
  ultimoAcesso: string | null;
};

export type PessoaDetalhe = PessoaRow & {
  nascimento: string | null;
  idioma: string;
  perfil: HjPerfil;
  confidencial: HjConfidencial;
  anotacoes: string;
  educadorResponsavel: PessoaRef | null;
  convidados: { total: number; porEtapa: Record<ConvidadoEtapa, number> };
  rm: { diasEnviados: number; totalCents: number; mediaCents: number } | null;
};

export type PessoaPatchBody = {
  perfil?: Partial<HjPerfil>;
  confidencial?: Partial<HjConfidencial>;
  anotacoes?: string;
};

export type ProgramaCatalogo = {
  sigla: HjPrograma;
  nome: string;
  ativo: boolean;
  turmas: { nome: string; ativa: boolean }[];
};

export type ProgramaBody = {
  sigla: HjPrograma;
  nome?: string;
  ativo?: boolean;
  turmas?: { nome: string; ativa: boolean }[];
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
  area: AreaDaEquipe;
  taxaEstadiaCents: number;
  educador: PessoaRef | null;
  capitao: PessoaRef | null;
  membros: PessoaRef[];
  liquidoCents: number;
};

export type EquipeBody = {
  nome: string;
  programa: HjPrograma;
  projetoId: string;
  areaId?: string | null;
  // the stay fee per member per day the team's cash box charges
  taxaEstadiaCents?: number;
  educadorId?: string | null;
  capitaoId?: string | null;
  membroIds?: string[];
};

export type ApiErrorBody = { error: string; code?: string; [key: string]: unknown };
