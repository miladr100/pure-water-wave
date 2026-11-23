"use client";

import { Bot, Check, Copy, Download, Plug, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { useApi } from "@/components/academy/use-api";
import { Card, Eyebrow } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { mesDe, MOEDA_ORDEM, MOEDAS, type Categoria, type Moeda } from "@/lib/hj/contabilidade";
import { fmtDia } from "@/lib/hj/dates";
import type { EquipeAdmin } from "@/lib/hj/types";

import { slug, useExportar } from "./linha";
import { CatIcone, Etiqueta, Segmentado } from "./pieces";
import { atualizarEstado, useContabilidade } from "./store";

const MCP_URL = "https://purewaterwave.org/api/mcp/contabilidade";

const PODE = [
  "Lançar gastos e entradas, um ou vários de uma vez",
  "Consultar os saldos de cada moeda",
  "Listar e procurar movimentos",
  "Resumir os gastos por categoria e por mês",
  "Anexar a foto de um comprovante",
];

export function AjustesScreen() {
  const { administrador, lado } = useContabilidade();
  return (
    <div className="space-y-6">
      <PainelHeading eyebrow="Contabilidade" title="Ajustes" description="Moedas, categorias, exportação e a ligação com um agente." />
      <div className="!mt-0 grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Moedas />
        <Exportar />
        <Categorias />
        <div className="space-y-6">
          <Agente />
          {administrador && lado === "admin" ? <Acesso /> : null}
        </div>
      </div>
    </div>
  );
}

function Bloco({ titulo, descricao, children }: { titulo: string; descricao: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold text-primary-deep">{titulo}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function Moedas() {
  const { doEscopo, combinado, movimentos, moedas } = useContabilidade();
  const unico = combinado ? null : doEscopo[0];
  const emUso = new Set<Moeda>(["BRL"]);
  for (const mov of movimentos) {
    emUso.add(mov.moeda);
    if (mov.para) {
      emUso.add(mov.para.moeda);
    }
  }

  function alternar(moeda: Moeda, ligada: boolean) {
    if (!unico) {
      return;
    }
    atualizarEstado((atual) => {
      const antes = atual.moedas[unico.id] ?? [];
      return { ...atual, moedas: { ...atual.moedas, [unico.id]: ligada ? [...new Set([...antes, moeda])] : antes.filter((item) => item !== moeda) } };
    });
  }

  return (
    <Bloco
      titulo="Moedas"
      descricao={
        unico
          ? `As moedas com que ${unico.nome} trabalha. Cada uma tem o seu saldo; nada é convertido.`
          : "Cada contabilidade liga as suas moedas. Escolha uma só, no alto da página, para mudar as dela."
      }
    >
      <ul className="divide-y divide-border/60">
        {MOEDA_ORDEM.map((moeda) => {
          const ligada = moedas.includes(moeda);
          const presa = emUso.has(moeda);
          return (
            <li key={moeda} className="flex items-center gap-3 py-3">
              <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-bold text-primary-deep">{MOEDAS[moeda].simbolo}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{MOEDAS[moeda].nome}</span>
                <span className="block text-xs text-muted-foreground">
                  {moeda === "BRL" ? "Sempre ligada" : presa ? "Em uso: já tem movimentos" : ligada ? "Ligada, ainda sem movimentos" : "Desligada"}
                </span>
              </span>
              <Switch aria-label={MOEDAS[moeda].nome} checked={ligada} disabled={!unico || presa} onCheckedChange={(value) => alternar(moeda, value)} />
            </li>
          );
        })}
      </ul>
      {unico ? (
        <p className="mt-3 text-xs text-muted-foreground">Uma moeda também aparece sozinha quando alguém lança o primeiro movimento nela.</p>
      ) : null}
    </Bloco>
  );
}

function Exportar() {
  const { movimentos, hoje, escopoNome } = useContabilidade();
  const exportar = useExportar();
  const mes = mesDe(hoje);
  const ano = hoje.slice(0, 4);
  const opcoes = [
    { nome: "Este mês", arquivo: mes, lista: movimentos.filter((mov) => mesDe(mov.data) === mes) },
    { nome: `Ano de ${ano}`, arquivo: ano, lista: movimentos.filter((mov) => mov.data.startsWith(ano)) },
    { nome: "Tudo", arquivo: "tudo", lista: movimentos },
  ];
  return (
    <Bloco
      titulo="Exportar"
      descricao="Um arquivo que abre no Excel e no Google Planilhas, com as mesmas colunas da planilha de contabilidade: Data, Categoria, Responsável, Dinheiro, Pix, Valor, Dólar, Observação."
    >
      <ul className="divide-y divide-border/60">
        {opcoes.map((opcao) => (
          <li key={opcao.nome} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{opcao.nome}</span>
              <span className="block text-xs text-muted-foreground">
                {opcao.lista.length} {opcao.lista.length === 1 ? "movimento" : "movimentos"} · {escopoNome}
              </span>
            </span>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => exportar(opcao.lista, `contabilidade-${slug(escopoNome)}-${opcao.arquivo}`)}>
              <Download className="h-4 w-4" aria-hidden />
              CSV
            </Button>
          </li>
        ))}
      </ul>
    </Bloco>
  );
}

function Categorias() {
  const { categorias, estado } = useContabilidade();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  // só o que foi lançado ou editado aqui pode usar uma categoria criada aqui;
  // vale para todas as contabilidades, não só a do seletor
  const usadas = new Set([...estado.adicionados, ...Object.values(estado.editados)].map((mov) => mov.categoriaId));

  function criar(event: FormEvent) {
    event.preventDefault();
    const limpo = nome.trim();
    if (!limpo) {
      return;
    }
    if (categorias.some((item) => item.tipo === tipo && item.nome.toLowerCase() === limpo.toLowerCase())) {
      toast.error("Já existe uma categoria com esse nome.");
      return;
    }
    const nova: Categoria = { id: `c:${slug(limpo)}-${Date.now().toString(36)}`, nome: limpo, tipo, icone: "etiqueta", cor: 0 };
    atualizarEstado((atual) => ({ ...atual, categorias: [...atual.categorias, nova] }));
    setNome("");
    toast.success("Categoria criada");
  }

  function apagar(categoria: Categoria) {
    atualizarEstado((atual) => ({ ...atual, categorias: atual.categorias.filter((item) => item.id !== categoria.id) }));
    toast("Categoria apagada", {
      action: { label: "Desfazer", onClick: () => atualizarEstado((atual) => ({ ...atual, categorias: [...atual.categorias, categoria] })) },
    });
  }

  const grupo = (titulo: string, qual: "saida" | "entrada") => (
    <div>
      <Eyebrow>{titulo}</Eyebrow>
      <ul className="mt-2 divide-y divide-border/60">
        {categorias
          .filter((item) => item.tipo === qual)
          .map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <CatIcone tipo={qual} categoria={item} className="h-9 w-9 rounded-xl" />
              <span className="min-w-0 flex-1 text-sm leading-snug font-medium text-foreground">{item.nome}</span>
              {item.fixa ? (
                <Etiqueta>Padrão</Etiqueta>
              ) : usadas.has(item.id) ? (
                <Etiqueta>Em uso</Etiqueta>
              ) : (
                <button
                  type="button"
                  onClick={() => apagar(item)}
                  aria-label={`Apagar ${item.nome}`}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
      </ul>
    </div>
  );

  return (
    <Bloco
      titulo="Categorias"
      descricao="As categorias padrão são as da planilha de contabilidade e valem para todas as equipes, também no relatório de RM. Dá para somar outras."
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {grupo("Gastos", "saida")}
        {grupo("Entradas", "entrada")}
      </div>
      <form onSubmit={criar} className="mt-5 space-y-3 border-t border-border/60 pt-4">
        <Label htmlFor="categoria-nova">Nova categoria</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input id="categoria-nova" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Combustível" maxLength={40} className="h-10 min-w-0 flex-1 basis-40 rounded-xl" />
          <Segmentado
            label="Tipo da categoria"
            value={tipo}
            onChange={setTipo}
            options={[
              { value: "saida", label: "Gasto" },
              { value: "entrada", label: "Entrada" },
            ]}
          />
          <Button type="submit" className="rounded-full" disabled={!nome.trim()}>
            <Plus className="h-4 w-4" aria-hidden />
            Criar
          </Button>
        </div>
      </form>
    </Bloco>
  );
}

function Agente() {
  const { estado, escopoNome } = useContabilidade();
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o endereço e copie à mão.");
    }
  }

  function desconectar(id: string, nome: string) {
    const antes = estado.agentes;
    atualizarEstado((atual) => ({ ...atual, agentes: atual.agentes.filter((agente) => agente.id !== id) }));
    toast(`${nome} desconectado`, { action: { label: "Desfazer", onClick: () => atualizarEstado((atual) => ({ ...atual, agentes: antes })) } });
  }

  return (
    <Bloco
      titulo="Conectar a um agente"
      descricao="Ligue o Claude, o ChatGPT ou outro agente que fale MCP à contabilidade, e lance gastos conversando com ele, de onde estiver."
    >
      {estado.agentes.length ? (
        <ul className="mb-4 divide-y divide-border/60">
          {estado.agentes.map((agente) => (
            <li key={agente.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary-deep">
                <Bot className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{agente.nome}</span>
                <span className="block text-xs text-muted-foreground">Conectado desde {fmtDia(agente.desde, "longo")}</span>
              </span>
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={() => desconectar(agente.id, agente.nome)}>
                Desconectar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">Nenhum agente conectado.</p>
      )}
      <Button type="button" variant="outline" className="rounded-full" onClick={() => setAberto(true)}>
        <Plug className="h-4 w-4" aria-hidden />
        Conectar um agente
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar um agente</DialogTitle>
            <DialogDescription>
              No seu agente, adicione um conector (servidor MCP) com este endereço e entre com a sua conta da Pure Water Wave. Ele vê as mesmas
              contabilidades que você: agora, {escopoNome}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mcp-url">Endereço do conector</Label>
              <div className="mt-1.5 flex gap-2">
                <Input id="mcp-url" readOnly value={MCP_URL} onFocus={(event) => event.target.select()} className="h-10 min-w-0 flex-1 rounded-xl font-mono text-xs" />
                <Button type="button" variant="outline" className="shrink-0 rounded-full" onClick={copiar}>
                  {copiado ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                  {copiado ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
            <div>
              <Eyebrow>O que o agente pode fazer</Eyebrow>
              <ul className="mt-2 space-y-1.5 text-sm text-foreground">
                {PODE.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                O agente não apaga movimentos nem muda o que veio de um relatório de RM. O que ele lança fica marcado como “Agente”.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" className="rounded-full" onClick={() => setAberto(false)}>
              Pronto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Bloco>
  );
}

type EquipesReply = { equipes: EquipeAdmin[] };

// Só o administrador: quais educadores veem todas as contabilidades, e não só
// as das equipes de que cuidam.
function Acesso() {
  const { eu, estado } = useContabilidade();
  const { data } = useApi<EquipesReply>("/api/admin/hj/equipes");
  const educadores = new Map<string, { nome: string; equipes: string[] }>();
  for (const equipe of data?.equipes ?? []) {
    if (!equipe.educador || equipe.educador.id === eu.id) {
      continue;
    }
    const item = educadores.get(equipe.educador.id) ?? { nome: equipe.educador.nome, equipes: [] };
    item.equipes.push(equipe.nome);
    educadores.set(equipe.educador.id, item);
  }

  function alternar(id: string, liga: boolean) {
    atualizarEstado((atual) => ({ ...atual, veTodas: liga ? [...new Set([...atual.veTodas, id])] : atual.veTodas.filter((item) => item !== id) }));
  }

  return (
    <Bloco
      titulo="Quem vê todas as contabilidades"
      descricao="Cada educador vê as contabilidades das equipes de que cuida. Ligue aqui os que também precisam ver todas, como quem responde pela contabilidade do projeto."
    >
      <ul className="divide-y divide-border/60">
        <li className="flex items-center gap-3 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary-deep">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">Administradores</span>
            <span className="block text-xs text-muted-foreground">Veem sempre todas, e a contabilidade geral</span>
          </span>
          <Switch aria-label="Administradores" checked disabled />
        </li>
        {[...educadores.entries()].map(([id, educador]) => (
          <li key={id} className="flex items-center gap-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-muted-foreground" aria-hidden>
              {educador.nome
                .split(" ")
                .slice(0, 2)
                .map((parte) => parte[0])
                .join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{educador.nome}</span>
              <span className="block text-xs leading-snug text-muted-foreground">
                {estado.veTodas.includes(id) ? "Vê todas as contabilidades" : `Só as suas: ${educador.equipes.join(", ")}`}
              </span>
            </span>
            <Switch aria-label={`${educador.nome} vê todas as contabilidades`} checked={estado.veTodas.includes(id)} onCheckedChange={(value) => alternar(id, value)} />
          </li>
        ))}
      </ul>
    </Bloco>
  );
}
