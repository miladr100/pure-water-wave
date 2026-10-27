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
| `LibraryHeader` + menu de configurações (nome, senha, tema, idioma) | `AppHeader` + `SettingsMenu` | nav muda por área |
| `LocaleProvider` + `messages.ts` (pt/en/es) | `components/academy/locale-provider` + `lib/i18n/academy-messages.ts` | copy própria |
| Resend + `@react-email` | igual | reset de senha, aviso de aluno novo |

## Áreas e rotas

```
/academia/login  /academia/cadastro  /academia/esqueci-senha   públicas
/academia                                   painel do aluno (meus cursos, continuar)
/academia/cursos                            catálogo
/academia/cursos/[slug]                     curso: módulos, aulas, atividades
/academia/cursos/[slug]/aulas/[lessonId]    player + perguntas ao tutor
/academia/cursos/[slug]/atividade/[examId]  atividade de revisão
/academia/cursos/[slug]/concluido           curso concluído
/academia/perguntas                         minhas perguntas e respostas
/admin                                      visão geral (tutores)
/admin/alunos, /admin/alunos/[id]           alunos, primeiro contato, notas, converter em tutor
/admin/tutores                              tutores
/admin/cursos, /admin/cursos/[id]           editor de curso: módulos, aulas, atividades, perguntas
/admin/perguntas                            caixa de perguntas dos alunos
/admin/correcoes                            respostas escritas a revisar
```

`src/middleware.ts` exige a sessão da academia (cookie `pww_academy_session`)
em `/academia`, `/admin`, `/api/academia`, `/api/admin`, e papel `tutor` em
tudo que começa com `/admin`. A biblioteca continua com o gate de sempre.

## Modelo de dados (`src/models`)

- `AcademyUser` — conta (aluno ou tutor), idioma, país, `firstContactAt`,
  `tutorNotes`, `assignedTutorId`.
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

## Vídeo

Aulas no YouTube tocam com a IFrame API (progresso lido a cada segundo,
teto de adiantamento aplicado com `seekTo`). Aulas no Bunny tocam HLS
assinado num `<video>` (hls.js) com o teto aplicado no scrubber, nos botões
±10 s e no evento `seeking` do elemento. Tutores veem tudo sem teto e sem
gravar progresso.

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
