# Decisões pendentes

Perguntas abertas para o grupo. Cada uma tem a **premissa** adotada nos
requisitos enquanto não há resposta; se a resposta for outra, o documento
indicado muda. Atualizar a tabela de "Decisões já tomadas" no README quando
fechar.

| # | Pergunta | Para quem | Premissa adotada | Afeta |
|---|---|---|---|---|
| 1 | ~~**Equipes:** as equipes de RM são as mesmas do testemunho, ou cada projeto monta as suas?~~ **Decidido 06/11 (Victor):** cada projeto tem as suas. | — | Cada projeto tem as suas; "copiar do projeto anterior" cobre o caso de repetir. | P2 |
| 2 | ~~**Líquido:** vale a fórmula do relatório atual ou a da contabilidade? O dízimo entra?~~ **Decidido 06/11 (Victor):** dinheiro + pix − despesas, dízimo fora. | — | Fórmula A, parametrizável por projeto. | P3 |
| 3 | **Nova meta:** confirma média × 1,3, arredondado para cima a R$ 50, mínimo R$ 300? Com que frequência recalcular? | Yeseong | Sim; recálculo proposto a cada 10 dias, aplicado pelo educador. | P3 |
| 4 | **Material:** sem estoque, mantemos levou/voltou/restaurou no relatório? | Yeseong, Sr. Sérgio | Sim, informativo. | P3 |
| 5 | **Moeda:** equipes fora do Brasil reportam em reais ou na moeda local? | Yeseong | Uma moeda por projeto (R$); moeda estrangeira em espécie como texto. | P3, P7 |
| 6 | **Relatório do capitão:** quem valida o do próprio capitão? | Yeseong, Wang Song | O educador. | P3, P5 |
| 7 | **Ranking:** membros e equipes devem ver ranking (posição entre equipes/membros)? | Yeseong | Membro vê só a própria equipe vs. meta; ranking entre equipes só para educadores. | P3, P6 |
| 8 | **Meta do programa:** o membro vê a meta e o total do programa? | Yeseong | Não por padrão; interruptor no projeto. | P3 |
| 9 | **Projetos simultâneos:** pode haver um projeto de RM e um de testemunho ativos ao mesmo tempo? | Yeseong | Sim, um de cada tipo. | P2 |
| 10 | **Dia de descanso:** fixo (domingos) ou por projeto? Pode haver relatório em dia de descanso? | Yeseong | Por projeto; relatório em descanso só se o educador liberar. | P2, P3 |
| 11 | **Pré-Gateway:** quais dados o membro registra no primeiro contato? "Oração CSW – 1000x" é um acontecimento ou um campo? | Milad | Nome, telefone, cidade, interesses, disponibilidade; CSW é um tipo de acontecimento. | P4 |
| 12 | **Sugestões:** os textos e prazos (7 dias, 14 dias) estão bons? Quem os mantém? | Milad | Administrador edita em Configurações. | P4 |
| 13 | **Ficha em PDF:** continua sendo anexada pelo membro, ou só pelo educador? | Wang Song | Membro anexa; educador pode substituir. | P4 |
| 14 | **Dados de exemplo:** importar os 908 convidados e as 39 equipes do sistema de Wang Song para um ambiente de testes? | Wang Song | Sim, só em testes. | P7 |
| 15 | **Nome e domínio:** o painel se chama "Painel HJ Team"? Fica em purewaterwave.org/painel? Nome da PWA instalada? | Milad, Yeseong | "Painel HJ Team", `/painel`, PWA "Pure Water Wave". | P6 |
| 16 | **Login do site:** o botão Login leva membros a `/painel` e pastores a `/biblioteca`; o site público não muda. OK? | Milad | Sim. | P1 |
| 17 | ~~**Educador = administrador?**~~ **Decidido 06/11 (Victor):** dois papéis e dois painéis ligeiramente diferentes; o administrador administra o site e é quem adiciona e remove educadores. | — | Ver P1 e P5. | P1, P5 |
| 18 | **Lembretes:** push/e-mail às 20h e resumo do capitão às 22h, fuso de São Paulo? | Yeseong | Sim, configurável por projeto. | P3, P6 |
| 19 | **Chatbot de WhatsApp:** o bot do Wang Song entra na primeira versão? | Wang Song, Yeseong | Não; PWA primeiro; bot depois se fizer falta. | — |
| 20 | **Backups e ambiente:** Mongo Atlas de quem (conta do Milad)? Quem tem acesso? | Milad | Atlas na conta do site; `dev`/`qa` em clusters free separados. | P7 |

| 21 | **Validação do próprio relatório:** o capitão valida o da sua equipe; o dele mesmo, quem valida? **Premissa adotada 09/11 (Victor/Claude):** o capitão não valida o próprio relatório — o educador da equipe (ou um administrador) valida. | Yeseong | Implementado assim na versão navegável; muda em uma linha se o grupo preferir. | P3 |

## Premissas gerais

- Interface em português do Brasil, com en/es pelos catálogos existentes.
- O site público não muda; só quem entra vê o painel.
- Nada de IA na primeira versão (sugestões por regra).
- Ordem de entrega: P1+P2 → P3 (RM) → P6 (PWA) → P4 (testemunho) → P5 completo.
- Papéis mudam no banco na hora; o cookie de sessão (7 dias) só acompanha no próximo login ou quando a pessoa edita o perfil. Tirar alguém de educador não derruba a sessão dele na academia até lá — aceito por enquanto (ver P1).
