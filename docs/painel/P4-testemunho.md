# P4 — Testemunho: convidados e jornada

| | |
|---|---|
| **Estágio** | Requisitos (rascunho) |
| **Depende de** | P1, P2 (projeto de testemunho, equipes) |
| **Referências** | Jornada do convidado (Milad, 05/11/2026); modelo e regras do sistema de Wang Song |

## Visão geral

Cada membro acompanha os próprios convidados como uma **jornada**: etapas com
marcos, uma linha do tempo do que aconteceu e o **próximo objetivo** com
sugestões. O educador vê o conjunto por equipe, programa e projeto. O modelo
de dados vem do sistema de Wang Song, acrescido da etapa Pré-Gateway, da lista
de 16 conferências e dos acontecimentos manuais.

**Atores:** Membro (pai/mãe espiritual) · Capitão · Educador(a) · Administrador(a)

## Entidades

**Convidado** (`convidado`): nome, telefone, cidade, idade (+ data de
referência), sexo, solteiro(a), interesses (tags), disponibilidade (texto
curto), observações, foto, **responsável** (membro), equipe (copiada do
responsável no cadastro; muda só por reatribuição), cadastrado em (define a
que projeto pertence nos relatórios), **etapa** (pre_gateway | gateway |
sistema_1 | sistema_2), marcos:

| Marco | Campo | Regra |
|---|---|---|
| Primeiro contato | `primeiroContatoEm` | obrigatório; ≥ qualquer outro marco não; nunca futuro |
| Primeira participação no Gateway | `gatewayEm` | obrigatório a partir de Gateway |
| Início do Sistema 1 | `sistema1InicioEm` | obrigatório a partir de Sistema 1 |
| Conferências assistidas | `conferencias[1..16]` (data cada) | marcáveis em qualquer ordem; "conferência atual" = maior marcada |
| Última visita | `ultimaVisitaEm` | atualizada por acontecimento |
| Conclusão do Sistema 1 | `sistema1FimEm` | obrigatório a partir de Sistema 2 |
| Ficha assinada | `fichaAssinadaEm` + PDF opcional | obrigatório a partir de Sistema 2; "PDF pendente" se sem arquivo |
| Início do Sistema 2 | `sistema2InicioEm` | obrigatório em Sistema 2 |
| Confirmado para Jardim | `jardimConfirmadoEm` | independente da etapa |
| Passagem comprada | `passagemCompradaEm` | independente da etapa |

Datas em ordem (primeiro contato ≤ gateway ≤ início S1 ≤ fim S1 ≤ ficha ≤
início S2), nunca no futuro, como no sistema de Wang Song. Registros importados
com datas desconhecidas são aceitos; editar a jornada exige completar.

**Acontecimento** (`acontecimento`): convidado, data, **tipo** (contato ·
oração · visita ao centro · home group · conversa · filme/evento · vídeo
(conferência N) · estudo do livro · seminário · outro · **automático**:
mudança de etapa, ficha, Jardim, passagem, reatribuição), descrição, autor,
criado em. A linha do tempo é a lista de acontecimentos.

## Histórias de usuário

### US-P4-01 — Cadastrar um convidado no campo

> Como membro, quero cadastrar alguém que acabei de conhecer, em 30 segundos, pelo celular.

**Critérios de aceite**
- Formulário curto: nome (obrigatório), telefone, cidade, interesses, disponibilidade, observação. Data do primeiro contato = hoje (editável). Etapa = Pré-Gateway.
- Responsável = eu; equipe = minha equipe no projeto de testemunho ativo (ou "sem equipe", permitido).
- Funciona sem conexão (fila de envio).
- Os demais dados (idade, sexo, solteiro, foto) podem ser completados depois na ficha.

### US-P4-02 — Ver a jornada de um convidado

> Como membro, quero abrir um convidado e entender em que etapa está, o que já aconteceu e o que falta.

