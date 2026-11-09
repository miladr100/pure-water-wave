# P5 — Painel de administração (educadores e administradores)

| | |
|---|---|
| **Estágio** | Requisitos (rascunho) |
| **Depende de** | P1–P4 |
| **Base** | `/admin` da academia (`AdminShell`, `AppHeader`, tabelas, diálogos) |

## Visão geral

O `/admin` de hoje (academia) ganha as áreas de organização, arrecadação e
testemunho. É uma ferramenta de trabalho de mesa: usada no computador, mas
funcional no celular (o educador também sai à rua). Mantém o estilo do site:
cabeçalho com navegação, conteúdo centrado, tabelas em cartões no celular.

**Atores:** Educador(a) · Administrador(a)

## Navegação

A administração **não é uma quarta área**: é o Painel do educador e do
administrador (decidido em 06/11/2026). O switch do cabeçalho tem três
segmentos para todo mundo — Painel · Academia · Biblioteca — e o Painel de
quem é educador abre em `/admin`, com os itens abaixo na barra lateral
(computador) ou na barra inferior (celular). Mesmo cabeçalho e estilo do
site (ver P6, "Estilo" e "Navegação").

São dois painéis ligeiramente diferentes (decidido em 06/11/2026):

```
Educador:       Início · Arrecadação · Testemunho · Pessoas · Academia · Equipes
Administrador:  Início · Arrecadação · Testemunho · Pessoas · Academia · Equipes · Biblioteca · Organização · Configurações
```

O administrador vê as mesmas telas do dia a dia que o educador. O que só ele
tem: **Biblioteca** (`/admin/biblioteca`: adicionar, ocultar, editar e remover
livros, materiais e vídeos por link, que aparecem na biblioteca de pastores,
membros e educadores no idioma escolhido — decidido em 09/11/2026),
**Organização** (projetos, equipes, programas e turmas, produtos),
**Configurações**, e em **Pessoas** as abas Educadores, Administradores e
Pastores, onde dá e tira esses papéis. Para o educador, "Equipes" é um item de
menu próprio (montar equipes do projeto ativo) e Pessoas tem só Membros.

| Área | Telas | Quem |
|---|---|---|
| **Início** | Panorama do projeto ativo de cada tipo (ver abaixo) | Educador, Admin |
| **Arrecadação** | Resultados (panorama, por dia, grade por membro, contabilidade) · Relatórios do dia (fila de validação por equipe, filtro "a validar", "devolvidos", "sem envio") · Metas (por programa, novas metas propostas) · Exportar | Educador, Admin |
| **Testemunho** | Convidados (lista com filtros, ficha completa, lixeira) · Relatórios (indicadores, por equipe/programa, conferências, evolução) · Importar · Exportar | Educador, Admin |
| **Pessoas** | Membros (lista, ficha, nova conta, importar CSV) · **Educadores** (lista, novo, promover membro, tirar papel com reatribuição de equipes e membros) · **Administradores** · Pastores (como hoje) | Membros: Educador; o resto: Admin |
| **Academia** | Cursos · Correções · Perguntas · Alunos (as telas de hoje; "Alunos" passa a ser um atalho para Pessoas → Membros com a aba de progresso) | Educador, Admin |
| **Organização** | Projetos (lista, editor com períodos e configuração de RM) · Equipes (do projeto escolhido; montar, capitão, copiar do anterior) · Programas e turmas · Produtos | Equipes: Educador; resto: Admin |
| **Configurações** | Textos das sugestões (P4) · Lembretes (horários) · Histórico de alterações · Exportações completas | Admin |

## Histórias de usuário

### US-P5-01 — Início do educador

> Como educador, quero abrir o painel e saber o que precisa de atenção hoje.

