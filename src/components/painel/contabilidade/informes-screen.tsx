"use client";

import { ChartColumn, ChartPie, Download } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Card } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { Button } from "@/components/ui/button";
import { diasDoMes, fmtMes, fmtMoeda, MOEDAS, mesDe, porCategoria, resumo, saldoDe, somaMes, type Moeda } from "@/lib/hj/contabilidade";
import { INICIO_DEMO } from "@/lib/hj/contabilidade-mock";
import { fmtDiaNumero } from "@/lib/hj/dates";
import { cn } from "@/lib/utils";

import { BarrasCategoria, Colunas, dobrar, Rosca, type Fatia } from "./charts";
import { slug, useExportar } from "./linha";
import { campo, corEntrada, MesStepper, MoedaPills, Segmentado, Vazio } from "./pieces";
import { useContabilidade } from "./store";

type Informe = "gastos-categoria" | "entradas-categoria" | "gastos-dia" | "gastos-mes" | "balanco" | "equipes";
type Periodo = "mes" | "ano" | "tudo";

const INFORMES: { id: Informe; nome: string; resumo: string; combinado?: boolean }[] = [
  { id: "gastos-categoria", nome: "Gastos por categoria", resumo: "Para onde foi o dinheiro." },
  { id: "entradas-categoria", nome: "Entradas por categoria", resumo: "De onde veio o dinheiro." },
  { id: "gastos-dia", nome: "Gastos do mês, dia a dia", resumo: "Em que dias se gastou mais." },
  { id: "gastos-mes", nome: "Gastos por mês", resumo: "Os últimos doze meses lado a lado." },
  { id: "balanco", nome: "Balanço mensal", resumo: "Entradas e saídas de cada mês." },
  { id: "equipes", nome: "Por equipe", resumo: "Cada equipe do conjunto, comparada.", combinado: true },
];

const pct = (parte: number, total: number) => (total > 0 ? `${Math.round((parte / total) * 100)}%` : "–");

