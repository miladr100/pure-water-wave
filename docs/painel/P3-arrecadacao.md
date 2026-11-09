# P3 — Arrecadação (Restauração Material)

| | |
|---|---|
| **Estágio** | Requisitos (rascunho) |
| **Depende de** | P1, P2 (projeto de arrecadação ativo, equipes com capitão) |
| **Prioridade** | **Primeira** entrega do painel (pedido da continental, 03/11/2026) |

## Visão geral

Substitui o ciclo WhatsApp → capitão → educador → planilha por: o membro
preenche o relatório no celular, o capitão valida, a planilha se monta
sozinha. Os campos são os do relatório atual; as contas (líquido, restaurou,
média, recorde, nova meta, totais por programa) são feitas pelo sistema.

**Atores:** Membro · Capitão · Educador(a) · Administrador(a)

## Entidades

**Relatório diário** (`relatorio_diario`): projeto, equipe (a do membro no
momento do envio), membro, data, meta interna (texto), meta externa (valor),
dinheiro, pix, alimentação, transporte, outros (valor + descrição), **líquido**
(calculado), material[] (produto, levou, voltou, **restaurou** calculado),
moeda estrangeira (texto livre opcional, ex.: "60 ctvs euro"), observações,
**situação** (rascunho | enviado | validado | devolvido), enviado em, validado
por/em, comentário da devolução, histórico de alterações. Único por (membro,
data, projeto).

**Meta diária do membro** (`meta_diaria`): projeto, membro, valor, desde
(data), origem (inicial | nova meta automática | ajuste manual), definida por.
A meta vigente de um dia é a última com `desde` ≤ data.

## Histórias de usuário

### US-P3-01 — Preencher o relatório do dia

> Como membro, quero preencher o relatório do dia no celular em menos de dois minutos, para não ter que escrever mensagem.

**Critérios de aceite**
- **Dado** um projeto de arrecadação ativo e uma equipe **quando** abro "Relatório" **então** vejo o formulário do dia de hoje, com a data editável só para dias anteriores dentro do projeto (nunca futuro, nunca dia de descanso, salvo se o educador liberar o dia).
- Campos na ordem do modelo atual: meta interna (pré-preenchida com a última), meta externa (pré-preenchida com a meta diária vigente), dinheiro, pix, alimentação, transporte, outros (+ descrição), material por produto (levou, voltou), moeda estrangeira (opcional), observações.
- **Líquido** e **restaurou** aparecem calculados ao digitar; `voltou` não pode ser maior que `levou`.
- Teclado numérico nos valores; produtos do catálogo do projeto, na ordem configurada; o último "levou" de cada produto é sugerido.
- Salvar como rascunho (automático, inclusive sem conexão) e **Enviar ao capitão**. Depois de enviado, o membro só edita se o capitão devolver.
- Um relatório por dia; tentar criar outro abre o existente.
- Se o membro não tem equipe no projeto ativo, a tela explica e não deixa enviar.

### US-P3-02 — Validar os relatórios da equipe

> Como capitão, quero ver quem enviou, validar com um toque e devolver com um comentário, para fechar o dia da equipe.

**Critérios de aceite**
- "Equipe" mostra, para a data escolhida (padrão hoje), cada membro com: líquido, situação (sem envio · rascunho · enviado · validado · devolvido) e total da equipe (só validados contam no total oficial; enviados aparecem como "a validar").
- "Validar enviados" valida todos os enviados; validar um a um abre o relatório completo.
- "Devolver" exige comentário; o membro recebe aviso e o relatório volta a ser editável.
- "Lembrar quem falta" abre, por membro sem envio, um link `wa.me` com mensagem pronta (não envia nada automaticamente) e registra que lembrou.
- O capitão pode **registrar por um membro** sem celular: o relatório nasce já validado e marcado "registrado pelo capitão".
- O capitão valida o próprio relatório? **Não**: o próprio vai para o educador (ver decisões pendentes).
- Validado pode ser reaberto pelo capitão até o fechamento do dia pelo educador; depois só o educador.

### US-P3-03 — Metas

> Como administrador, quero metas por programa e por membro, com a nova meta calculada como na planilha.

