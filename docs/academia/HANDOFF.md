# Academia Água Pura — o que é e o que falta

A academia é uma área nova deste mesmo site: cursos em vídeo organizados em
módulos, aulas e atividades de revisão, com educadores que acompanham cada
aluno. Foi escrita com **os mesmos padrões do resto do repositório** (Next
16, Tailwind 4, shadcn, MongoDB/mongoose, sessão JWT própria, Resend,
`messages.ts` em pt/en/es), então quem mantém o site mantém a academia. O
modelo pedagógico vem da academia da FFPUM.

O que falta é **só configuração**: as variáveis de ambiente abaixo e, se
quiserem vídeos privados, uma conta no Bunny Stream.

## 1. O que está pronto

- **Um único Login para o site inteiro**, em `/login` (`/login`
  redireciona para lá). Três tipos de pessoa entram por ele: pastores (conta
  da biblioteca, papel pastor) vão só para a biblioteca; HJ Team (conta da
  biblioteca com papel hjteam, ou alunos da academia) vão para a academia e
  têm a biblioteca; educadores (conta da academia) vão para o painel e têm a
  biblioteca. A biblioteca aparece como "Biblioteca" no cabeçalho da academia
  e do painel, e o logo da biblioteca volta para a academia ou para o painel.
- Área do aluno em `/academia`: login, recuperação de senha por código
  (igual à biblioteca; não há cadastro público — ver 5), catálogo, inscrição grátis, player com
  **bloqueio de adiantamento** (não dá para pular o que ainda não viu),
  progresso que continua de onde parou, atividades de revisão corrigidas na
  hora (múltipla escolha, V/F) e respostas escritas revisadas por um
  educador, cursos que se desbloqueiam ao concluir outros, perguntas ao
  educador dentro da aula, notificações de resposta, e o perfil (foto, dados,
  e-mail, senha, idioma, tema claro/escuro/sistema, cursos em outros idiomas,
  escolha do educador(a)). A foto fica no próprio MongoDB, então não precisa
  de storage.
- Painel dos educadores em `/admin` (educadores são os administradores):
  visão geral, alunos (busca, anotações, educador(a) responsável, converter
  em educador(a)), educadores, pastores, **contas** (criar pastores, HJ Team
  e educadores um a um ou por CSV — ver 5), editor completo de cursos
  (módulos, aulas com YouTube ou Bunny, materiais, atividades e perguntas em
  três idiomas), caixa de perguntas dos alunos, revisão de respostas escritas.
- Um curso de exemplo (`npm run seed`) montado com o **Manual de apoio dos
  vídeos do Kit 1** que já está na biblioteca — os 17 vídeos do YouTube,
  em 4 módulos, com atividades em pt e es — e um segundo curso bloqueado por
  pré-requisito, para ver o desbloqueio funcionando.

## 2. O que não muda no site

- A biblioteca, as doações e tudo o que já existia continuam iguais. A
  academia só **adiciona** rotas (`/academia/**`, `/admin/**`,
  `/api/academia/**`, `/api/admin/**`), modelos e componentes.
- As edições em arquivos existentes: `src/middleware.ts` (ganhou o gate da
  academia, com cookie próprio `pww_academy_session`), `src/app/login`
  (agora redireciona para o Login da academia), o cabeçalho da biblioteca
  (para contas da academia o logo volta para a academia ou para o painel),
  `src/lib/theme.ts` (tema escuro também em `/academia` e `/admin`),
  `tsconfig.json` (inclui as pastas novas), `package.json` (`hls.js`,
  `tus-js-client`, `tsx`, `mongodb-memory-server`, scripts `seed`,
  `db:local`, `typecheck`).
- As coleções no MongoDB têm prefixo `academy_` — nada do site é tocado.
- Os usuários da biblioteca (`SystemUser`) e os da academia (`AcademyUser`)
  são contas diferentes, mas entram pelo mesmo Login; ao entrar, uma conta da
  academia recebe também o cookie da biblioteca
  (`src/lib/academy/session-bridge.ts`). Um pastor que quiser ser
  educador(a) recebe uma conta de educador(a) criada no painel.

## 3. Variáveis de ambiente

