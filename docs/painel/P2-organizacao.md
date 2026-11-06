# P2 — Organização: programas, projetos, equipes

| | |
|---|---|
| **Estágio** | Requisitos (rascunho) |
| **Depende de** | P1 (contas) |
| **Usado por** | P3 (arrecadação), P4 (testemunho), P5, P6 |

## Visão geral

A organização do HJ Team tem três eixos: **a que programa a pessoa pertence**
(estável, muda uma vez por ano), **em que projeto estamos** (uma campanha com
datas) e **em que equipe a pessoa está nesse projeto** (muda a cada projeto).
O sistema de Wang Song tem equipes permanentes e geográficas; a planilha de RM
tem equipes por programa numeradas, uma por educador. Decisão de requisito:
**a equipe pertence a um projeto**. Quem quiser as mesmas equipes no projeto
seguinte usa "copiar equipes do projeto anterior".

**Atores:** Administrador(a) · Educador(a) · Capitão · Membro

## Entidades

**Programa**: nome, sigla (HJA, HJR, PW, STG, UPA), logo, ativo, turmas[]
(nome, ativa). Cadastro inicial: HJ Academy (1ª, 2ª, 3ª Turma), HJ Rang (16ª
Turma), Pure Water (Turma 2026), Shin Top Gun (3ª Turma), UPA (11ª Turma).

**Projeto**: nome, **tipo** (arrecadação | testemunho), início, fim
(inclusivos), períodos[] (nome, início, fim; sem sobreposição, dentro do
projeto), situação (rascunho | ativo | encerrado), e configuração por tipo:

- *Arrecadação:* moeda (R$ por padrão), dias de descanso (dias da semana ou
  datas), meta por programa, meta diária inicial por membro, produtos
  (catálogo do projeto: nome, ordem, ativo), regra de nova meta (parâmetros:
  fator 1,3, arredondamento R$ 50, mínimo R$ 300), fórmula de líquido (ver
  decisões pendentes), se o dízimo entra.
- *Testemunho:* nada além de datas e períodos por enquanto.

**Equipe**: projeto, nome ("01 – HJA"), programa (opcional, para agrupar),
educador responsável, capitão (membro da equipe), membros[], país/cidade
(opcional), ativa. Uma pessoa está em no máximo uma equipe por projeto.

## Histórias de usuário

### US-P2-01 — Cadastrar programas e turmas

> Como administrador, quero manter a lista de programas e turmas, para que o cadastro de pessoas use valores padronizados.

**Critérios de aceite**
- Criar, renomear, desativar programa e turma; não apagar se houver pessoas vinculadas (desativar em vez disso).
- Trocar o programa de uma pessoa limpa a turma; a API recusa turma de outro programa.
- A sigla aparece nas listas e filtros; o nome completo nos formulários.

### US-P2-02 — Criar um projeto

> Como administrador, quero criar um projeto com datas e tipo, para que relatórios e equipes fiquem presos a ele.

**Critérios de aceite**
- **Dado** nome, tipo, início e fim **quando** salvo **então** o projeto fica em rascunho; um botão "dividir em períodos de N dias" cria períodos consecutivos (o último pode ser menor); períodos podem ser editados à mão sem sobrepor.
- Só um projeto de cada tipo pode estar **ativo** ao mesmo tempo (decisão pendente: pode haver RM e testemunho simultâneos? Premissa: sim, um de cada tipo).
- Ativar um projeto de arrecadação exige: moeda, pelo menos um produto, meta diária inicial. Metas por programa são opcionais.
- Encerrar um projeto bloqueia novos relatórios e novas equipes nele; os dados ficam para consulta e exportação.
- Mudar datas de um projeto ativo não pode deixar relatórios já enviados fora do intervalo.

### US-P2-03 — Montar equipes

> Como educador, quero montar as equipes do projeto com capitão e membros, para que os relatórios e os convidados fiquem organizados por equipe.

**Critérios de aceite**
- Criar equipe com nome, programa (opcional), educador responsável e membros escolhidos de uma lista de contas ativas com papel membro, com busca e filtro por programa; a lista mostra quem já está em outra equipe deste projeto (e impede escolher).
- Definir o capitão entre os membros da equipe. Sem capitão a equipe mostra "Capitão pendente".
- Mover um membro de uma equipe para outra, no mesmo projeto: os relatórios já enviados ficam com a equipe antiga (o relatório grava a equipe do momento).
- "Copiar equipes do projeto …" cria as equipes com os mesmos membros e capitães, ignorando pessoas inativas.
- Um membro sem equipe no projeto ativo pode usar a academia e cadastrar convidados, mas **não** envia relatório diário (o relatório exige equipe). O educador é avisado na lista de membros ("sem equipe").

### US-P2-04 — Trocar capitão

> Como educador, quero trocar o capitão de uma equipe sem recriar a equipe.

**Critérios de aceite**
- A troca vale imediatamente: o capitão antigo perde a validação e a visão da equipe, o novo ganha.
- Fica registrada no histórico da equipe (quem, quando).

### US-P2-05 — Ver minha equipe

> Como membro, quero ver quem está na minha equipe e quem é o capitão.

**Critérios de aceite**
- Nome e foto dos colegas, capitão destacado, educador responsável.
- Sem telefone nem dados pessoais dos colegas para o membro comum; o capitão vê telefone (para lembrar quem não enviou).

### US-P2-06 — Filtros padrão

> Como educador, quero que toda lista e relatório aceite os mesmos filtros, para comparar da mesma forma em todo lugar.

**Critérios de aceite**
- Filtros comuns: projeto (padrão: o ativo), período, equipe, programa, turma, educador, situação. Datas livres como alternativa a projeto/período.
- A preferência de projeto/período fica gravada por usuário (como no sistema de Wang Song).

## Fora de escopo

- Hierarquia região → país → cidade. País e cidade são campos simples da conta e da equipe.
- Equipes fora de projeto.