**Critérios de aceite**
- Meta por programa para o projeto, editável enquanto o projeto está ativo (com histórico).
- Meta diária inicial igual para todos (R$ 300 em 2026), aplicada a cada membro ao entrar numa equipe.
- **Nova meta:** a cada N dias (configurável; a planilha fez ao fim do projeto), o sistema propõe para cada membro `arredondar_para_cima(média × fator, 50)`, com mínimo configurado; o educador revisa e aplica (em lote) ou ajusta à mão. A regra fica parametrizada no projeto. Toda meta tem `desde`, então a comparação "meta × resultado" usa a meta vigente no dia.
- O membro vê a própria meta diária e a meta interna; **não** vê a meta por programa salvo se o administrador marcar "mostrar meta do programa aos membros".

### US-P3-04 — Resultados (a planilha, automática)

> Como educador, quero a planilha de hoje gerada sozinha, para acompanhar e cobrar sem digitar.

**Critérios de aceite**
- Tela "Resultados" com os filtros padrão (P2) e três blocos:
  1. **Panorama:** total arrecadado × meta por programa e total, percentual, dias decorridos/restantes, membros participantes por programa, maior resultado do dia, quantos relatórios validados hoje.
  2. **Por dia:** série diária do total (por programa e geral), dinheiro vs. pix, com os dias de descanso marcados; gráfico de linhas/colunas.
  3. **Grade por membro:** linhas por programa → equipe → membro, colunas Dia 1 … Dia N (descanso em cinza), Total, Média (dias com relatório), Recorde, Meta vigente, Nova meta proposta. Célula colorida quando bate a meta; vazia quando não há relatório; "a validar" com marca.
- A média considera só dias com relatório validado (como a planilha: células vazias não contam).
- Ordenação por qualquer coluna; busca por nome; clicar no membro abre o histórico dele; clicar numa célula abre o relatório daquele dia.
- Bloco **Contabilidade** (aba): por dia e programa, dinheiro, pix, outros valores a receber (campo manual do educador), total; e despesas somadas (alimentação, transporte, outros).
- **Exportar CSV** no layout da planilha atual (uma linha por membro, uma coluna por dia) e um CSV "longo" (uma linha por relatório). Dados pessoais limitados a nome e programa.

### US-P3-05 — Resultados para o membro

> Como membro, quero ver como estou e como está minha equipe, sem ver o resultado individual dos colegas.

**Critérios de aceite**
- No início: resultado de hoje, meta diária, média, recorde, total do projeto, gráfico dos últimos 7 dias.
- Equipe: total da equipe por dia e no projeto, posição da equipe entre as equipes do programa (opcional, decisão pendente: ranking entre equipes é desejado?). Sem valores individuais dos colegas.
- Capitão vê os valores individuais da própria equipe.

### US-P3-06 — Lembretes

> Como membro, quero um lembrete no fim do dia se ainda não enviei o relatório.

**Critérios de aceite**
- Notificação push (PWA instalada) ou e-mail no horário configurado no projeto (ex.: 20h, fuso do projeto), só em dia de linha de frente e só se não há envio.
- O capitão recebe um resumo às 22h: quantos enviaram, quantos faltam.
- Cada um pode desligar no perfil.

### US-P3-07 — Correções e auditoria

> Como educador, quero corrigir um relatório errado e saber quem mudou o quê.

**Critérios de aceite**
- Educador/administrador editam qualquer relatório; a edição guarda versão anterior, autor e motivo.
- O membro vê "corrigido pelo educador" no próprio relatório.
- Apagar um relatório é exclusão lógica; o dia volta a "sem envio".

## Regras de cálculo (parametrizadas no projeto)

```
restaurou   = levou − voltou                          (por produto, ≥ 0)
bruto       = dinheiro + pix
despesas    = alimentação + transporte + outros
líquido     = bruto − despesas                        (fórmula A, a do relatório atual)
            = bruto − despesas − dízimo               (fórmula B, se o dízimo entrar — decisão pendente)
média       = soma(líquido dos dias validados) / nº de dias validados
recorde     = máx(líquido)
nova meta   = máx(mínimo, teto_múltiplo(média × fator, 50))   fator 1,3; mínimo R$ 300 (a confirmar)
```

Valores em centavos inteiros no banco; moeda do projeto. Moeda estrangeira em
espécie fica como texto no relatório e **não** soma.

## Fora de escopo

- Controle de estoque de material (decisão do Sr. Sérgio).
- Estadia e cobrança semanal (modelo de Wang Song).
- Pagamentos ou transferências.
