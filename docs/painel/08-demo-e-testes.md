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
- **Administrador(a)**: tudo acima, mais o Início com o geral da arrecadação
  e o geral dos convidados, a **Biblioteca** (adicionar livros, materiais e
  vídeos por link, que aparecem para pastores, membros e educadores), dar e
  tirar os papéis de educador e administrador em Pessoas, e Organização (projetos, dias de descanso, metas
  por programa, regra da nova meta, copiar as equipes do projeto anterior).

O switch tem **cinco módulos — Painel · Restauração Material · Testemunho ·
Academia · Biblioteca** (Milad, 13/11) — ao lado do logo para quem tem conta
da academia (pastores veem só a Biblioteca, sem switch); cada módulo tem a
sua barra lateral (no computador) ou barra inferior (no celular). O módulo
Testemunho aparece para os membros só enquanto há projeto de testemunho
ativo, ou sempre/nunca, conforme Configurações; educadores sempre o veem. O
perfil abre pelo avatar no canto superior direito.

## Novidades de 14/11/2026

Pedidos do grupo em 13 e 14/11 (Milad, Wang Song, Yeseong, Dir. Henrique):

- **Perfil HJ Team** (Pessoas): foto, idade, programa e turma, e a linha por
  programa — curso universitário (HJ Academy), há quanto tempo é membro
  (Pure Water), família Cheon Bo (HJ Rang). A ficha da pessoa
  (`/admin/pessoas/[id]`) tem a parte **Informações do educador**
  (família Cheon Bo, segunda geração, pais, espíritos centrais libertados,
  padrão de vida de fé, anotações) que só educadores veem e preenchem; o
  membro edita curso, formações e "membro desde" em Meu perfil. Programas e
  turmas em Organização.
- **Áreas de missão** (Organização): região → país → local (centro de
  testemunho), com as cinco regiões do sistema do Wang Song. A equipe
  aponta para um local. **Testemunho › Por área** soma convidados por etapa,
  fichas e alertas em cada região, país, local e equipe, e por programa.
- **Caixa da equipe** (Testemunho › Caixa): entradas e saídas por categoria,
  saldo, taxa de estadia por membro/dia (o educador define) e "lançar
  estadia do período" (membros × dias × taxa). A capitã e o educador da
  equipe lançam; os membros veem; o educador vê o saldo de todas.
- **Reuniões** (Painel › Reuniões): o membro pede uma conversa individual
  ao educador; o educador confirma, sugere outro horário ou recusa; aviso no
  sino, por e-mail e por WhatsApp quando configurado (ver P8).
- "Fale com a IA" voltou a aparecer na Biblioteca (Milad: o chat externo
  serve por enquanto). A academia segue as regras da
FFPUM: módulos abrem em ordem quando a atividade do módulo anterior é
aprovada (nota mínima 70 por padrão, tentativas ilimitadas, a melhor vale),
a atividade do módulo abre depois de todas as aulas, a final depois de todos
os módulos, e o vídeo não deixa pular para a frente do que já foi visto.

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
  uma equipe com relatórios é recusado → Início com os dois gerais →
  Biblioteca: adicionar livro e vídeo, ocultar e publicar; Ana e o pastor
  veem os itens na biblioteca; David recebe 404 em `/admin/biblioteca`.
- Academia (09/11): David cria o curso "Fundamentos da Fé (teste)" pela
  interface — módulos, aulas com vídeo da biblioteca Bunny Stream (a mesma da
  FFPUM: escolher da lista, colar o GUID ou enviar o arquivo) e material, atividade do módulo com
  os cinco tipos de pergunta, atividade final, publicar. Ana se inscreve: o
  módulo 2 e a atividade final nascem bloqueados (também na API: 403), a
  atividade do módulo abre quando a aula termina, reprova com 0 % e vê a
  revisão (resposta certa, explicação do verdadeiro/falso, escrita
  "aguardando revisão"), refaz e aprova, o módulo 2 abre, conclui a aula 2,
  aprova a final com 50 % (nota mínima 50) e vê a tela de conclusão. David
  revisa a resposta escrita e responde a pergunta da aula; Ana vê os dois.
  Um segundo curso com pré-requisito some para o Carlos (403 `course_locked`
  no link direto) e aparece como desbloqueado para a Ana. Excluir atividade
  com tentativas, aula com progresso ou curso com inscritos é recusado.

PWA (09/11): instalada e aberta em um emulador Pixel 9 (Chrome, WebAPK) e em
um simulador iPhone 17 Pro (Safari, "Adicionar à Tela de Início"): o app se
chama "Água Pura", abre em `/login` e um membro já logado cai direto no
Painel, em tela cheia, com a barra inferior acima do indicador do iPhone.

Suite automática: `npm run typecheck`, `eslint` (pastas do CI) e `npm test`
(464 testes, MongoDB em memória): regras de RM, datas, jornada e perfil em
`tests/unit/`; rotas do painel e da administração em
`tests/api/painel-*.test.ts` (arrecadação, testemunho, caixa, reuniões) e
`tests/api/admin-*.test.ts` (hj, áreas, perfil/programas/configurações,
biblioteca).

Verificado em 14/11 no navegador (Playwright, 1280 px e 390 px) e pela API:
os cinco módulos com as barras certas para membro, capitã, educador e
administrador; o módulo Testemunho some para a Ana em modo "oculto" e
`/painel/testemunho` volta ao início; ficha da Ana com a parte do educador
(a API do membro nunca devolve os campos confidenciais); áreas: criar local,
recusar duplicado e país como área de equipe, apagar com filhos é recusado;
resultados por área batem com os convidados do seed; caixa da Equipe 01
(Bia lança, Ana só vê, Marcos — educador de outra equipe — só vê, David
define a taxa, estadia do período e recusa de período repetido); reunião da
Ana com o David (pedido, sino dos dois lados, confirmar, realizada, sugerir
outro horário, cancelar).

## Fora desta versão

Lembretes e notificações push (P6), WhatsApp pela Cloud API (falta número de
produção, pagamento e modelos aprovados — ver P8), exportação da contabilidade, tradução en/es do painel (os textos estão em
`src/lib/i18n/painel-messages.ts`, só em português), upload de PDF na
Biblioteca administrável (hoje só por link), ambiente `dev` próprio na Vercel
e no Atlas (hoje o demo é o projeto `pww-painel`), e-mail de boas-vindas
(Resend) para contas novas.
