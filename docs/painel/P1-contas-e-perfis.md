# P1 — Contas, papéis e perfil

| | |
|---|---|
| **Estágio** | Requisitos (rascunho) |
| **Depende de** | Login único e criação de contas já feitos na `dev` (`docs/academia/HANDOFF.md` §1 e §5) |
| **Muda** | `AcademyUser` (vira a conta do painel), `redirectFor`, `AppHeader`, middleware |

## Visão geral

Hoje o site tem duas coleções de pessoas: `SystemUser` (pastor, hjteam) para
a biblioteca e `AcademyUser` (student, tutor) para a academia. Um HJ Team pode
existir nas duas. O painel exige **uma conta por pessoa**, com um conjunto de
papéis, porque a mesma pessoa é aluna da academia, faz RM, acompanha convidados
e, às vezes, é capitã.

Decisão: a **conta do painel é o `AcademyUser`** de hoje, estendido. Os
pastores continuam em `SystemUser` e só na biblioteca. Os `SystemUser` com papel
hjteam são convertidos em contas do painel (o login já faz isso na primeira
entrada; a migração faz o resto, ver P7).

**Atores:** Membro · Capitão (membro com equipe) · Educador(a) · Administrador(a)
· Pastor(a) (fora do painel)

## Papéis

| Papel | Quem | Pode |
|---|---|---|
| **Membro** | Jovem do HJ Team | Usar a academia, enviar o próprio relatório diário, cadastrar e acompanhar os próprios convidados, ver os resultados da própria equipe (sem dados pessoais dos colegas), editar o próprio perfil. |
| **Capitão** | Membro designado como capitão de uma equipe em um projeto | Tudo do membro, mais: ver os relatórios dos membros da equipe, validar ou devolver, lembrar quem não enviou, ver os convidados da equipe, registrar relatório por um membro sem celular. É uma **condição derivada** da equipe, nunca um papel gravado na conta. |
| **Educador(a)** | Responsável por equipes e membros | Tudo do painel de administração exceto configuração da organização: contas, equipes, resultados, convidados de todas as equipes, academia (cursos, correções, perguntas). |
| **Administrador(a)** | Yeseong, Sr. Sérgio, continental | Administra o site inteiro: tudo do educador, mais projetos e períodos, programas e turmas, metas por programa, produtos, exportações completas, histórico de alterações, e **dar ou tirar o papel de educador e de administrador** (Pessoas → Educadores / Administradores). |

Decidido em 06/11/2026 (Victor): são **dois painéis ligeiramente diferentes**. O
educador vê o dia a dia (resultados, validação, convidados, pessoas, equipes,
academia); o administrador vê o mesmo mais Organização e Configurações, e é o
único que adiciona ou remove educadores.

Um educador pode ao mesmo tempo ser membro (sair à linha de frente e ter
convidados). Por isso `papéis` é uma lista, não um valor único.

## Histórias de usuário

### US-P1-01 — Uma conta, vários papéis

> Como educador, quero que cada pessoa tenha uma única conta com os papéis que precisa, para não cadastrar a mesma pessoa duas vezes.

**Critérios de aceite**
- **Dado** uma conta **quando** ela é gravada **então** tem `papéis` ⊆ {membro, educador, administrador}, com pelo menos um.
- **Dado** uma conta só com `educador` **quando** ela abre o painel **então** não vê relatório diário nem "meus convidados" próprios; **dado** que ganha também `membro` **então** passa a ver.
- A condição de capitão vem de `Equipe.capitãoId` da equipe ativa, nunca de `papéis`.
- O valor `role: "student" | "tutor"` de hoje é migrado para `papéis`: student → [membro]; tutor → [membro, educador]. Nada no código novo lê `role`.

### US-P1-02 — Dados da pessoa

> Como educador, quero que a conta carregue os dados que a planilha e o testemunho precisam, para não manter cadastros paralelos.