Já existentes e reaproveitadas: `MONGODB_URI`, `AUTH_SECRET`,
`RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.

Novas (opcionais):

| Variável | Para quê |
|---|---|
| `EMAIL_FROM` | Remetente dos e-mails da academia (padrão: `Pure Water Wave <contact@purewaterwave.org>`). Com `RESEND_API_KEY`, cada conta criada no painel recebe um e-mail de boas-vindas com o login e a senha temporária. |
| `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOST`, `BUNNY_STREAM_TOKEN_KEY`, `BUNNY_URL_TTL_SECONDS` | Só para aulas com vídeo privado no Bunny Stream (ver 4). |
| `SEED_TUTOR_EMAIL`, `SEED_TUTOR_PASSWORD`, `SEED_TUTOR_NAME`, `SEED_STUDENT_EMAIL`, `SEED_STUDENT_PASSWORD` | Só para `npm run seed`. |

## 4. Vídeo — YouTube ou Bunny Stream

**YouTube** não precisa de nada: no editor de aulas, cole o link. Um vídeo
"não listado" continua acessível a quem tiver o link, e o YouTube pode
mostrar relacionados ao final.

**Bunny Stream** é a opção para vídeos privados (é o que a FFPUM usa). Criem
uma conta em [bunny.net](https://bunny.net), uma *Stream Library*, e ativem
*Token Authentication* no pull zone da biblioteca:

| Variável | Onde achar |
|---|---|
| `BUNNY_STREAM_LIBRARY_ID` | Stream → sua biblioteca → ID na URL |
| `BUNNY_STREAM_API_KEY` | Stream → biblioteca → API → *API Key* |
| `BUNNY_STREAM_CDN_HOST` | Stream → biblioteca → *CDN Hostname* (`vz-xxxxx.b-cdn.net`) |
| `BUNNY_STREAM_TOKEN_KEY` | Stream → biblioteca → Security → *Token Authentication Key* |

Com elas, o botão "Enviar vídeo" aparece no editor de aulas: o arquivo sobe
direto do navegador para o Bunny (a chave nunca vai ao navegador) e a
academia toca o HLS com URLs assinadas que expiram em 4 horas.

## 5. Contas

**Ninguém se cadastra sozinho.** Não existe página pública de cadastro: toda
conta — pastor, HJ Team ou educador(a) — é criada por um(a) educador(a) no
painel, em **Contas → Nova conta** (uma de cada vez) ou **Contas → Importar
CSV** (várias). O que acontece ao criar:

- **Pastor** vira uma conta da biblioteca (`SystemUser`, papel `pastor`;
  telefone obrigatório, porque a biblioteca o exige) e entra só na
  biblioteca. **HJ Team** vira aluno da academia (`AcademyUser`, papel
  `student`) e **Educador(a)** vira `tutor`; os dois entram na academia ou
  no painel e têm a biblioteca.
- Se a senha ficar em branco, o sistema gera uma **senha temporária**, que o
  painel mostra **uma única vez** (anote ou copie na hora; ela não fica
  guardada em lugar nenhum). Com `RESEND_API_KEY` configurada, a pessoa
  também recebe um e-mail de boas-vindas com o login, a área em que vai
  entrar e a senha temporária.
- A pessoa troca a senha no perfil (menu da conta) ou, se perdeu, por
  "Esqueci minha senha" em `/esqueci-senha`, que atende os dois tipos de
  conta.
- Um e-mail que já exista em qualquer uma das duas coleções é recusado; um
  pastor com telefone já cadastrado na biblioteca também.

**Importar CSV** aceita até 500 linhas por vez, com cabeçalho e estas
colunas (ordem livre; só `tipo`, `nome` e `email` são obrigatórias, mais
`telefone` para pastores):

| coluna | valores |
|---|---|
| `tipo` | `pastor`, `hjteam` ou `educador` |
| `nome` | nome completo |
| `email` | vira o login |
| `telefone` | obrigatório para pastor; só os dígitos são guardados |
| `pais` | um dos países da lista do perfil (`src/lib/academy/countries.ts`) |
| `cidade` | texto livre |
| `nascimento` | `AAAA-MM-DD` ou `DD/MM/AAAA` |
| `idade` | alternativa a `nascimento`: vira 1º de janeiro do ano correspondente |
| `idioma` | `pt` (padrão), `en` ou `es` |
| `igreja` | só para pastores |
| `senha` | em branco gera uma senha temporária; se preenchida, mínimo 6 caracteres |

Cada linha é tratada sozinha: o resultado diz, linha por linha, se a conta
foi **criada** (com a senha temporária, quando gerada), se o e-mail **já
existia** (no banco ou repetido mais acima no mesmo arquivo) ou se a linha
é **inválida** e por quê, em português.

**O primeiro educador(a)** ainda vem de `npm run seed` com `SEED_TUTOR_*` no
`.env.local` (cria também o curso de exemplo; é idempotente). A partir dele,
todas as outras contas nascem no painel. "Converter em educador(a)" na ficha
do aluno continua existindo para promover um aluno já cadastrado.

## 6. Rodando localmente

```
npm install
npm run seed      # opcional: curso de exemplo + educador(a)
npm run dev       # http://localhost:3000/academia
npm test          # regras, middleware e API contra um Mongo em memória
```

Sem um MongoDB à mão, `npm run db:local` sobe um em memória e imprime a URI
para colar no `.env.local` (os dados somem ao parar o processo). Sem o seed,
não há como entrar: não existe cadastro público (ver 5).

## 7. Onde está cada coisa

[ARCHITECTURE.md](ARCHITECTURE.md): rotas, modelo de dados, regras de
desbloqueio e correção, vídeo. [ANALISIS-PUREWATERWAVE.md](ANALISIS-PUREWATERWAVE.md)
(em espanhol): o que foi observado no site e as decisões tomadas.
