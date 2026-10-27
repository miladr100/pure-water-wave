# Academia Água Pura — o que é e o que falta

A academia é uma área nova deste mesmo site: cursos em vídeo organizados em
módulos, aulas e atividades de revisão, com tutores que acompanham cada
aluno. Foi escrita com **os mesmos padrões do resto do repositório** (Next
16, Tailwind 4, shadcn, MongoDB/mongoose, sessão JWT própria, Resend,
`messages.ts` em pt/en/es), então quem mantém o site mantém a academia. O
modelo pedagógico vem da academia da FFPUM.

O que falta é **só configuração**: as variáveis de ambiente abaixo e, se
quiserem vídeos privados, uma conta no Bunny Stream.

## 1. O que está pronto

- Área do aluno em `/academia`: cadastro livre, login, recuperação de senha
  por código (igual à biblioteca), catálogo, inscrição grátis, player com
  **bloqueio de adiantamento** (não dá para pular o que ainda não viu),
  progresso que continua de onde parou, atividades de revisão corrigidas na
  hora (múltipla escolha, V/F) e respostas escritas revisadas por um tutor,
  cursos que se desbloqueiam ao concluir outros, perguntas ao tutor dentro da
  aula, notificações de resposta, e o perfil (foto, dados, e-mail, senha,
  idioma, tema claro/escuro/sistema, cursos em outros idiomas, escolha do
  tutor). A foto fica no próprio MongoDB, então não precisa de storage.
- Painel dos tutores em `/admin` (tutores são os administradores): visão
  geral, alunos (busca, filtro de "primeiro contato", anotações, tutor
  responsável, converter em tutor), tutores, editor completo de cursos
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
- As únicas edições em arquivos existentes: `src/middleware.ts` (ganhou o
  gate da academia, com cookie próprio `pww_academy_session`),
  `src/lib/theme.ts` (tema escuro também em `/academia` e `/admin`),
  `tsconfig.json` (inclui as pastas novas), `package.json` (`hls.js`,
  `tus-js-client`, `tsx`, `mongodb-memory-server`, scripts `seed`,
  `db:local`, `typecheck`).
- As coleções no MongoDB têm prefixo `academy_` — nada do site é tocado.
- Os usuários da biblioteca (`SystemUser`) e os da academia (`AcademyUser`)
  são contas diferentes; um pastor que quiser ser tutor cria a conta na
  academia.

## 3. Variáveis de ambiente

Já existentes e reaproveitadas: `MONGODB_URI`, `AUTH_SECRET`,
`RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.

Novas (opcionais):

| Variável | Para quê |
|---|---|
| `TUTOR_REGISTER_SECRET` | Quem souber pode se cadastrar direto como tutor em `/academia/cadastro`. Sem ela, tutores só nascem pelo painel ("Converter em tutor") ou pelo seed. |
| `EMAIL_FROM` | Remetente dos e-mails da academia (padrão: `Pure Water Wave <contact@purewaterwave.org>`). |
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

## 5. Primeiro tutor

- Cadastrar-se em `/academia/cadastro` marcando "Sou tutor(a)" e digitando o
  `TUTOR_REGISTER_SECRET`; ou
- `npm run seed` com `SEED_TUTOR_*` no `.env.local` (cria também o curso de
  exemplo; é idempotente).

Depois, novos tutores são promovidos pelo painel ("Converter em tutor").

## 6. Rodando localmente

```
npm install
npm run seed      # opcional: curso de exemplo + tutor
npm run dev       # http://localhost:3000/academia
npm test          # regras, middleware e API contra um Mongo em memória
```

Sem um MongoDB à mão, `npm run db:local` sobe um em memória e imprime a URI
para colar no `.env.local` (os dados somem ao parar o processo).

## 7. Onde está cada coisa

[ARCHITECTURE.md](ARCHITECTURE.md): rotas, modelo de dados, regras de
desbloqueio e correção, vídeo. [ANALISIS-PUREWATERWAVE.md](ANALISIS-PUREWATERWAVE.md)
(em espanhol): o que foi observado no site e as decisões tomadas.