**Critérios de aceite**
- Cabeçalho: nome, foto, responsável, equipe, etapa atual como trilha de 4 passos (feitos · atual · futuros).
- Cartão **Próximo objetivo**: o marco que falta para a próxima etapa, progresso quando mensurável (ex.: "4 de 16 conferências"), dias desde o último acontecimento, e **sugestão** (ver US-P4-05).
- **Linha do tempo** em ordem cronológica inversa, com acontecimentos manuais e automáticos distinguidos; botão "Registrar acontecimento".
- Seção de dados pessoais e ficha (PDF visualizável e baixável, Jardim, passagem).

### US-P4-03 — Registrar um acontecimento

> Como membro, quero registrar o que aconteceu com o convidado em dois toques.

**Critérios de aceite**
- Tipos como botões grandes (visita ao centro, conversa, oração, home group, vídeo…), data (padrão hoje), descrição opcional.
- Registrar "vídeo" pede qual conferência (lista 1–16 com as já vistas marcadas); marcar a 1ª conferência num convidado em Gateway propõe avançar para Sistema 1.
- Registrar um acontecimento atualiza `ultimaVisitaEm`.

### US-P4-04 — Avançar de etapa

> Como membro, quero marcar o marco que o convidado alcançou e ver a etapa mudar.

**Critérios de aceite**
- Avançar pede só a data do marco (gateway, início S1, conclusão S1 + ficha, início S2); valida a ordem e nunca futuro.
- Voltar uma etapa é permitido com confirmação (erro de cadastro), fica na linha do tempo.
- Ficha assinada: data obrigatória, PDF opcional (até 20 MB), "PDF pendente" até anexar; remover o PDF mantém a assinatura.
- Jardim e passagem: interruptores com data, independentes da etapa.

### US-P4-05 — Próximo objetivo e sugestões

> Como membro, quero que o app me diga o que fazer a seguir com cada convidado.

**Critérios de aceite (regras iniciais, sem IA)**
- Por etapa, o objetivo é fixo: Pré-Gateway → "primeira participação no Gateway"; Gateway → "assistir à 1ª conferência"; Sistema 1 → "assinar a ficha de membro" (mostra conferências restantes); Sistema 2 → "participar do seminário em Jardim".
- Sugestões por situação, texto configurável pelo administrador: sem acontecimento há mais de 7 dias ("ligue ou mande mensagem"); em Gateway há mais de 14 dias sem vídeo ("convide para a 1ª conferência"); em Sistema 1 com conferência N vista há mais de 7 dias ("marque a conferência N+1"); 16 conferências e sem ficha ("converse sobre a ficha"); ficha assinada e sem Jardim ("confirme para o próximo seminário").
- Lista "Meus convidados" ordena por urgência: quem tem sugestão vencida primeiro, com a sugestão na linha.
- Futuro: sugestões por IA a partir das observações (fora deste escopo).

### US-P4-06 — Meus convidados (membro) e convidados da equipe (capitão)

> Como membro, quero minha lista com filtros simples; como capitão, a da equipe.

**Critérios de aceite**
- Lista com busca, filtro por etapa, ordenação por urgência / nome / último acontecimento; chip de etapa e "há N dias".
- Capitão: mesma lista com a coluna responsável e filtro por membro; pode **reatribuir** um convidado dentro da equipe.
- Educador: todas as equipes, com os filtros padrão de P2 e os específicos (etapa, conferência, ficha, PDF, Jardim, passagem, sem responsável ativo, lixeira).

### US-P4-07 — Relatórios de testemunho

> Como educador, quero os números do projeto por equipe e programa, como no sistema de Wang Song.

**Critérios de aceite**
- Indicadores: total de convidados (cadastrados no intervalo do projeto/período, estado atual), por etapa (incluindo Pré-Gateway), fichas assinadas (e com PDF), confirmados para Jardim, passagens compradas.
- Por equipe / programa / turma / educador / país: contagem, por etapa, fichas; **resultados por membro**: membros com ≥ 1 convidado, com ≥ 1 ficha, média de convidados por membro ativo.
- Conferências: quantos convidados em cada uma (Sistema 1).
- Evolução por dia/semana/mês: cadastros e marcos no intervalo.
- Exportar CSV de convidados (com os mesmos filtros).

### US-P4-10 — Resultados por área (implementado 14/11/2026)

> Como educador, quero os números de cada centro de testemunho e a visão por região e país (o que o Rev. Kim pede).

