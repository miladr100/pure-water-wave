# Painel HJ Team — requisitos

Área privada de purewaterwave.org para o HJ Team: **academia**, **arrecadação
(Restauração Material)** e **testemunho (acompanhamento de convidados)** com um
único login, um único cadastro de pessoas e um painel de administração para
educadores. Decidido no grupo em 05/11/2026: tudo dentro de purewaterwave.org,
backend em TypeScript (rotas do Next.js) e MongoDB.

Estes documentos ficam por enquanto aqui no repositório, na branch `dev`.
Quando houver uma wiki, migram para lá sem mudar de formato. O formato segue a
wiki da academia FFPUM: visão geral, atores, histórias de usuário com critérios
de aceite (Dado / Quando / Então).

## Processo

Cada área passa por quatro estágios, nesta ordem, e só avança com o OK do
grupo (Milad, Wang Song, Yeseong) ou do Victor:

1. **Requisitos**: estes documentos.
2. **Design**: telas de referência, compartilhadas com o grupo para confirmar.
3. **Implementação**: na branch `dev`, com testes (`npm test`).
4. **Verificação**: `dev` → `qa` → PR para `main`.

## Documentos

| Doc | Conteúdo | Estágio |
|---|---|---|
| [01-analise-comparativa](01-analise-comparativa.md) | O que cada sistema existente já resolve (academia FFPUM, academia PWW, testemunho do Wang Song, planilha de RM) e o que o painel aproveita de cada um | Rascunho |
| [02-como-funciona-hoje](02-como-funciona-hoje.md) | A operação atual do HJ Team: papéis, ciclo diário de RM, planilha, jornada do convidado | Rascunho |
| [03-glossario](03-glossario.md) | Os termos, como o HJ Team os usa | Rascunho |
| [P1-contas-e-perfis](P1-contas-e-perfis.md) | Uma conta por pessoa, papéis (membro, capitão, educador, administrador), login, perfil | Rascunho |
| [P2-organizacao](P2-organizacao.md) | Programas e turmas, projetos e períodos, equipes e capitães | Rascunho |
| [P3-arrecadacao](P3-arrecadacao.md) | Relatório diário, validação do capitão, metas, resultados, exportação | Rascunho |
| [P4-testemunho](P4-testemunho.md) | Convidados, jornada, linha do tempo, próximo objetivo, relatórios | Rascunho |
| [P5-painel-admin](P5-painel-admin.md) | As telas do educador/administrador | Rascunho |
| [P6-area-do-membro](P6-area-do-membro.md) | As telas do membro e do capitão, celular e PWA | Rascunho |
| [P7-dados-e-migracao](P7-dados-e-migracao.md) | Modelo de dados no MongoDB, importação do sistema de testemunho e da planilha | Rascunho |
| [08-demo-e-testes](08-demo-e-testes.md) | A versão navegável (branch `feat/painel-ui`): o que cobre, contas de demonstração, como rodar e o que foi verificado | Em revisão |
| [decisoes-pendentes](decisoes-pendentes.md) | Perguntas abertas para o grupo e as premissas adotadas enquanto não há resposta | Vivo |
| Design: [Painel HJ Team (canvas)](https://claude.ai/artifact/NaRhc2TRnqUnd4LiyBkUCB) | 16 telas no estilo do site: 7 do celular (Painel e Academia), 2 do computador (Painel e Academia do membro), 5 da administração do educador e 2 exclusivas do administrador. O canvas ainda mostra o switch com três segmentos Painel · Academia · Administração; a versão navegável (08) já segue a decisão posterior: Painel · Academia · Biblioteca | Superado pela versão navegável |

A academia já tem requisitos próprios em `docs/academia/`; aqui ela aparece só
onde o painel a muda (login, perfil, navegação, quem é "aluno").

## Mapa de áreas do site depois do painel

| Rota | Quem entra | O que é |
|---|---|---|
| `/` e páginas públicas | Todos | O site como está hoje. Nada muda para quem não entra. |
| `/login` | Todos | O único login do site. |
| `/biblioteca` | Pastores, HJ Team, educadores | A biblioteca de hoje. |
| `/painel` | Membros, capitães, educadores, administradores | **Novo.** Início do HJ Team: relatório diário, convidados, equipe, atalhos para academia e biblioteca. |
| `/academia` | Membros, educadores | A academia (cursos), como está na `dev`. |
| `/admin` | Educadores, administradores | O painel de administração: hoje só academia; passa a ter projetos, equipes, membros, arrecadação e testemunho. |

## Decisões já tomadas

| Data | Decisão | Quem |
|---|---|---|
| 28/10/2026 | Um único Login no site; sem cadastro público; contas criadas pelo educador (diálogo ou CSV) | Victor, Yesong |
| 28/10/2026 | "Educador(a)" em vez de "tutor" na interface | Victor |
| 31/10–04/11/2026 | O HJ Team vai usar um portal com academia + arrecadação + testemunho, não só a academia; sem controle de estoque de material por enquanto | Yeseong, Sr. Sérgio, Victor |
| 05/11/2026 | Tudo em purewaterwave.org; backend TypeScript e MongoDB; PWA em vez de app nativo | Milad, Wang Song, Victor |
| 05/11/2026 | RM organizada por equipes; cada membro registra o próprio resultado; o capitão valida os da equipe | Wang Song |
| 05/11/2026 | Testemunho como jornada por convidado (etapas, linha do tempo, sugestões), não como formulário | Milad |
| 06/11/2026 | Branch `dev` (a partir de `feat/academia`), depois `qa`, depois `main`; PR #2 fechado | Victor |
| 06/11/2026 | O painel segue o design do site (Fraunces, Plus Jakarta Sans, tokens de `globals.css`, Lucide); a conta do membro tem duas áreas, Painel e Academia, trocadas por um switch no cabeçalho, ao lado do logo; o menu da área fica numa barra lateral no computador e na barra inferior no celular; arrecadação e testemunho são seções separadas, nunca um "relatório" genérico | Victor |
| 06/11/2026 | Equipes pertencem ao projeto; líquido = dinheiro + pix − despesas (dízimo fora); dois papéis: administrador do site (dá e tira educadores) e educador, com painéis ligeiramente diferentes; requisitos ficam em `docs/painel/` | Victor |
| 06/11/2026 | Primeira versão navegável em vez de mais mockups: frontend real na branch `feat/painel-ui` com dados de demonstração (`npm run seed:painel`) e preview na Vercel; o grupo testa os fluxos no celular e as correções vão no código (ver 08-demo-e-testes) | Victor |
| 06/11/2026 | O switch tem três áreas para todo mundo — Painel · Academia · Biblioteca —; a administração não é uma quarta: é o Painel do educador/administrador (`/admin`), com mais itens na barra lateral | Victor |
| 09/11/2026 | Perfil sai da barra lateral: abre pelo avatar no canto superior direito (Meu perfil · Sair) e é uma página, com "Instalar no celular" no topo | Victor |
| 09/11/2026 | O Início do administrador traz um geral da arrecadação (projeto de arrecadação ativo: total, por programa, por equipe) e um geral dos convidados (projeto de testemunho ativo: por etapa, por equipe, últimos acontecimentos) | Victor |
| 09/11/2026 | A academia não usa YouTube: as aulas são vídeos do Bunny Stream, na mesma biblioteca privada da academia da FFPUM (URLs assinadas, 4 variáveis `BUNNY_STREAM_*`, já configuradas no demo). O diálogo da aula lista os vídeos que já estão lá, aceita o GUID ou envia o arquivo | Victor |
| 09/11/2026 | Administradores têm **Biblioteca** na barra lateral (`/admin/biblioteca`) para adicionar livros, materiais e vídeos por link à biblioteca de todos; a academia segue as regras da FFPUM (módulos, atividade obrigatória para avançar, nota mínima 70, tentativas ilimitadas, melhor tentativa vale) | Victor |
| 09/11/2026 | Ao entrar, membros caem no Painel (`/painel`), educadores em `/admin`, pastores na biblioteca; o capitão não valida o próprio relatório (educador valida); testes automáticos cobrem regras e rotas do painel | Victor |
