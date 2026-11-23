"use client";

import { Download, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Card, Stat } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { fmtMes, fmtMoeda, MOEDAS, mesDe, resumo, saldoDe, saldoNoDia, saldoPorDia, semAcento, valorSimples, type Moeda, type Origem } from "@/lib/hj/contabilidade";
import { INICIO_DEMO } from "@/lib/hj/contabilidade-mock";
import { fmtDia } from "@/lib/hj/dates";

import { LinhaMovimento, slug, useExportar } from "./linha";
import { campo, corEntrada, MesStepper, MoedaPills, Segmentado, Vazio } from "./pieces";
import { useContabilidade } from "./store";

type Tipo = "todos" | "saida" | "entrada" | "transferencia";
type Filtros = { categoria: string; responsavel: string; origem: "" | Origem; pendentes: boolean };

const SEM_FILTRO: Filtros = { categoria: "", responsavel: "", origem: "", pendentes: false };
const PASSO = 60;

export function MovimentosScreen() {
  const { movimentos, moedas, hoje, categorias, categoria, projeto, combinado, escopoNome } = useContabilidade();
  const exportar = useExportar();
  const [mes, setMes] = useState(mesDe(hoje));
  const [moedaEscolhida, setMoeda] = useState<Moeda>("BRL");
  const [tipo, setTipo] = useState<Tipo>("todos");
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTRO);
  const [mais, setMais] = useState({ chave: "", extra: 0 });
  const moeda = moedas.includes(moedaEscolhida) ? moedaEscolhida : "BRL";

  const doMes = useMemo(() => movimentos.filter((mov) => mesDe(mov.data) === mes), [movimentos, mes]);
  const totais = useMemo(() => resumo(movimentos, moeda, (dia) => mesDe(dia) === mes), [movimentos, moeda, mes]);
  const saldoFinal = useMemo(() => saldoDe(movimentos, moeda, `${mes}-31`).total, [movimentos, moeda, mes]);
  const corrente = useMemo(() => saldoPorDia(movimentos, moeda), [movimentos, moeda]);
  // de todos os meses: o filtro continua a valer quando o mês muda
  const responsaveis = useMemo(() => [...new Set(movimentos.map((mov) => mov.responsavel))].sort((a, b) => a.localeCompare(b, "pt-BR")), [movimentos]);
  // quem saiu da lista (outra contabilidade no seletor) deixa de filtrar
  const responsavel = responsaveis.includes(filtros.responsavel) ? filtros.responsavel : "";

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim()).replace(/\s+/g, " ");
    return doMes.filter((mov) => {
      if (tipo !== "todos" && mov.tipo !== tipo) {
        return false;
      }
      if (filtros.categoria && mov.categoriaId !== filtros.categoria) {
        return false;
      }
      if (responsavel && mov.responsavel !== responsavel) {
        return false;
      }
      if (filtros.origem && mov.origem !== filtros.origem) {
        return false;
      }
      if (filtros.pendentes && !mov.pendente) {
        return false;
      }
      if (!termo) {
        return true;
      }
      // o valor como aparece na tela ("R$ 1.234,56") e como se digita ("1234,56", "R$18")
      const numero = valorSimples(mov.valorMinor, mov.moeda);
      const valor = [fmtMoeda(mov.valorMinor, mov.moeda), numero, `${MOEDAS[mov.moeda].simbolo}${numero}`];
      const alvo = [mov.descricao, categoria(mov.categoriaId)?.nome, mov.responsavel, projeto(mov.projetoId)?.nome, ...valor].filter(Boolean).join(" ");
      // o espaço entre o símbolo e o valor não é o da barra de espaço
      return semAcento(alvo).replace(/\s+/g, " ").includes(termo);
    });
  }, [doMes, tipo, filtros, responsavel, busca, categoria, projeto]);

  const chave = [mes, tipo, busca, JSON.stringify(filtros)].join("|");
  const limite = PASSO + (mais.chave === chave ? mais.extra : 0);
  const dias = useMemo(() => {
    const grupos: { dia: string; itens: typeof visiveis }[] = [];
    for (const mov of visiveis.slice(0, limite)) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo?.dia === mov.data) {
        ultimo.itens.push(mov);
      } else {
        grupos.push({ dia: mov.data, itens: [mov] });
      }
    }
    return grupos;
  }, [visiveis, limite]);

  const ativos = Number(Boolean(filtros.categoria)) + Number(Boolean(responsavel)) + Number(Boolean(filtros.origem)) + Number(filtros.pendentes);
  const filtrando = ativos > 0 || tipo !== "todos" || busca.trim() !== "";

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow="Contabilidade"
        title="Movimentos"
        description={combinado ? `${escopoNome}: os lançamentos de todas as equipes, um embaixo do outro.` : "Tudo o que entrou e saiu, do mais novo para o mais antigo."}
        actions={
          <Button type="button" variant="outline" className="rounded-full" onClick={() => exportar(visiveis, `movimentos-${slug(escopoNome)}-${mes}`)}>
            <Download className="h-4 w-4" aria-hidden />
            Exportar CSV
          </Button>
        }
      />

      <div className="!mt-0 flex flex-wrap items-center gap-3">
        <MesStepper mes={mes} onChange={setMes} min={mesDe(INICIO_DEMO)} max={mesDe(hoje)} />
        <MoedaPills moedas={moedas} value={moeda} onChange={setMoeda} />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Entradas" value={<span className={corEntrada}>{fmtMoeda(totais.entradas, moeda)}</span>} />
        <Stat label="Saídas" value={fmtMoeda(totais.saidas, moeda)} />
        <Stat label="Balanço do mês" value={fmtMoeda(totais.balanco, moeda, { sinal: true })} />
        <Stat label="Saldo no fim do mês" value={fmtMoeda(saldoFinal, moeda)} hint={mes === mesDe(hoje) ? "Até hoje" : fmtMes(mes)} />
      </div>

      <Card className="!p-4 sm:!p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Segmentado
            label="Tipo de movimento"
            value={tipo}
            onChange={setTipo}
            options={[
              { value: "todos", label: "Todos" },
              { value: "saida", label: "Gastos" },
              { value: "entrada", label: "Entradas" },
              { value: "transferencia", label: "Transferências" },
            ]}
          />
          <div className="relative min-w-[11rem] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por descrição, pessoa ou valor"
              aria-label="Buscar movimentos"
              className="h-10 rounded-full pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="rounded-full">
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filtros
                {ativos ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{ativos}</span> : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 space-y-3 rounded-2xl">
              <div className="space-y-1.5">
                <Label htmlFor="filtro-categoria">Categoria</Label>
                <select id="filtro-categoria" className={campo} value={filtros.categoria} onChange={(event) => setFiltros({ ...filtros, categoria: event.target.value })}>
                  <option value="">Todas</option>
                  <optgroup label="Gastos">
                    {categorias.filter((item) => item.tipo === "saida").map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Entradas">
                    {categorias.filter((item) => item.tipo === "entrada").map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filtro-responsavel">Responsável</Label>
                <select id="filtro-responsavel" className={campo} value={responsavel} onChange={(event) => setFiltros({ ...filtros, responsavel: event.target.value })}>
                  <option value="">Todos</option>
                  {responsaveis.map((nome) => (
                    <option key={nome} value={nome}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filtro-origem">De onde veio</Label>
                <select id="filtro-origem" className={campo} value={filtros.origem} onChange={(event) => setFiltros({ ...filtros, origem: event.target.value as Filtros["origem"] })}>
                  <option value="">Qualquer origem</option>
                  <option value="manual">Lançado à mão</option>
                  <option value="relatorio">Relatório de RM</option>
                  <option value="assistente">Assistente</option>
                  <option value="mcp">Agente (MCP)</option>
                </select>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm font-medium">
                Só os que faltam conferir
                <Switch checked={filtros.pendentes} onCheckedChange={(pendentes) => setFiltros({ ...filtros, pendentes })} />
              </label>
              {ativos ? (
                <Button type="button" variant="ghost" size="sm" className="w-full rounded-full" onClick={() => setFiltros(SEM_FILTRO)}>
                  <X className="h-4 w-4" aria-hidden />
                  Limpar filtros
                </Button>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>

        {visiveis.length ? (
          <>
            <p className="mt-4 text-xs text-muted-foreground">
              {visiveis.length} {visiveis.length === 1 ? "movimento" : "movimentos"} em {fmtMes(mes).toLowerCase()}
              {filtrando ? " com esse filtro" : ""}
            </p>
            {dias.map((grupo) => (
              <section key={grupo.dia} className="mt-4 first:mt-2">
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
                  <h2 className="text-sm font-semibold capitalize text-primary-deep">{grupo.dia === hoje ? "Hoje" : fmtDia(grupo.dia, "longo")}</h2>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground" title={`Saldo em ${MOEDAS[moeda].nome.toLowerCase()} ao final do dia`}>
                    Saldo {fmtMoeda(saldoNoDia(corrente, grupo.dia), moeda)}
                  </span>
                </div>
                <ul className="divide-y divide-border/60">
                  {grupo.itens.map((mov) => (
                    <LinhaMovimento key={mov.id} mov={mov} />
                  ))}
                </ul>
              </section>
            ))}
            {visiveis.length > limite ? (
              <div className="mt-4 text-center">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setMais({ chave, extra: (mais.chave === chave ? mais.extra : 0) + PASSO })}>
                  Mostrar mais {Math.min(PASSO, visiveis.length - limite)}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-4">
            <Vazio titulo={filtrando ? "Nada com esse filtro" : "Nenhum movimento neste mês"}>
              {filtrando ? "Tente outra busca ou limpe os filtros." : "Use “Novo” ou o assistente para lançar o primeiro."}
            </Vazio>
          </div>
        )}
      </Card>
    </div>
  );
}
