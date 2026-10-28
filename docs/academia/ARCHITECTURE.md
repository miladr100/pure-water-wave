# Academia Água Pura — arquitetura

Uma academia em vídeo (cursos → módulos → aulas → atividade de revisão) para
os jovens do movimento, com tutores que administram tudo pelo painel, dentro
do mesmo site. O modelo de funcionamento vem da academia da FFPUM; o código
segue, peça por peça, o que o resto do repositório já faz.

## O que a academia reaproveita e o que é dela

| site (biblioteca) | academia | observação |
|---|---|---|
| Next 16 App Router, React 19, Tailwind 4, shadcn/Radix em `src/components/ui` | igual | `ui/` é cópia literal |
| `globals.css` (tokens oklch, Fraunces + Plus Jakarta, gradientes, sombras) | igual | tema escuro só na área logada, como na biblioteca |
| MongoDB + mongoose, `connectDB()` com cache global | igual | coleções com prefixo `academy_` |
| Sessão JWT própria (`jose`) em cookie httpOnly | igual | cookie `pww_academy_session`, papéis `student`/`tutor` |
| `SystemUser` (pastor/hjteam) + segredo de cadastro | `AcademyUser` | aluno se cadastra livre; tutor precisa de `TUTOR_REGISTER_SECRET` ou ser convertido no painel |
| Rotas `/api/auth/*` (login, logout, register, profile, language, change/forgot/reset password) | `/api/academia/auth/*` | mesmas rotas, modelo `AcademyUser` |
| `LibraryHeader` + menu de configurações (nome, senha, tema, idioma) | `AppHeader` + menu de conta (avatar) + diálogo de perfil | nav muda por área; o perfil abre sobre qualquer tela, como na FFPUM |
| `LocaleProvider` + `messages.ts` (pt/en/es) | `components/academy/locale-provider` + `lib/i18n/academy-messages.ts` | copy própria |
| Resend + `@react-email` | igual | reset de senha, aviso de aluno novo |

## Áreas e rotas

```
/academia                                   home pública da academia (sem sessão) · painel do aluno (com sessão)
/academia/login  /academia/cadastro  /academia/esqueci-senha   públicas
/academia/cursos                            catálogo
/academia/cursos/[slug]                     curso: módulos, aulas, atividades
/academia/cursos/[slug]/aulas/[lessonId]    player + perguntas ao tutor
/academia/cursos/[slug]/atividade/[examId]  atividade de revisão
/academia/cursos/[slug]/concluido           curso concluído
/academia/perguntas                         minhas perguntas e respostas
?perfil=1 (em qualquer tela)                abre o diálogo de perfil: foto, dados, e-mail, senha, idioma, tema, outros idiomas, meu tutor
/academia/perfil                            só redireciona para /academia?perfil=1 (links antigos)
/admin                                      visão geral (tutores)
/admin/alunos, /admin/alunos/[id]           alunos, notas do tutor, converter em tutor
/admin/tutores                              tutores
/admin/cursos, /admin/cursos/[id]           editor de curso: módulos, aulas, atividades, perguntas
/admin/perguntas                            caixa de perguntas dos alunos
/admin/correcoes                            respostas escritas a revisar
```

`src/middleware.ts` exige a sessão da academia (cookie `pww_academy_session`)
em `/academia`, `/admin`, `/api/academia`, `/api/admin`, e papel `tutor` em
tudo que começa com `/admin`. Para quem não é tutor, `/admin/**` e
`/api/admin/**` respondem **404** (nunca um redirect ou 403 que confirme que
o painel existe); o layout de `/admin` repete a regra com `notFound()`. A
biblioteca continua com o gate de sempre.

## Modelo de dados (`src/models`)

- `AcademyUser` — conta (aluno ou tutor), idioma, país, cidade, telefone,
  `birthday`, `theme` (light/dark/system, adotado pelo navegador ao entrar),
  `showOtherLanguage` (ver cursos gravados em outros idiomas),
  `photo` (JPEG 512 px guardado no próprio documento, servido por
  `/api/academia/foto/[id]`, sem conta de storage),
  `tutorNotes`, `assignedTutorId` (o aluno escolhe o tutor no perfil; o
  painel também pode atribuir).
- `Course` — `slug`, `title`/`description` localizados (`{pt,en,es}`),
  `language` dos vídeos, `published`, `starter`, `order`, `prerequisites`
  (qualquer UM concluído libera), `modules[]` embutidos.
- `Lesson` — `courseId`, `moduleId`, `number` (posição no curso inteiro),
  `video {provider: youtube|bunny, youtubeId, bunnyVideoId}`, `materials[]`.
