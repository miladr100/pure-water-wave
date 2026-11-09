# Demo navegável e como testar

| | |
|---|---|
| Status | Primeira versão navegável na branch `feat/painel-ui` (06/11/2026) |
| Dados | `npm run seed:painel` cria o projeto, as equipes, os relatórios e os convidados de demonstração |

## O que esta versão cobre

Tudo o que os requisitos P1–P7 descrevem para o dia a dia, com dados reais no
MongoDB (nada é mock no navegador):

- **Membro** (`/painel`): início com o dia de hoje, meta, últimos 7 dias e
  convidados que precisam de atenção; relatório de RM (enviar, reenviar,
  corrigir um dia devolvido, copiar a mensagem para o WhatsApp); convidados
  (lista com filtros por etapa e por atenção, novo convidado, jornada,
  acontecimentos, mudar de etapa, editar datas).
- **Capitã(o)** (`/painel/equipe`): quem enviou hoje, validar ou devolver com
  motivo, histórico da equipe, convidados da equipe.
- **Educador(a)** (`/admin`): visão geral (por programa e por equipe),
  Arrecadação com as abas Resultados (a planilha, membro × dia, com filtros e
  CSV), Relatórios do dia (validação das equipes que acompanha), Metas e
  Contabilidade (dinheiro × pix); Testemunho de todas as equipes; Pessoas
  (membros, educadores, pastores, nova conta, importar CSV); Equipes (criar,
  editar, capitão, membros — ninguém em duas equipes do mesmo projeto);
  Academia (a administração da academia como estava).
- **Administrador(a)**: tudo acima, mais dar e tirar os papéis de educador e
  administrador em Pessoas, e Organização (projetos, dias de descanso, metas
  por programa, regra da nova meta, copiar as equipes do projeto anterior).

O switch **Painel | Academia | Administração** fica ao lado do logo em todas
as áreas; a academia continua como estava.

## Contas de demonstração

`npm run seed:painel` cria (senha de todas: `painel123`, ou `SEED_PAINEL_PASSWORD`):

| Conta | Papel |
|---|---|
| `ana.membro@purewaterwave.test` | membro da Equipe 01 – HJA (tem um dia devolvido para corrigir) |
| `bia.capita@purewaterwave.test` | capitã da Equipe 01 – HJA |
| `david.educador@purewaterwave.test` | educador (equipes ímpares de HJ Academy) |
| `fernanda.educadora@purewaterwave.test` | educadora (equipes pares de HJ Academy) |
| `marcos.educador@purewaterwave.test` · `paulo.educador@…` | educadores de HJ Rang |
| `larissa.educadora@purewaterwave.test` | educadora de Pure Water e UPA |
| `yeseong.admin@purewaterwave.test` | administrador (e educador de Pure Water) |
| `pastor.teste@purewaterwave.test` (senha `teste123`) · `pr.joao@…` · `pra.marcia@…` · `pr.renato@…` · `pr.sergio@…` | pastores: só a biblioteca |

O seed tem o tamanho do HJ Team de verdade: **13 equipes** (HJ Academy 4,
HJ Rang 5, Pure Water 3, UPA 1), **76 membros** com nomes gerados, 6
educadores, 5 pastores, ~430 relatórios dos dias já passados do mês
corrente (validados, enviados e alguns devolvidos) e ~80 convidados em
todas as etapas. Os nomes e números saem de um gerador determinístico, então
rodar de novo dá sempre o mesmo resultado. O script apaga e recria tudo o
que é `hj_*` e as contas `@purewaterwave.test` (painel e pastores); as
contas da academia (`tutor@`, `aluno@`, `hjteam.teste@`) ficam.

## Rodar localmente

```bash
npm run db:local        # MongoDB em memória na porta 27117
MONGODB_URI=mongodb://127.0.0.1:27117/pww-academy npm run seed:painel
MONGODB_URI=mongodb://127.0.0.1:27117/pww-academy npm run dev
```

Depois: http://localhost:3000/login com uma das contas acima. Membros caem
no Painel, educadores na administração, pastores na biblioteca.

## Demo na Vercel

**https://pww-painel.vercel.app** — projeto `pww-painel` no time do Victor,
publicado com `vercel deploy --prod` a partir desta branch, com o mesmo
MongoDB Atlas de demonstração da academia (`pww-academy-demo`) e o seed
rodado contra ele. É só para o grupo testar; não tem nada a ver com o
projeto da Vercel do Milad nem com purewaterwave.org.

O preview automático no projeto do Milad (cada push da branch) fica atrás
do Vercel Authentication e precisaria de um `MONGODB_URI` próprio no
ambiente *Preview*; por isso a demo vive no projeto separado.

## O que foi verificado antes de abrir o PR

Fluxos executados no navegador (Playwright), em computador (1440 px) e
celular (390 px), com cada tipo de conta:

- Ana: início → preencher e enviar o relatório de hoje → abrir o dia devolvido
  pela capitã, corrigir e reenviar → convidados: criar, abrir, registrar
  Gateway, conferência e ficha, editar → a página da equipe explica que é da
  capitã.
- Bia: início com o cartão da equipe → validar o relatório da Ana → devolver
  o do Pedro com motivo → histórico → convidados "da equipe" → não consegue
  validar o próprio relatório (fica para o educador).
- David: visão geral → relatórios do dia (só valida as equipes HJA) →
  testemunho de todas as equipes do projeto (valida só as suas) → Pessoas
  sem botões de papel → Organização responde 404 (página e API).
- Yeseong: tornar Carlos educador e administrador e tirar os dois → não pode
  tirar o próprio papel → novo projeto de dezembro copiando as 4 equipes →
  tirar Luana da Equipe 01 e criar a Equipe 03 com ela como capitã → apagar
  uma equipe com relatórios é recusado.

Suite automática: `npm run typecheck`, `eslint` (pastas do CI) e `npm test`
(440 testes, MongoDB em memória): regras de RM, datas e jornada em
`tests/unit/hj-*.test.ts`; rotas do painel e da administração em
`tests/api/painel-*.test.ts` e `tests/api/admin-hj.test.ts`.

## Fora desta versão

Lembretes e notificações push (P6), PWA com ícone e `start_url` do painel,
exportação da contabilidade, tradução en/es do painel (os textos estão em
`src/lib/i18n/painel-messages.ts`, só em português), testes automáticos das
rotas `/api/painel` e `/api/admin/hj`.