export function InformesScreen() {
  const { movimentos, moedas, hoje, categoria, combinado, doEscopo, escopoNome } = useContabilidade();
  const exportar = useExportar();
  const [escolhido, setInforme] = useState<Informe>("gastos-categoria");
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [mes, setMes] = useState(mesDe(hoje));
  const [moedaEscolhida, setMoeda] = useState<Moeda>("BRL");
  const [forma, setForma] = useState<"rosca" | "barras">("rosca");
  const moeda = moedas.includes(moedaEscolhida) ? moedaEscolhida : "BRL";
  const informe = escolhido === "equipes" && !combinado ? "gastos-categoria" : escolhido;
  const dados = INFORMES.find((item) => item.id === informe) ?? INFORMES[0];

  // o período só é uma escolha nos informes de total; os de série têm o seu
  const comPeriodo = informe === "gastos-categoria" || informe === "entradas-categoria" || informe === "equipes";
  const serieAnual = informe === "gastos-mes" || informe === "balanco";
  const ano = mes.slice(0, 4);
  // o período como um intervalo de dias: comparar texto ISO basta
  const [de, ate] =
    informe === "gastos-dia" || (comPeriodo && periodo === "mes")
      ? [`${mes}-01`, `${mes}-31`]
      : comPeriodo && periodo === "ano"
        ? [`${ano}-01-01`, `${ano}-12-31`]
        : serieAnual
          ? [`${somaMes(mes, -11)}-01`, `${mes}-31`]
          : ["0000", "9999"];
  const dentro = useCallback((dia: string) => dia >= de && dia <= ate, [de, ate]);

  const periodoNome =
    informe === "gastos-dia" || (comPeriodo && periodo === "mes")
      ? fmtMes(mes)
      : comPeriodo && periodo === "ano"
        ? ano
        : serieAnual
          ? `${fmtMes(somaMes(mes, -11), "curto")} ${somaMes(mes, -11).slice(0, 4)} – ${fmtMes(mes, "curto")} ${ano}`
          : "Desde o início";

  const tipo = informe === "entradas-categoria" ? "entrada" : "saida";
  const fatias = useMemo(() => dobrar(porCategoria(movimentos, tipo, moeda, dentro, categoria)), [movimentos, tipo, moeda, dentro, categoria]);
  const total = fatias.reduce((sum, fatia) => sum + fatia.valor, 0);

  const dias = useMemo(() => Array.from({ length: diasDoMes(mes) }, (_, index) => `${mes}-${String(index + 1).padStart(2, "0")}`), [mes]);
  const porDia = useMemo(() => dias.map((dia) => resumo(movimentos, moeda, (data) => data === dia)), [dias, movimentos, moeda]);
  const meses = useMemo(() => Array.from({ length: 12 }, (_, index) => somaMes(mes, index - 11)), [mes]);
  const porMes = useMemo(() => meses.map((item) => resumo(movimentos, moeda, (dia) => mesDe(dia) === item)), [meses, movimentos, moeda]);

  const equipes = useMemo(
    () =>
      doEscopo.map((projeto) => {
        const seus = movimentos.filter((mov) => mov.projetoId === projeto.id);
        return { projeto, ...resumo(seus, moeda, dentro), saldo: saldoDe(seus, moeda).total };
      }),
    [doEscopo, movimentos, moeda, dentro],
  );
  const fatiasEquipe: Fatia[] = [...equipes]
    .filter((item) => item.saidas > 0)
    .sort((a, b) => b.saidas - a.saidas)
    .map((item) => ({ id: item.projeto.id, nome: item.projeto.nome, valor: item.saidas, cor: "var(--viz-out)", quantos: 0 }));

  const numero = "px-2 py-2.5 text-right tabular-nums";
  const cabeca = "px-2 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground";

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow="Contabilidade"
        title="Informes"
        description="Um informe de cada vez, numa moeda só: as moedas nunca se somam."
        actions={
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => exportar(movimentos.filter((mov) => dentro(mov.data)), `${slug(dados.nome)}-${slug(escopoNome)}-${slug(periodoNome)}`)}
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar CSV
          </Button>
        }
      />

      <div className="!mt-0 flex flex-wrap items-center gap-3">
        <select aria-label="Informe" className={cn(campo, "h-10 w-auto min-w-[15rem] rounded-full pr-8 font-semibold text-primary-deep")} value={informe} onChange={(event) => setInforme(event.target.value as Informe)}>
          {INFORMES.filter((item) => !item.combinado || combinado).map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
        {comPeriodo ? (
          <Segmentado
            label="Período"
            value={periodo}
            onChange={setPeriodo}
            options={[
              { value: "mes", label: "Mês" },
              { value: "ano", label: "Ano" },
              { value: "tudo", label: "Tudo" },
            ]}
          />
        ) : null}
        {!comPeriodo || periodo !== "tudo" ? <MesStepper mes={mes} onChange={setMes} min={mesDe(INICIO_DEMO)} max={mesDe(hoje)} /> : null}
        <MoedaPills moedas={moedas} value={moeda} onChange={setMoeda} />
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-primary-deep">{dados.nome}</h2>
            <p className="text-sm text-muted-foreground">
              {dados.resumo} {periodoNome}, em {MOEDAS[moeda].nome.toLowerCase()}.
            </p>
          </div>
          {informe === "gastos-categoria" || informe === "entradas-categoria" ? (
            <Segmentado
              label="Tipo de gráfico"
              value={forma}
              onChange={setForma}
              options={[
                { value: "rosca", label: <ChartPie className="h-4 w-4" aria-label="Rosca" /> },
                { value: "barras", label: <ChartColumn className="h-4 w-4 rotate-90" aria-label="Barras" /> },
              ]}
            />
          ) : null}
        </div>

        {informe === "gastos-categoria" || informe === "entradas-categoria" ? (
          fatias.length ? (
            <>
              {forma === "rosca" ? <Rosca fatias={fatias} moeda={moeda} rotulo={tipo === "saida" ? "Gastos" : "Entradas"} /> : <BarrasCategoria fatias={fatias} moeda={moeda} />}
              <Tabela titulo="Em números">
                <thead>
                  <tr className="text-left">
                    <th className={cabeca}>Categoria</th>
                    <th className={cn(cabeca, "hidden text-right sm:table-cell")}>Lançamentos</th>
                    <th className={cn(cabeca, "text-right")}>Total</th>
                    <th className={cn(cabeca, "text-right")}>%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {fatias.map((fatia) => (
                    <tr key={fatia.id}>
                      <td className="px-2 py-2.5">{fatia.nome}</td>
                      <td className={cn(numero, "hidden text-muted-foreground sm:table-cell")}>{fatia.quantos}</td>
                      <td className={cn(numero, "font-medium")}>{fmtMoeda(fatia.valor, moeda)}</td>
                      <td className={cn(numero, "text-muted-foreground")}>{pct(fatia.valor, total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border font-semibold text-primary-deep">
                    <td className="px-2 py-2.5">Total</td>
                    <td className={cn(numero, "hidden sm:table-cell")}>{fatias.reduce((sum, fatia) => sum + fatia.quantos, 0)}</td>
                    <td className={numero}>{fmtMoeda(total, moeda)}</td>
                    <td className={numero} />
                  </tr>
                </tfoot>
              </Tabela>
            </>
          ) : (
            <Vazio titulo={tipo === "saida" ? "Nenhum gasto nesse período" : "Nenhuma entrada nesse período"} />
          )
        ) : null}

        {informe === "gastos-dia" ? (
          porDia.some((item) => item.saidas > 0) ? (
            <>
              <Colunas
                rotulos={dias.map((dia) => String(Number(dia.slice(8))))}
                dicas={dias.map((dia) => fmtDiaNumero(dia))}
                moeda={moeda}
                series={[{ nome: "Gastos", cor: "var(--viz-out)", valores: porDia.map((item) => item.saidas) }]}
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Total do mês: <span className="font-semibold tabular-nums text-foreground">{fmtMoeda(porDia.reduce((sum, item) => sum + item.saidas, 0), moeda)}</span>
                {" · "}Dia mais alto:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {(() => {
                    const maior = porDia.reduce((best, item, index) => (item.saidas > porDia[best].saidas ? index : best), 0);
                    return `${fmtDiaNumero(dias[maior])} (${fmtMoeda(porDia[maior].saidas, moeda)})`;
                  })()}
                </span>
              </p>
            </>
          ) : (
            <Vazio titulo="Nenhum gasto neste mês" />
          )
        ) : null}

        {serieAnual ? (
          <>
            <Colunas
              rotulos={meses.map((item) => fmtMes(item, "curto"))}
              dicas={meses.map((item) => fmtMes(item))}
              moeda={moeda}
              series={
                informe === "balanco"
                  ? [
                      { nome: "Entradas", cor: "var(--viz-in)", valores: porMes.map((item) => item.entradas) },
                      { nome: "Saídas", cor: "var(--viz-out)", valores: porMes.map((item) => item.saidas) },
                    ]
                  : [{ nome: "Gastos", cor: "var(--viz-out)", valores: porMes.map((item) => item.saidas) }]
              }
              rodape={informe === "balanco" ? (index) => ({ nome: "Balanço", valor: fmtMoeda(porMes[index].balanco, moeda, { sinal: true }) }) : undefined}
            />
            <Tabela titulo="Mês a mês">
              <thead>
                <tr className="text-left">
                  <th className={cabeca}>Mês</th>
                  {informe === "balanco" ? <th className={cn(cabeca, "text-right")}>Entradas</th> : null}
                  <th className={cn(cabeca, "text-right")}>Saídas</th>
                  {informe === "balanco" ? <th className={cn(cabeca, "text-right")}>Balanço</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {meses.map((item, index) => (
                  <tr key={item}>
                    <td className="px-2 py-2.5 capitalize">{fmtMes(item)}</td>
                    {informe === "balanco" ? <td className={cn(numero, corEntrada)}>{fmtMoeda(porMes[index].entradas, moeda)}</td> : null}
                    <td className={numero}>{fmtMoeda(porMes[index].saidas, moeda)}</td>
                    {informe === "balanco" ? <td className={cn(numero, "font-medium")}>{fmtMoeda(porMes[index].balanco, moeda, { sinal: true })}</td> : null}
                  </tr>
                ))}
              </tbody>
            </Tabela>
          </>
        ) : null}

        {informe === "equipes" ? (
          <>
            {fatiasEquipe.length ? <BarrasCategoria fatias={fatiasEquipe} moeda={moeda} /> : <Vazio titulo="Nenhum gasto nesse período" />}
            <Tabela titulo="Equipe por equipe">
              <thead>
                <tr className="text-left">
                  <th className={cabeca}>Equipe</th>
                  <th className={cn(cabeca, "text-right")}>Entradas</th>
                  <th className={cn(cabeca, "text-right")}>Saídas</th>
                  <th className={cn(cabeca, "hidden text-right sm:table-cell")}>Balanço</th>
                  <th className={cn(cabeca, "hidden text-right sm:table-cell")}>Saldo hoje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {equipes.map((item) => (
                  <tr key={item.projeto.id}>
                    <td className="px-2 py-2.5 font-medium text-primary-deep">{item.projeto.nome}</td>
                    <td className={cn(numero, corEntrada)}>{fmtMoeda(item.entradas, moeda)}</td>
                    <td className={numero}>{fmtMoeda(item.saidas, moeda)}</td>
                    <td className={cn(numero, "hidden font-medium sm:table-cell")}>{fmtMoeda(item.balanco, moeda, { sinal: true })}</td>
                    <td className={cn(numero, "hidden font-semibold text-primary-deep sm:table-cell")}>{fmtMoeda(item.saldo, moeda)}</td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          </>
        ) : null}
      </Card>
    </div>
  );
}

// A mesma informação do gráfico em tabela: para ler o número exato, e para
// quem não distingue as cores.
function Tabela({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t border-border/60 pt-4">
      <h3 className="mb-1 text-sm font-semibold text-primary-deep">{titulo}</h3>
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}