- `Exam` — atividade de revisão de módulo ou final: `passThreshold` (70),
  `requiredToAdvance`, `questions[]` com `qtype`
  `single|multi|truefalse|text|reflection`. **Nunca sai inteira para o aluno.**
- `Enrollment` (único por aluno+curso, `completedAt` permanente),
  `LessonProgress` (`percent`, `maxPercent` = teto de adiantamento),
  `ExamAttempt` (nota, respostas, **`examSnapshot`** congelado, `textReviews`),
  `Question` (pergunta do aluno numa aula, resposta do tutor).

## Regras (`src/lib/academy`)

- `gating.ts` — puras, sem banco: módulo 1 sempre aberto; o módulo N abre
  quando a atividade obrigatória do N-1 foi aprovada; atividade do módulo
  abre quando todas as aulas do módulo foram vistas; final abre quando todos
  os módulos estão completos; curso completo = módulos completos (+ final
  aprovada, se existir). `progressPct` = (aulas vistas + atividades que
  contam aprovadas) / (aulas + atividades que contam). Aula vista =
  `ended` ou `maxPercent ≥ 95` (e a 20 s do fim, se a duração é conhecida).
- `grading.ts` — corrige só múltipla escolha e V/F (conjunto exato);
  escritas ficam `pending`; nota = acertos/total MC; aprovado se ≥ limiar.
  `examSnapshot` congela a atividade no envio.
- `seekgate.ts` — teto de adiantamento + `createProgressSaver` (grava a cada
  12 s, só se mudou ≥ 1 %).
- `load.ts` — carrega estrutura e estado do aluno do banco e serializa para
  os tipos de `types.ts` (`courseCard`, `courseDetail`, `prerequisiteMet`,
  `recordCourseCompletion`).
- `bunny.ts` — URLs assinadas (token de diretório), criação de vídeo e
  autorização TUS; tudo opcional. `youtube.ts` — thumbnail e parse de id.
- `types.ts` — **o contrato** entre rotas e telas. Respostas de erro:
  `{ error: string, code?: string }`.

## Home pública

`/academia` sem sessão é a página de apresentação da academia (como
academy.ffpum.org): o que é, como funciona, os cursos abertos a quem começa
e o e-mail de contato (`ACADEMY_CONTACT_EMAIL` em
`src/components/academy/landing.tsx`). Sempre em tema claro (`.theme-light`
em `globals.css`). O site tem a seção `#academia` e o item "Academia
Online" no menu apontando para cá (`ACADEMY_EMAIL` em `home.tsx`).

## Perfil (como na academia da FFPUM, menos a parte de tutores)

`GET/PATCH /api/academia/me` (dados, idioma, tema, outros idiomas, tutor),
`POST/DELETE /api/academia/me/foto`, `PATCH /api/academia/auth/email`
(troca de e-mail confirmada com a senha atual — a FFPUM confirma por código,
mas aqui o envio de e-mail é opcional), `POST /api/academia/auth/change-password`,
`GET /api/academia/tutores`. O catálogo mostra só os cursos gravados no
idioma da conta, salvo se `showOtherLanguage` estiver ligado (tutores veem
tudo); quando não existe nenhum curso no idioma da conta, mostra os outros
mesmo assim, com o aviso de "não traduzido". As páginas de login, cadastro
e recuperação de senha ficam sempre no tema claro.

## Vídeo

Aulas no YouTube tocam com a IFrame API (progresso lido a cada segundo,
teto de adiantamento aplicado com `seekTo`). Aulas no Bunny tocam HLS
assinado num `<video>` (hls.js) com o teto aplicado no scrubber, nos botões
±10 s e no evento `seeking` do elemento. Tutores veem tudo sem teto e sem
gravar progresso.

## Testes

`npm test` roda a suíte (vitest): regras puras (`tests/unit`), middleware,
sessão e as rotas da API (`tests/api`) contra um MongoDB em memória —
nenhum segredo, nenhum e-mail. O workflow `.github/workflows/academia.yml`
roda typecheck, lint das pastas da academia e os testes em cada PR.

## Como rodar

```
npm install
npm run db:local                # Mongo em memória para testar (imprime a URI)
npm run seed                    # primeiro tutor + curso de exemplo
npm run dev                     # /academia e /admin
```

Arquivos da academia: `src/app/academia`, `src/app/admin`,
`src/app/api/academia`, `src/app/api/admin`, `src/components/academy`,
`src/components/admin`, `src/lib/academy`, `src/lib/i18n/academy-messages.ts`,
`src/models/*` (exceto os do site), `src/app/emails/academy`, `scripts/seed*`.
