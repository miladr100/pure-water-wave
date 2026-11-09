# Análise comparativa: o que já existe e o que o painel aproveita

Quatro fontes foram inventariadas em 06/11/2026, lendo o código e os
documentos de cada uma (não as telas em uso):

| Fonte | Onde | Stack | Situação |
|---|---|---|---|
| **Academia FFPUM** | `ffpum-admin` (Payload CMS, Postgres) + `ffpum-academy` (Vite/React) + wiki F1–F26 | Payload + React, Clerk, Bunny | Em produção, ~30 alunos, 15 meses de evolução |
| **Academia PWW** | `pure-water-wave`, branch `dev` (`src/app/academia`, `src/app/admin`, `src/lib/academy`, `src/models`) | Next 16 + MongoDB, sessão JWT própria | Pronta, sem usuários reais |
| **Testemunho (Wang Song)** | `website-testemunho` (`apps/api` FastAPI + Postgres com RLS, `apps/web` Next 16) | Python + Postgres + S3 + n8n/WAHA | Protótipo com dados de exemplo (908 convidados, 39 equipes); não adotado pelo HJ Team |
| **Planilha de RM** | Google Sheets "Resultados Restauração Material – 30 dias" + relatório por WhatsApp | Planilha | **Em uso**, é o processo real |

## 1. O que cada uma resolve

### Academia FFPUM (modelo pedagógico de referência)

Cursos → módulos → aulas em vídeo → atividades de revisão (única, múltipla,
V/F, texto revisado por educador, reflexão), com bloqueio de adiantamento no
player, progresso por aula, atividades opcionais que não contam para concluir,
pré-requisitos "qualquer um de", cursos por idioma, podcasts, perguntas por
aula com sino de notificações, tutores que estudam *com* o aluno (sessão
registrada na conta do aluno) e avisos de progresso por e-mail ao tutor.

Para o staff: tabela padrão (`DataTable`) com ordenação no servidor, busca com
debounce, abas de filtro, seletores (país, tutor) com contagens, cartões no
celular; colunas Estudante · País · Tutor · Primeiro contato · Inscrições ·
Alta; detalhe com "Converter em tutor"; aba de WhatsApp com links `wa.me` já
escritos (nunca envia); confirmações e toasts padronizados.

O que fica de lição: **as listas de pessoas com filtro e ordenação no servidor**,
o padrão de aviso por e-mail idempotente (carimbo gravado para não repetir), e
a regra de que "o que a pessoa não pode ver, não existe" (404, não 403).

### Academia PWW (o que já está na `dev`)

É a academia FFPUM reescrita no stack do site: os mesmos conceitos (curso,
módulo, aula, atividade, progresso, inscrição, perguntas, correções), modelos
Mongo com prefixo `academy_`, educadores como administradores, **um único
Login** para biblioteca + academia + painel, contas criadas pelo educador
(diálogo e CSV até 500 linhas, senha temporária mostrada uma vez, e-mail de
boas-vindas), recuperação por código, perfil em diálogo (`?perfil=1`), foto
dentro do Mongo, i18n pt/en/es por catálogos tipados, PWA (Serwist), Resend,
testes com Mongo em memória (381 testes) e CI.

Limites atuais que o painel precisa resolver: o papel é um valor único
(`student` | `tutor`), HJ Team existe em duas coleções (`SystemUser.hjteam` e
`AcademyUser.student`), a navegação é uma lista fixa por área no código,
`/admin` é liberado só pelo papel `tutor`, as listas do admin não têm
paginação (ordenam em memória), nenhuma tela usa gráficos (o wrapper de
`recharts` existe), e o manifest da PWA só conhece `/biblioteca`.

### Testemunho (Wang Song)

O modelo de domínio é o mais completo para a organização do HJ Team e para o
acompanhamento:

- **Organização:** região → país → cidade (área de missão) → equipe com capitão
  derivado (`teams.captain_member_id`, nunca papel gravado); membros com
  programa e turma; cursos ("Futuros Líderes") → programas (HJA, HJR, PW, STG,
  UPA, com logos) → turmas; projetos de relatório com períodos (botão "dividir
  em 40 dias"); preferência de projeto por usuário e por membro.
- **Convidado:** dados pessoais, responsável (membro) e equipe copiada dele,
  etapa (Gateway, Sistema 1, Sistema 2) com datas validadas em ordem e nunca
  no futuro, conferência atual (1–16, com títulos), ficha assinada com PDF
  opcional, Jardim e passagem independentes da etapa, foto, observações,
  eventos de progresso automáticos (antes/depois, autor, canal), exclusão
  lógica com lixeira e restauração, importação CSV em lote com prévia.
- **Relatórios:** convidados cadastrados no intervalo do projeto/período, por
  estado atual; por região, país, cidade, equipe, programa, curso, turma;
  conferências; tendências dia/semana/mês; "resultados por membro" (quantos
  membros têm ao menos uma ficha, separados em HJ Rang / HJ Academy / Pure
  Water); mapa por país; exportação CSV e ZIP.
- **Contabilidade por equipe** (não usada): estadia (diária × dias por membro
  + despesas extras) → metas semanais; registro por dia com bruto, material e
  dízimo por membro; extrato com cobrança automática de estadia aos domingos.
- **Segurança:** RLS no Postgres, agregados da equipe sem dados pessoais dos
  colegas, auditoria de tudo, senhas temporárias cifradas, chatbot de WhatsApp
  com confirmação explícita e HMAC.

O que **não** tem: etapa Pré-Gateway, vídeos do Sistema 1 como lista,
acontecimentos registrados à mão, próximo objetivo/sugestão, e o relatório
diário individual de RM (a contabilidade é por equipe e por dia, lançada pelo
capitão, com fórmula diferente da planilha).

### Planilha de RM (o processo real)

Ver `02-como-funciona-hoje.md` §3. Resumo: resultado diário por membro, com
meta, recorde, média, nova meta; metas por programa; dinheiro vs. pix por
programa e dia; dias de descanso. Tudo digitado por educadores a partir de
mensagens de WhatsApp.

## 2. Matriz por capacidade

| Capacidade | FFPUM | PWW `dev` | Testemunho | Planilha | **Painel** |
|---|---|---|---|---|---|
| Login único, contas criadas pelo educador | Clerk + convite | **Sim** | Próprio, admin cria | — | PWW |
| Uma pessoa, vários papéis | Não (role único) | Não (role único) | Não (role + capitão derivado) | — | Novo: `papéis[]` + capitão derivado (ideia do testemunho) |
| Programas e turmas | — | — | **Sim** | Texto | Testemunho |
| Projetos com períodos (40 dias) | — | — | **Sim** | Implícito | Testemunho, com tipo (RM/testemunho) |
| Equipes com capitão | — | — | **Sim** (geográficas) | Sim (por programa) | Testemunho, mas **por projeto** |
| Relatório diário individual de RM | — | — | Não (por equipe/dia) | **Sim** (WhatsApp) | Novo, a partir do modelo de WhatsApp |
| Validação do capitão | — | — | Não | Manual | Novo (pedido do Wang Song) |
| Metas: programa, diária, nova meta | — | — | Estadia/semanal | **Sim** | Planilha (programa, diária, nova meta); estadia fica de fora |
| Resultados por programa/equipe/membro/dia | — | — | Parcial (contab.) | **Sim** | Planilha, gerada automaticamente |
| Dinheiro vs. digital | — | — | Não | **Sim** | Planilha |
| Material (levou/voltou/restaurou) | — | — | Custo em R$ | Sim | Planilha, sem estoque |
| Convidado com jornada e datas | — | — | **Sim** | — | Testemunho + Pré-Gateway |
| 16 conferências | — | — | Número atual + catálogo | — | Lista marcável (novo) |
| Ficha em PDF, Jardim, passagem | — | — | **Sim** | — | Testemunho |
| Linha do tempo | — | — | Eventos automáticos | — | Eventos automáticos + acontecimentos manuais (Milad) |
| Próximo objetivo e sugestões | — | — | Não | — | Novo (Milad) |
| Relatórios de testemunho por projeto/equipe/programa | — | — | **Sim** | — | Testemunho |
| Mapa por país | — | — | Sim | — | Depois (não é prioridade) |
| Chatbot de WhatsApp | links `wa.me` | — | n8n + WAHA | É o processo | Depois; lembretes por notificação primeiro |
| Cursos em vídeo, atividades, educadores | **Sim** | **Sim** | — | — | PWW |
| Listas com filtro/ordenação no servidor | **Sim** | Em memória | Sim (paginadas) | — | FFPUM/testemunho |
| Auditoria de alterações | Parcial | Não | **Sim** | — | Testemunho (simplificada) |
| Exportação CSV | — | — | **Sim** | É a planilha | Testemunho + planilha de RM |
| PWA | — | **Sim** (biblioteca) | — | — | PWW, estendida ao painel |
| Idiomas | es/pt | pt/en/es | pt/es/en/ko | pt | pt/en/es (PWW) |

## 3. O que o painel aproveita de cada fonte

**Da PWW `dev` (base de código):** tudo. Login, sessão, criação de contas,
perfil, shell/cabeçalho, diálogos, tabelas, toasts, i18n, e-mails, PWA, testes.
O painel é uma extensão desse código, não um app ao lado.

**Do testemunho (modelo de domínio):** programas/turmas, projetos/períodos,
equipe com capitão derivado, o convidado inteiro (campos, regras de datas,
ficha/Jardim/passagem, eventos, lixeira), os relatórios por intervalo, a
importação CSV de convidados, a auditoria, a regra "agregado da equipe sem
dados pessoais dos colegas". Reescrito em TypeScript/Mongo; os dados de
exemplo podem ser importados (P7).

**Da planilha (regras de RM):** campos do relatório diário, dias de descanso,
meta diária e nova meta, metas por programa, dinheiro vs. digital, layout da
visão do educador e exportação no mesmo formato.

**Da FFPUM (padrões):** tabela com filtros e ordenação no servidor, avisos
idempotentes, "Primeiro contato" como coluna/aba de pessoas (aqui vira o
Pré-Gateway do convidado), aba de WhatsApp com links prontos.

## 4. O que fica de fora, e por quê

- **Backend Python e Postgres:** decisão do grupo (TypeScript + Mongo).
- **RLS e agregados no banco:** no Mongo, a regra de escopo vive na API; os
  testes de autorização (IDOR entre membros e equipes) são obrigatórios.
- **Estadia e metas semanais:** o HJ Team não usa; pode voltar como módulo
  se a continental pedir.
- **Geografia completa (região → país → cidade → equipe):** as equipes passam
  a ter país/cidade como atributo simples; relatórios por país continuam
  possíveis sem a hierarquia de cadastros.
- **Chatbot n8n/WAHA:** primeiro a PWA com lembretes; o bot pode vir depois
  reaproveitando a conta de WhatsApp Business da academia FFPUM se fizer
  sentido.
- **Mapa:** depois.
- **Clerk, Payload:** não se aplicam.
