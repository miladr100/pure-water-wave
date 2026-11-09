"use client";

import { Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useApi } from "@/components/academy/use-api";
import { Bar, Card, Eyebrow, Failed, LoadingBlock, Reais, Stat } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { RelatorioLinha } from "@/components/painel/validacao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtDia, fmtDiaNumero, isIsoDay, todayInBrazil } from "@/lib/hj/dates";
import { fmtReais, pct } from "@/lib/hj/rm";
import type { AdminResultados, ProjetoResumo, RelatorioRow } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

const ABAS = ["resultados", "relatorios", "metas", "contabilidade"] as const;
type Aba = (typeof ABAS)[number];

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Arrecadação for educators: the spreadsheet (results grid), the day's
// reports to validate, the goals, and the cash vs. pix accounting.
export function ArrecadacaoScreen() {
  const t = usePainelMessages();
  const router = useRouter();
  const params = useSearchParams();
  const abaParam = params.get("aba");
  const aba: Aba = ABAS.includes(abaParam as Aba) ? (abaParam as Aba) : "resultados";

  const [filtros, setFiltros] = useState({ projeto: "", programa: "", equipe: "", educador: "", busca: "" });
  const query = new URLSearchParams(Object.entries(filtros).filter(([, value]) => value !== "")).toString();
  const results = useApi<AdminResultados>(`/api/admin/hj/resultados${query ? `?${query}` : ""}`);

  function setAba(next: Aba) {
    const search = new URLSearchParams(params.toString());
    if (next === "resultados") search.delete("aba");
    else search.set("aba", next);
    const text = search.toString();
    router.replace(text ? `/admin/arrecadacao?${text}` : "/admin/arrecadacao");
  }

  if (results.error) {
    return <Failed error={results.error} onRetry={results.reload} />;
  }
  if (results.loading || !results.data) {
    return <LoadingBlock />;
  }
  const data = results.data;
  const { projeto } = data;

  return (
    <div className="space-y-6">
      <div className="-mt-2 flex gap-1 overflow-x-auto border-b border-border/60">
        {ABAS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAba(item)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition",
              aba === item ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-primary-deep",
            )}
          >
            {item === "resultados" ? t.admin.resultsTab : item === "relatorios" ? t.admin.reportsTab : item === "metas" ? t.admin.goalsTab : t.admin.accountingTab}
          </button>
        ))}
      </div>

      {!projeto ? (
        <>
          <PainelHeading title={t.nav.arrecadacao} />
          <Card>{t.common.noProject}</Card>
        </>
      ) : aba === "relatorios" ? (
        <RelatoriosDoDia projeto={projeto} />
      ) : (
        <>
          <PainelHeading
            eyebrow={`${projeto.nome} · ${t.common.day(projeto.diaAtual, projeto.totalDias)}`}
            title={aba === "resultados" ? t.admin.resultsTab : aba === "metas" ? t.admin.goalsTab : t.admin.accountingTab}
            actions={
              aba === "resultados" ? (
                <Button type="button" variant="outline" className="rounded-full" onClick={() => exportCsv(data)}>
                  <Download className="h-4 w-4" />
                  {t.admin.exportCsv}
                </Button>
              ) : null
            }
          />

          <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs">{t.admin.project}</Label>
              <select className={selectClass} value={filtros.projeto} onChange={(event) => setFiltros({ ...filtros, projeto: event.target.value, equipe: "" })}>
                {data.filtros.projetos.map((item) => (
                  <option key={item.id} value={item.id === projeto.id && filtros.projeto === "" ? "" : item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.admin.program}</Label>
              <select className={selectClass} value={filtros.programa} onChange={(event) => setFiltros({ ...filtros, programa: event.target.value })}>
                <option value="">{t.common.all}</option>
                {data.filtros.programas.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.admin.team}</Label>
              <select className={selectClass} value={filtros.equipe} onChange={(event) => setFiltros({ ...filtros, equipe: event.target.value })}>
                <option value="">{t.common.all}</option>
                {data.filtros.equipes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.admin.educator}</Label>
              <select className={selectClass} value={filtros.educador} onChange={(event) => setFiltros({ ...filtros, educador: event.target.value })}>
                <option value="">{t.common.all}</option>
                {data.filtros.educadores.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="busca">
                {t.admin.searchMember}
              </Label>
              <Input id="busca" className="h-10 rounded-xl" value={filtros.busca} onChange={(event) => setFiltros({ ...filtros, busca: event.target.value })} />
            </div>
          </Card>

          {aba === "resultados" ? <Resultados data={data} /> : aba === "metas" ? <Metas data={data} /> : <Contabilidade data={data} />}
        </>
      )}
    </div>
  );
}

function Resultados({ data }: { data: AdminResultados }) {
  const t = usePainelMessages();
  const hoje = todayInBrazil();
  const dias = useMemo(() => data.dias.filter((dia) => dia.data <= hoje), [data.dias, hoje]);

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold">{t.admin.totals}</p>
          <p className="text-sm text-muted-foreground">
            <Reais cents={data.totais.liquidoCents} className="font-display text-xl font-semibold text-primary-deep" /> {t.admin.ofGoal(fmtReais(data.totais.metaCents))} · {pct(data.totais.liquidoCents, data.totais.metaCents)}% · {data.linhas.length} {t.admin.members}
          </p>
        </div>
        <Bar value={data.totais.liquidoCents} max={data.totais.metaCents} className="mt-3" />
      </Card>

      <Card className="p-0 sm:p-0">
        <div className="max-h-[70vh] overflow-auto rounded-3xl">
          <table className="w-full min-w-max border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="text-left uppercase tracking-wide text-muted-foreground">
                <th className="sticky left-0 z-20 bg-card px-3 py-2 font-semibold">{t.admin.membersLabel}</th>
                <th className="px-2 py-2 font-semibold">{t.admin.team}</th>
                <th className="px-2 py-2 text-right font-semibold">{t.equipe.meta}</th>
                <th className="px-2 py-2 text-right font-semibold">{t.equipe.media}</th>
                <th className="px-2 py-2 text-right font-semibold">{t.equipe.total}</th>
                {dias.map((dia) => (
                  <th key={dia.data} className={cn("px-1.5 py-2 text-right font-semibold tabular-nums", dia.descanso && "text-muted-foreground/60")} title={fmtDia(dia.data)}>
                    {fmtDiaNumero(dia.data).slice(0, 2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.linhas.map((linha) => (
                <tr key={linha.membro.id} className="border-t border-border/60 hover:bg-secondary/40">
                  <td className="sticky left-0 z-10 bg-card px-3 py-1.5 font-medium">{linha.membro.nome}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{linha.equipe.nome}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmtReais(linha.metaCents)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">{fmtReais(linha.mediaCents)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{fmtReais(linha.totalCents)}</td>
                  {dias.map((dia) => {
                    const cell = linha.porDia[dia.data];
                    return (
                      <td
                        key={dia.data}
                        className={cn(
                          "px-1.5 py-1.5 text-right tabular-nums",
                          dia.descanso && "bg-muted/40",
                          cell?.estado === "devolvido" && "text-coral line-through",
                          cell?.estado === "enviado" && "text-muted-foreground",
                        )}
                        title={cell ? `${fmtDia(dia.data)} · ${t.estados[cell.estado]}` : undefined}
                      >
                        {cell ? Math.round(cell.liquidoCents / 100) : dia.descanso ? "" : "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-card">
              <tr className="border-t-2 border-border font-semibold">
                <td className="sticky left-0 z-10 bg-card px-3 py-2">{t.admin.totals}</td>
                <td />
                <td />
                <td />
                <td className="px-2 py-2 text-right tabular-nums">{fmtReais(data.totais.liquidoCents)}</td>
                {dias.map((dia) => (
                  <td key={dia.data} className="px-1.5 py-2 text-right tabular-nums">
                    {data.totais.porDia[dia.data] ? Math.round(data.totais.porDia[dia.data] / 100) : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">Valores em reais, sem centavos. Cinza = enviado (aguardando validação); riscado = devolvido; coluna sombreada = dia de descanso.</p>
    </>
  );
}

function Metas({ data }: { data: AdminResultados }) {
  const t = usePainelMessages();
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {data.programas.map((programa) => (
          <Stat key={programa.programa} label={programa.programa} value={fmtReais(programa.liquidoCents)} hint={programa.metaCents ? `${t.admin.ofGoal(fmtReais(programa.metaCents))} · ${pct(programa.liquidoCents, programa.metaCents)}%` : undefined} />
        ))}
      </div>
      <Card>
        <Eyebrow className="mb-3">{t.admin.goalsTab} · {t.admin.membersLabel}</Eyebrow>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">{t.admin.membersLabel}</th>
                <th className="py-2 pr-3 font-semibold">{t.admin.team}</th>
                <th className="py-2 pr-3 text-right font-semibold">Dias</th>
                <th className="py-2 pr-3 text-right font-semibold">{t.equipe.media}</th>
                <th className="py-2 pr-3 text-right font-semibold">Recorde</th>
                <th className="py-2 text-right font-semibold">Nova meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.linhas.map((linha) => (
                <tr key={linha.membro.id}>
                  <td className="py-2 pr-3 font-medium">{linha.membro.nome}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{linha.equipe.nome}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{linha.diasEnviados}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtReais(linha.mediaCents)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtReais(linha.recordeCents)}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-primary-deep">{fmtReais(linha.metaCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Contabilidade({ data }: { data: AdminResultados }) {
  const t = usePainelMessages();
  const { dinheiroCents, pixCents, despesasCents, liquidoCents } = data.totais;
  const bruto = dinheiroCents + pixCents;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.admin.cash} value={fmtReais(dinheiroCents)} hint={`${pct(dinheiroCents, bruto)}% do bruto`} />
        <Stat label={t.admin.pix} value={fmtReais(pixCents)} hint={`${pct(pixCents, bruto)}% do bruto`} />
        <Stat label={t.admin.expenses} value={fmtReais(despesasCents)} />
        <Stat label={t.admin.net} value={fmtReais(liquidoCents)} hint="dinheiro + pix − despesas" />
      </div>
      <Card>
        <Eyebrow className="mb-3">{t.admin.perDay}</Eyebrow>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Dia</th>
                <th className="py-2 text-right font-semibold">{t.admin.net}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.dias
                .filter((dia) => data.totais.porDia[dia.data])
                .map((dia) => (
                  <tr key={dia.data}>
                    <td className="py-2 pr-3">{fmtDia(dia.data)}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{fmtReais(data.totais.porDia[dia.data])}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function RelatoriosDoDia({ projeto }: { projeto: ProjetoResumo }) {
  const t = usePainelMessages();
  const [data, setData] = useState(projeto.hoje);
  const [pendentes, setPendentes] = useState(false);
  const list = useApi<{ relatorios: RelatorioRow[]; podeValidar: Record<string, boolean> }>(
    pendentes ? "/api/admin/hj/relatorios?estado=enviado" : `/api/admin/hj/relatorios?data=${data}`,
  );

  return (
    <>
      <PainelHeading
        eyebrow={`${projeto.nome} · ${t.common.day(projeto.diaAtual, projeto.totalDias)}`}
        title={t.admin.dayReports}
        actions={
          <>
            <button
              type="button"
              onClick={() => setPendentes(!pendentes)}
              className={cn("h-10 rounded-full border px-4 text-sm font-semibold", pendentes ? "border-primary bg-secondary text-primary-deep" : "border-border bg-card text-muted-foreground")}
            >
              {t.admin.pendingValidation}
            </button>
            <Input type="date" className="h-10 w-44 rounded-full" value={data} max={projeto.hoje} min={projeto.inicio} disabled={pendentes} onChange={(event) => isIsoDay(event.target.value) && setData(event.target.value)} />
          </>
        }
      />
      {list.error ? (
        <Failed error={list.error} onRetry={list.reload} />
      ) : list.loading || !list.data ? (
        <LoadingBlock />
      ) : list.data.relatorios.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">{t.admin.noReports}</p>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border/60">
            {list.data.relatorios.map((row) => (
              <RelatorioLinha key={row.id} row={row} showTeam canValidate={list.data!.podeValidar[row.id] ?? false} onChanged={() => list.reload()} />
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function exportCsv(data: AdminResultados) {
  const dias = data.dias.map((dia) => dia.data);
  const header = ["Membro", "Equipe", "Programa", "Educador", "Meta", "Média", "Recorde", "Total", ...dias.map(fmtDiaNumero)];
  const lines = data.linhas.map((linha) => [
    linha.membro.nome,
    linha.equipe.nome,
    linha.equipe.programa,
    linha.educador?.nome ?? "",
    (linha.metaCents / 100).toFixed(2),
    (linha.mediaCents / 100).toFixed(2),
    (linha.recordeCents / 100).toFixed(2),
    (linha.totalCents / 100).toFixed(2),
    ...dias.map((dia) => (linha.porDia[dia] ? (linha.porDia[dia].liquidoCents / 100).toFixed(2) : "")),
  ]);
  const csv = [header, ...lines].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const slug = (data.projeto?.nome ?? "rm").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  link.download = `resultados-${slug || "rm"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