**Critérios de aceite**
- Campos: nome completo, e-mail (login), telefone (com código do país), país, cidade, data de nascimento, idioma (pt/en/es), foto, **programa** (HJA, HJR, PW, STG, UPA), **turma** (opcional, da lista do programa), **educador responsável**, **situação** (ativo/inativo), anotações do educador (privadas), data de entrada no HJ Team.
- Programa e turma vêm do cadastro P2; não são texto livre.
- Uma conta inativa não entra em equipes novas, não aparece em listas por padrão e não consegue entrar; o histórico dela (relatórios, convidados) permanece.
- O formulário de nova conta e o CSV de importação (já existentes) ganham as colunas `programa` e `turma`; `tipo` aceita `membro`, `educador`, `administrador`, `pastor`.

### US-P1-03 — Entrar e ser levado ao lugar certo

> Como membro, quero entrar pelo Login do site e cair no meu início, para não precisar saber que existem várias áreas.

**Critérios de aceite**
- **Dado** uma conta com papel membro **quando** entra **então** vai para `/painel`.
- **Dado** uma conta só educador/administrador **quando** entra **então** vai para `/admin`.
- **Dado** um pastor **quando** entra **então** vai para `/biblioteca`, como hoje.
- **Dado** que a pessoa foi para `/login?next=…` **quando** entra **então** volta para `next`, se tiver permissão.
- Sem cadastro público. Recuperação de senha por código, como hoje.
- A sessão continua sendo o JWT em cookie httpOnly de 7 dias; a cookie da biblioteca é emitida junto, como hoje.

### US-P1-04 — Navegação por papel

> Como usuário, quero ver só as áreas que posso usar, para não encontrar portas fechadas.

**Critérios de aceite**
- O cabeçalho e o menu do celular mostram, por papel: **Membro:** Início · Relatório · Convidados · Academia · Biblioteca. **Capitão:** + Equipe. **Educador/Administrador:** + Administração (ou, dentro de `/admin`, o menu do painel de administração com um atalho de volta ao Início).
- Rotas sem permissão respondem 404, como o `/admin` faz hoje (nunca 403 nem redirect que revele a existência da área).
- Os itens do menu deixam de ser uma lista fixa por área no código e passam a ser calculados a partir dos papéis e da condição de capitão.

### US-P1-05 — Perfil

> Como membro, quero ver e editar meus dados no mesmo diálogo de perfil que a academia já tem.

**Critérios de aceite**
- O diálogo de perfil (`?perfil=1`) ganha a seção **HJ Team**: programa e turma (somente leitura), educador responsável, equipe atual e capitão (somente leitura), e as preferências de notificação (lembrete do relatório diário, avisos de convidados).
- Foto, dados, e-mail, senha, idioma e tema continuam como hoje.

### US-P1-06 — Promover e rebaixar

> Como administrador, quero dar ou tirar o papel de educador ou administrador, para acompanhar mudanças de função.

**Critérios de aceite**
- Só o administrador marca ou desmarca `educador` e `administrador`, em Pessoas → Educadores / Administradores ou na ficha da pessoa. O botão "Converter em educador(a)" que hoje existe no painel da academia passa a aparecer só para administradores.
- Tirar o papel de educador pede para onde vão as equipes e os membros que a pessoa acompanha (outro educador, ou "sem educador por enquanto"); a pessoa perde o acesso a `/admin` na hora e mantém a conta e o papel de membro, se o tiver.
- Não é possível remover o próprio papel de administrador nem o do último administrador.
- Toda mudança de papel, situação ou dados de outra pessoa gera um registro de histórico (quem, quando, o quê).

### US-P1-07 — Desativar em vez de apagar

> Como educador, quero desativar uma pessoa que saiu, mantendo o que ela fez.

**Critérios de aceite**
- Desativar remove a pessoa das equipes ativas (o capitão passa a "pendente" se era ela) e impede o login; relatórios e convidados ficam, e os convidados dela aparecem como "sem responsável ativo" para o educador reatribuir.
- Reativar devolve o acesso; não devolve equipes.
- Apagar de verdade só por administrador, só se a pessoa nunca enviou relatório nem cadastrou convidado.

## Fora de escopo

- Login com Google (o site usa e-mail e senha; pode vir depois).
- Pastores no painel.
