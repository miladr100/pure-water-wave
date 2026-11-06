# P6 — Área do membro, capitão e celular (PWA)

| | |
|---|---|
| **Estágio** | Requisitos (rascunho) |
| **Depende de** | P1–P4 |
| **Base** | `/academia` (`PageShell`, `AppHeader`, perfil), PWA da biblioteca (Serwist) |

## Visão geral

O membro usa o painel quase só no celular, muitas vezes na rua e sem sinal.
A área do membro é uma PWA instalável com barra de abas inferior, formulários
de uma mão, e fila de envio para quando a conexão volta. A academia continua
em `/academia` com o mesmo cabeçalho; o Início do membro passa a ser `/painel`.

**Atores:** Membro · Capitão

## Estilo

O painel usa o design do site, sem variação: Fraunces nos títulos, Plus
Jakarta Sans no texto, os tokens de cor de `globals.css` (`--primary`
#0082bb, `--primary-deep` #003668, `--secondary`, `--mint`, `--coral`), botões
em pílula (`rounded-full`, `bg-gradient-cta` para a ação principal), cartões
`rounded-3xl` com `shadow-card`, ícones Lucide, o logo redondo
(`BrandLogo`) e o cabeçalho que a biblioteca e a academia já usam
(`AppHeader`: logo, título em Fraunces, subtítulo, botões de navegação,
menu em folha no celular). Nada novo de tipografia ou paleta.

## Duas áreas, um switch (decidido em 06/11/2026)

A conta do membro tem **duas áreas**, trocadas por um **switch** no cabeçalho
(segmento Painel | Academia, logo ao lado do logo e do título), para manter
cada uma limpa:

- **Painel**: arrecadação, testemunho, equipe, perfil. Rota `/painel`.
- **Academia**: a academia como está na `dev` (cursos, aulas, atividades,
  perguntas). Rota `/academia`. Nada muda nas telas dela além do switch e do
  menu de conta compartilhado.

A **Biblioteca** é o terceiro segmento, para todo mundo (Painel · Academia ·
Biblioteca); dentro dela a barra lateral traz Biblioteca, Materiais, Vídeos,
Ferramentas e Fale com a IA. Para educadores e administradores o segmento
Painel abre a administração (`/admin`): é o mesmo Painel, com mais itens,
não uma quarta área (decidido em 06/11/2026). O switch lembra a última área:
ao abrir a PWA, a pessoa cai onde parou.

## Navegação (barra inferior no celular, barra lateral no computador)

O cabeçalho só tem logo, título, o switch de área e o menu de conta. O menu
da área ativa (os itens abaixo, com ícone Lucide) fica numa **barra lateral**
fixa à esquerda a partir de 900 px, colada à borda da janela, com fundo
branco translúcido e borda à direita. Um botão no rodapé da barra
(**Recolher**) a reduz a só ícones (76 px, com tooltip no nome) e a expande
de volta; a escolha é lembrada por conta. Em telas menores ela vira a
**barra inferior** — o cabeçalho nunca cresce em altura quando a janela
estreita.

```
Painel:    Início · Arrecadação · Testemunho · Perfil            (membro)
           Início · Arrecadação · Equipe · Testemunho · Perfil   (capitão)
Academia:  Meus cursos · Catálogo · Perguntas · Perfil           (as telas de hoje)
```

"Arrecadação" abre o relatório de RM do dia e o histórico; "Testemunho" abre
os convidados. Os dois nunca se misturam numa tela só: o relatório de RM é de
arrecadação, a jornada é de testemunho.

## Histórias de usuário

### US-P6-01 — Início

> Como membro, quero abrir o app e ver o que tenho que fazer hoje.

**Critérios de aceite**
- Cartões, nesta ordem: **relatório de hoje** (pendente → botão "Preencher"; enviado → "aguardando o capitão"; validado → líquido do dia; devolvido → motivo e "Corrigir"); **minha meta** (meta diária, média, recorde, barra do dia); **convidados** (quantos, quantos com sugestão vencida, o primeiro deles); **academia** (continuar de onde parou); **equipe** (total do dia da equipe); **biblioteca**.
- Em projeto de testemunho sem RM, o cartão de relatório não aparece e o de convidados sobe.
- Sem projeto ativo: academia e biblioteca apenas, com uma linha "Nenhum projeto em andamento".

### US-P6-02 — Arrecadação: relatório de RM

> Como membro, quero o formulário de P3 (US-P3-01) feito para o polegar.

**Critérios de aceite**
- Campos em cartões (Resultado · Despesas · Material · Observações), teclado numérico, líquido fixo no rodapé enquanto rolo, botão "Enviar ao capitão" sempre visível.
- Histórico: lista dos dias do projeto com situação e líquido; dias devolvidos em destaque.
- Sem conexão: salva local e mostra "será enviado quando houver conexão"; ao reconectar, envia e avisa.

### US-P6-03 — Equipe (capitão)

> Como capitão, quero fechar o dia da equipe pelo celular.

**Critérios de aceite**
- Tela de P3 US-P3-02: data, total, lista de membros com situação e líquido, "Validar enviados (N)", "Lembrar quem falta" (links `wa.me`), registrar por alguém.
- Tocar num membro abre o relatório dele com Validar / Devolver (comentário obrigatório).
- Aba "Convidados da equipe" com responsável e reatribuição.

### US-P6-04 — Testemunho: convidados

> Como membro, quero minha lista e a jornada de cada convidado (P4).

**Critérios de aceite**
- Lista ordenada por urgência com chip de etapa, "há N dias" e a sugestão; busca; filtro por etapa; botão flutuante "Novo convidado".
- Ficha com trilha de etapas, próximo objetivo, linha do tempo e "Registrar acontecimento" (folha inferior com tipos em botões grandes).
- Ligar / WhatsApp do convidado a partir da ficha (links `tel:` e `wa.me`).

### US-P6-05 — Academia

> Como membro, quero a academia como está, alcançada pelo switch.

**Critérios de aceite**
- `/academia/**` mantém as telas da `dev` (dashboard com "Continuar aprendendo", catálogo, curso, aula, atividade, perguntas, perfil); só ganha o switch no cabeçalho e a barra inferior própria no celular.
- O cartão "Academia" no Início do Painel abre "Continuar" se houver curso em andamento, senão o catálogo.
- Sem conexão, a academia avisa e não tenta reproduzir vídeo; o restante do painel segue funcionando.

### US-P6-06 — Perfil e notificações

> Como membro, quero o perfil de hoje mais as preferências de lembrete.

**Critérios de aceite**
- Diálogo de perfil atual + seção HJ Team (P1 US-P1-05) + interruptores: lembrete do relatório diário, resumo da equipe (capitão), sugestões de convidados (semanal), avisos da academia (como hoje).

### US-P6-07 — PWA

> Como membro, quero instalar o app e usá-lo sem sinal.

**Critérios de aceite**
- Manifest: nome "Pure Water Wave" (ou o nome que o grupo escolher), `start_url: /painel`, ícone próprio; a biblioteca continua acessível dentro.
- Convite para instalar no primeiro acesso ao `/painel` em celular (Android: prompt nativo; iPhone: instrução "Compartilhar → Adicionar à Tela de Início").
- Offline: `/painel`, `/painel/relatorio`, `/painel/convidados` e a ficha dos convidados abertos recentemente funcionam sem rede com os últimos dados; escritas (relatório, convidado, acontecimento) entram numa fila local (IndexedDB) e são enviadas em ordem ao reconectar, com resolução simples: o servidor recusa se já existe relatório daquele dia e o app mostra os dois para o membro escolher.
- Notificações push (Web Push; iPhone exige iOS 16.4+ e app instalado) para lembretes de P3 US-P3-06; e-mail como alternativa.
- Atualização: ao publicar uma versão nova, o app avisa "Nova versão, toque para atualizar".

### US-P6-08 — Desempenho no campo

> Como membro, quero que o app abra rápido em celular simples.

**Critérios de aceite**
- Primeira abertura do `/painel` em 4G: conteúdo útil em menos de 3 s; abertura instalada e com cache: menos de 1 s.
- Listas de convidados paginadas; fotos em miniatura; nada de bibliotecas de gráfico na área do membro além do mínimo (os gráficos ricos ficam no `/admin`).

## Fora de escopo

- App nativo e lojas.
- Chat entre membros.