- Testemunho › Por área: árvore região → país → local → equipe com convidados, por etapa, fichas, atenção e membros com convidado; totais por programa. Equipes sem local ficam em "Sem área definida".
- Conta as equipes do projeto de testemunho ativo; enquanto ele não tem equipes, as do projeto de RM ativo.

### US-P4-12 — Os quatro indicadores e o ponto de atenção (implementado 14/11/2026)

> Como educador, quero ler cada equipe pelos quatro números que o Rev. Kim pede — Kit 1, fichas assinadas, Kit 2, confirmados para o Jardim — e ser avisado quando eles se afastam.

- Indicadores **acumulados** por equipe (`indicadoresDe` em `src/lib/hj/testemunho.ts`): Kit 1 = convidados em Sistema 1 ou além; fichas = com ficha assinada; Kit 2 = em Sistema 2 ou além; Jardim = confirmados. Um convidado no Jardim conta nos quatro.
- **Ponto de atenção** (`pontoDeAtencao`): entre dois indicadores vizinhos (Kit 1 → fichas → Kit 2 → Jardim), quando o primeiro tem pelo menos 3 e o seguinte fica abaixo de 30 % dele. Exemplos do Yeseong: 90 no Kit 1 e 2 fichas; 10/10 e Kit 2 zero; 10/10/10 e Jardim zero. Limiares em `ATENCAO_MINIMO` e `ATENCAO_RAZAO` (decisão pendente #28).
- Aparece ao lado do nome da equipe em Testemunho › Equipes, em Por área e no Início do administrador; a tela Equipes mostra os cinco números por equipe e os totais.

### US-P4-13 — Orientação dada à equipe (implementado 14/11/2026)

> Como educador, quero registrar o que orientei à equipe depois de um ponto de atenção, para na próxima conversa perguntar se cumpriram.

- `hj_orientacoes` (módulo `testemunho`, equipe): texto, data da conversa, autor. A última aparece ao lado da equipe em Testemunho › Equipes; o histórico fica no diálogo "Registrar orientação". Só quem escreveu (ou administrador) apaga.
- O membro vê a última orientação da sua equipe no Início do Painel ("Orientação do educador para a equipe").

### US-P4-11 — Caixa da equipe (implementado 14/11/2026)

> Como capitã, quero cuidar do caixa da equipe durante o testemunho: quanto entrou, quanto saiu, quanto sobrou e a taxa de estadia.

- `hj_lancamentos`: entrada ou saída, categoria (RM, doação, estadia, alimentação, transporte, material, outro), valor, data, descrição, autor; o saldo é a soma.
- A capitã e o educador da equipe lançam e apagam; os membros veem; o educador vê o saldo de todas as equipes em Testemunho › Caixa e define a **taxa de estadia** por membro por dia.
- "Lançar estadia do período": membros × dias × taxa como uma saída automática; período que se sobrepõe a um já lançado é recusado.

### US-P4-08 — Importar convidados

> Como educador, quero importar convidados por CSV ou do sistema de Wang Song.

**Critérios de aceite**
- CSV com prévia, erros por linha, responsável por e-mail/nome, até 500 linhas; datas AAAA-MM-DD; etapa e marcos opcionais.
- Importação única dos dados de exemplo do sistema de Wang Song (P7), mantendo etapa, datas, ficha, Jardim e passagem, sem inventar Pré-Gateway (ficam com `primeiroContatoEm` = `gatewayEm` ou vazio).

### US-P4-09 — Privacidade

> Como administrador, quero que os dados dos convidados fiquem restritos a quem acompanha.

**Critérios de aceite**
- Membro vê só os próprios; capitão, os da equipe; educador/administrador, todos. A API responde 404 fora do escopo.
- Foto e PDF são servidos por rota autenticada com a mesma regra; nunca em `public/`.
- Agregados da equipe mostrados ao membro não têm nomes de convidados dos colegas.
- Exclusão lógica com lixeira (educador restaura); apagar de verdade só administrador.

## Fora de escopo

- Chatbot de WhatsApp.
- Mapa.
- Sugestões por IA.
