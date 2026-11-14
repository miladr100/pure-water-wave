# P8 — Reuniões com o educador e avisos

| | |
|---|---|
| **Estágio** | Implementado na `dev` (14/11/2026) |
| **Depende de** | P1 (contas), P2 (equipes, educador responsável) |
| **Origem** | Sugestão do Dir. Henrique, trazida pelo Yeseong (14/11/2026): os jovens mandam mensagem no WhatsApp e não conseguem conversar com os educadores |

## Visão geral

O membro pede, pelo painel, uma **conversa individual** com o seu educador.
O pedido chega ao educador na hora (sino, e-mail, WhatsApp quando houver) e
ele responde pelo painel: confirma data, hora e lugar, sugere outro horário
ou diz que não pode agora. O membro recebe a resposta pelos mesmos canais.

**Atores:** Membro · Educador(a) · Administrador(a)

## Entidades

**Reunião** (`hj_reunioes`): membro, educador, motivo, disponibilidade (texto
livre: "depois das 19h"), estado (`solicitada` → `confirmada` | `remarcar` |
`recusada` | `cancelada`; `confirmada` → `realizada`), data e hora, local,
resposta do educador, quando foi respondida, quando cada lado viu, e os
**avisos** enviados (para quem, canal, se chegou).

## Histórias de usuário

### US-P8-01 — Pedir reunião

> Como membro, quero pedir uma reunião com o meu educador sem precisar do WhatsApp dele.

- Início do Painel tem o cartão "Falar com o educador"; Painel › Reuniões lista os pedidos e tem "Pedir reunião".
- O formulário sugere o educador da equipe (ou o educador responsável da conta) e deixa escolher outro; motivo obrigatório; "quando você pode" opcional.
- Um pedido em aberto por educador: o segundo é recusado (`ALREADY_OPEN`).
- O membro pode cancelar enquanto não foi realizada.

### US-P8-02 — Responder

> Como educador, quero ver os pedidos e responder em um toque.

- Painel › Reuniões (educador) lista os pedidos feitos a ele, os novos em destaque; o administrador vê os seus e pode ver todos (`?todas=1`).
- Responder: **Confirmar** (data e hora obrigatórias, local opcional, mensagem), **Sugerir outro horário** (mensagem obrigatória), **Não agora**. Uma confirmada pode ser marcada **Realizada**.
- Só o educador pedido (ou um administrador) responde; outro educador recebe 404.
- Botão **WhatsApp** com conversa pré-preenchida, dos dois lados (manual e grátis; não depende da API).

### US-P8-03 — Avisos

> Como membro ou educador, quero saber na hora que algo mudou.

- **Sino** (`/api/academia/me`): o educador vê o pedido novo; o membro vê a resposta. Abrir a página marca como visto.
- **E-mail** (Resend, `RESEND_API_KEY`): modelo `ReuniaoEmail` para pedido, recibo e resposta.
- **WhatsApp** (Cloud API): modelos `WHATSAPP_TEMPLATE_REUNIAO_PEDIDA`, `…_RECEBIDA`, `…_RESPONDIDA`, com `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`. Enquanto não estiver configurado, só sino e e-mail; o registro de avisos mostra o que foi por onde.
- Um aviso que falha nunca derruba o pedido.

## O que o WhatsApp precisa (estado em 14/11/2026)

O portfólio Meta **FFPUM Marketing** está verificado e tem o app "FFPUM
Academia", mas só com um número de teste: falta um **número de produção**
(próprio ou em coexistência com um número já usado no celular), webhook,
publicar o app, **forma de pagamento** e os modelos aprovados na categoria
"utility". Mensagens iniciadas pelo sistema são cobradas por mensagem
(Brasil, utility: cerca de US$ 0,007 cada; desde 01/10/2026 também dentro da
janela de 24 h). Mensagens de atendimento (resposta a quem escreveu antes)
têm 1.000 grátis por mês por número. Ver `src/lib/whatsapp.ts`.

## Fora de escopo

- Agenda com horários livres do educador (hoje é texto livre + confirmação).
- Lembrete automático no dia da reunião (entra com os lembretes de P6).
