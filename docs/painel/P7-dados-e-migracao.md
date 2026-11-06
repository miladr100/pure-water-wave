# P7 — Modelo de dados (MongoDB) e migração

| | |
|---|---|
| **Estágio** | Requisitos (rascunho) |
| **Depende de** | P1–P4 |
| **Convenções** | Como a academia: mongoose, coleções com prefixo, ids `ObjectId`, datas em UTC, `createdAt/updatedAt` automáticos, `delete models.X` antes de `model()` |

## Coleções

Prefixo `hj_` para o que é do painel (a academia mantém `academy_`).

| Coleção | Modelo | Campos principais | Índices |
|---|---|---|---|
| `academy_users` (existente) | `AcademyUser` → conta do painel | + `papeis: ("membro"\|"educador"\|"administrador")[]`, `programaId`, `turmaId`, `educadorId` (= `assignedTutorId` de hoje), `situacao: ativo\|inativo`, `entrouEm`, `notificacoes{relatorio, equipe, convidados, academia}`, `pushSubscriptions[]` | `email` único, `papeis`, `programaId` |
| `hj_programas` | `Programa` | `nome`, `sigla`, `logo`, `ativo`, `turmas[{_id, nome, ativa}]` | `sigla` único |
| `hj_projetos` | `Projeto` | `nome`, `tipo: arrecadacao\|testemunho`, `inicio`, `fim`, `periodos[{_id,nome,inicio,fim}]`, `situacao`, `fuso`, `rm{moeda, diasDescanso[], metaDiariaInicial, metasPrograma[{programaId, valor}], produtos[{_id,nome,ordem,ativo}], regraNovaMeta{fator, arredondamento, minimo, aCadaDias}, formulaLiquido: "A"\|"B", lembreteHora}` | `tipo+situacao` |
| `hj_equipes` | `Equipe` | `projetoId`, `nome`, `programaId?`, `educadorId`, `capitaoId?`, `membros[ObjectId]`, `pais?`, `cidade?`, `ativa` | `projetoId+membros` (um membro por projeto, validado na API), `projetoId+nome` único |
| `hj_relatorios` | `RelatorioDiario` | `projetoId`, `equipeId`, `membroId`, `data` (YYYY-MM-DD), `metaInterna`, `metaExterna`, `dinheiro`, `pix`, `alimentacao`, `transporte`, `outros`, `outrosDescricao`, `liquido`, `material[{produtoId, levou, voltou, restaurou}]`, `moedaEstrangeira?`, `observacoes`, `situacao`, `enviadoEm`, `validadoPor`, `validadoEm`, `devolucaoComentario`, `registradoPor?`, `versoes[{em, por, motivo, antes}]`, `deletedAt?` | `projetoId+membroId+data` único; `projetoId+equipeId+data`; `projetoId+data+situacao` |
| `hj_metas` | `MetaDiaria` | `projetoId`, `membroId`, `valor`, `desde`, `origem`, `definidaPor` | `projetoId+membroId+desde` |
| `hj_contabilidade` | `ContabilidadeDia` (campo manual do educador) | `projetoId`, `programaId`, `data`, `aReceber`, `observacao` | `projetoId+programaId+data` único |
| `hj_convidados` | `Convidado` | dados pessoais (P4), `responsavelId`, `equipeId?`, `etapa`, marcos (datas), `conferencias[{n, em}]`, `ficha{assinadaEm, pdf?{data,contentType,size}}` ou `pdfRef` (ver anexos), `jardimConfirmadoEm?`, `passagemCompradaEm?`, `foto?`, `interesses[]`, `disponibilidade`, `observacoes`, `deletedAt?`, `deletedBy?` | `responsavelId`, `equipeId`, `etapa`, `createdAt`, texto em `nome` |
| `hj_acontecimentos` | `Acontecimento` | `convidadoId`, `data`, `tipo`, `conferencia?`, `descricao`, `autorId`, `automatico`, `antes?`, `depois?` | `convidadoId+data` |
| `hj_historico` | `Historico` (auditoria) | `entidade`, `entidadeId`, `acao`, `campos[]`, `autorId`, `em`, `projetoId?` | `entidade+entidadeId`, `em` |
| `hj_preferencias` | `Preferencia` | `userId`, `projetoId?`, `periodoId?` | `userId` único |

Valores monetários em **centavos inteiros**. Datas de dia (relatório, marcos)
como string `YYYY-MM-DD` no fuso do projeto, para não escorregar um dia; carimbos
de evento como `Date`.

**Anexos.** A academia guarda a foto do aluno dentro do documento (JPEG até 4
MB). Para a ficha em PDF (até 20 MB) isso não serve: usar GridFS no mesmo Mongo
(sem conta nova) ou um bucket (Bunny Storage, que o site já usa para vídeo).
Premissa: **GridFS** no começo; trocar por bucket se o volume crescer. Fotos de
convidado seguem o padrão da academia (miniatura no documento).

## Escopo de acesso (regra única na API)

Toda rota do painel resolve o **escopo** da sessão e filtra por ele; nunca
confia em ids vindos do cliente:

```
membro          → relatórios e convidados onde membroId/responsavelId = eu
capitão         → + relatórios e convidados onde equipeId ∈ minhas equipes (projeto ativo, capitaoId = eu)
educador/admin  → tudo
```

Resposta fora do escopo: **404**. Testes obrigatórios: membro A não lê/edita
relatório ou convidado de B; capitão não lê outra equipe; ex-capitão perde
acesso na hora; conta inativa não entra.

## Migração

### Contas (automática, idempotente, `scripts/migrate-painel.ts`)
1. `AcademyUser.role` → `papeis` (student → [membro]; tutor → [membro, educador]).
2. `SystemUser.role = hjteam` sem `AcademyUser` com o mesmo e-mail → cria conta do painel com o mesmo hash de senha (o login já faz isso na primeira entrada; o script antecipa) e marca o `SystemUser` como migrado.
3. Primeiro administrador: por variável `SEED_ADMIN_EMAIL` ou promoção manual.

### Dados do sistema de Wang Song (uma vez, opcional)
- Exportar pela API dele: `/exports/members.csv`, `/exports/children.csv`, `/exports/signed-forms.zip`, `/programs`, `/teams`, `/report-projects`.
- Mapear: programas (por nome; HJ Academy 1/2/3 → HJA + turma), membros → contas (por e-mail; sem e-mail → criar login com senha temporária), equipes → equipes do projeto "120 dias de Testemunho 2026", convidados com etapa/datas/ficha/Jardim/passagem, PDFs para GridFS.
- Pré-Gateway: `primeiroContatoEm` recebe `gatewayEm` quando existir, senão fica vazio e a ficha pede ao editar.
- Como os dados são de exemplo (não é uso real), a importação pode ser para um ambiente de testes, para validar as telas com volume (908 convidados, 39 equipes).

### Planilha de RM (uma vez, opcional)
- Importar "RM 30 dias 2026" como projeto encerrado: equipes "01 – HJA"…, membros por nome (criar contas inativas quando não existirem), um relatório validado por célula com `liquido` = valor (dinheiro/pix/despesas vazios, marcado `importado`). Serve para testar a grade e as metas com dados reais.

## Ambientes

- `dev` → preview na Vercel com um Mongo próprio (Atlas free, como o `pww-academy-demo`); `qa` → outro; `main` → produção de Milad.
- Variáveis novas: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (push), `PAINEL_FUSO` padrão `America/Sao_Paulo`.
- Cron da Vercel (já existe a cada 15 min): dispara lembretes de relatório e resumo do capitão na hora configurada; recalcula "nova meta" quando chega o dia.