**Critérios de aceite**
- Para o projeto de **arrecadação** ativo: dia N de M, total × meta (barra), relatórios de hoje (validados / a validar / sem envio) com atalho para a fila, maior resultado do dia, equipes com capitão pendente.
- Para o projeto de **testemunho** ativo: convidados no período, por etapa, fichas, convidados sem acontecimento há mais de 14 dias (atalho), membros sem convidados.
- Academia: correções e perguntas pendentes (como hoje).
- Sem projeto ativo: cartão "Criar projeto" (admin) ou aviso (educador).

### US-P5-02 — Fila de validação

> Como educador, quero ver todos os relatórios do dia, por equipe, e fechar o dia.

**Critérios de aceite**
- Tabela por equipe → membro com situação e líquido; filtros por situação, equipe, programa; data escolhida.
- Educador pode validar, devolver, corrigir e registrar por alguém; "Fechar o dia" trava as validações dos capitães para aquela data (reabrir só educador).
- Relatórios do próprio capitão aparecem para o educador validar.

### US-P5-03 — Lista de membros

> Como educador, quero a lista de pessoas com filtros e ordenação no servidor.

**Critérios de aceite**
- Colunas: nome (com foto), programa/turma, equipe (projeto ativo), capitão?, educador, país, situação, último acesso; ordenação por qualquer uma; busca; filtros por programa, equipe, educador, situação, "sem equipe", "sem educador"; paginação de 25/50/100.
- Ficha da pessoa com abas: Dados · HJ Team (programa, turma, equipe, papéis) · Arrecadação (histórico de relatórios e metas) · Convidados · Academia (progresso, como hoje) · Anotações · Histórico.
- Ações: editar, desativar/reativar, redefinir senha temporária, converter em educador (como hoje), mudar papéis (admin).

### US-P5-04 — Projetos e equipes

> Como administrador, quero criar o projeto e, como educador, montar as equipes, numa única área.

**Critérios de aceite**
- Projetos: lista por situação; editor com datas, períodos ("dividir em 40 dias"), configuração de RM (moeda, descanso, produtos, metas, regras); ativar/encerrar com confirmação.
- Equipes: seletor de projeto; cartões por equipe com capitão, nº de membros, educador; editor com busca de membros; "copiar do projeto anterior".

### US-P5-05 — Convidados (visão global)

> Como educador, quero a lista global de convidados com a ficha completa.

**Critérios de aceite**
- Lista com os filtros de P4 (US-P4-06) e as colunas: nome, etapa, conferência, responsável, equipe, último acontecimento, ficha, Jardim, passagem.
- Ficha completa igual à do membro, mais: reatribuir para qualquer membro, mover de equipe, lixeira/restaurar, histórico de alterações.

### US-P5-06 — Exportações

> Como administrador, quero exportar tudo em CSV, para a planilha e para a continental.

**Critérios de aceite**
- Arrecadação: grade (layout da planilha) e longo; contabilidade por dia.
- Testemunho: convidados (com filtros), acontecimentos.
- Pessoas: membros, educadores (sem senhas nem hashes).
- UTF-8 com BOM, vírgula, aspas escapadas; nomes de arquivo com projeto e data.

### US-P5-07 — Histórico de alterações

> Como administrador, quero saber quem mudou o quê.

**Critérios de aceite**
- Registro de: contas (criar, papéis, desativar), equipes (membros, capitão), projetos (datas, metas, ativar/encerrar), relatórios corrigidos/validados/devolvidos, convidados (criar, etapa, reatribuir, excluir/restaurar), exportações.
- Lista com filtros por pessoa, entidade e data; não editável.

## Padrões de tela

- Tabelas: ordenação e filtros **no servidor**, paginação, busca com debounce, cartões no celular (padrão `DataTable` da FFPUM; substitui a ordenação em memória de hoje).
- Confirmação em diálogo para ações destrutivas ou irreversíveis (encerrar projeto, fechar o dia, desativar pessoa); toast de resultado.
- Erros com o que aconteceu e como resolver; estados vazios com a ação seguinte ("Nenhuma equipe neste projeto. Montar equipes").
- Filtros padrão de P2 no topo, com a preferência de projeto/período gravada.
- 404 para o que a pessoa não pode ver.
