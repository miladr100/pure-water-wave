"use client";

import { Download, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useApi } from "@/components/academy/use-api";
import { Bar, Card, Eyebrow, Failed, LoadingBlock, Reais, Stat } from "@/components/painel/bits";
import { OrientacaoDialog, type OrientacaoAlvo } from "@/components/painel/orientacao-dialog";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { RelatorioLinha } from "@/components/painel/validacao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtDia, fmtDiaNumero, isIsoDay, todayInBrazil } from "@/lib/hj/dates";
import { fmtReais, pct } from "@/lib/hj/rm";
import type { AdminResultados, ArrecadacaoAreaLinha, ProjetoResumo, RelatorioRow } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

const ABAS = ["resultados", "relatorios", "metas", "contabilidade", "areas"] as const;
type Aba = (typeof ABAS)[number];

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Arrecadação for educators: the spreadsheet (results grid), the day's
// reports to validate, the goals, and the cash vs. pix accounting.
export function ArrecadacaoScreen() {
  const t = usePainelMessages();
  const params = useSearchParams();
  const abaParam = params.get("aba");
  const aba: Aba = ABAS.includes(abaParam as Aba) ? (abaParam as Aba) : "resultados";

  const [filtros, setFiltros] = useState({ projeto: "", programa: "", equipe: "", educador: "", busca: "" });
  const query = new URLSearchParams(Object.entries(filtros).filter(([, value]) => value !== "")).toString();
  const results = useApi<AdminResultados>(`/api/admin/hj/resultados${query ? `?${query}` : ""}`);

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
            title={aba === "resultados" ? t.admin.resultsTab : aba === "metas" ? t.admin.goalsTab : aba === "areas" ? t.admin.areasTitle : t.admin.accountingTab}
            description={aba === "areas" ? t.admin.areasBody : undefined}
            actions={
              aba === "resultados" || aba === "areas" ? (
                <Button type="button" variant="outline" className="rounded-full" onClick={() => (aba === "areas" ? exportAreasCsv(data) : exportCsv(data))}>
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

          {aba === "resultados" ? (
            <Resultados data={data} />
          ) : aba === "metas" ? (
            <Metas data={data} onChanged={() => results.reload()} />
          ) : aba === "areas" ? (
            <PorArea data={data} />
          ) : (
            <Contabilidade data={data} />
          )}
        </>
      )}
    </div>
  );
}

function Resultados({ data }: { data: AdminResultados }) {
  const t = usePainelMessages();
  const hoje = todayInBrazil();
  const dias = useMemo(() => data.dias.filter((dia) => dia.data <= hoje), [data.dias, hoje]);
  const { panorama } = data;

  return (
    <>
      {panorama ? (
        <>
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Eyebrow>{t.admin.raised}</Eyebrow>
                <p className="font-display text-4xl font-semibold text-primary-deep tabular-nums">{fmtReais(panorama.totais.liquidoCents)}</p>
                <p className="text-sm text-muted-foreground">
                  {t.admin.ofGoal(fmtReais(panorama.totais.metaCents))} · {pct(panorama.totais.liquidoCents, panorama.totais.metaCents)}%
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{panorama.totais.membros}</strong> {t.admin.members}
                </span>
                <span>
                  <strong className="text-foreground">{panorama.totais.equipes}</strong> {t.admin.teams}
                </span>
                <span>
                  <strong className="text-foreground">{panorama.totais.enviadosHoje}</strong> {t.admin.sentToday}
                </span>
                <Link href="/admin/arrecadacao?aba=relatorios" className="text-primary hover:underline">
                  <strong>{panorama.totais.pendentesValidacao}</strong> {t.admin.pendingValidation}
                </Link>
                {panorama.totais.devolvidos > 0 ? (
                  <span className="text-coral">
                    <strong>{panorama.totais.devolvidos}</strong> {t.admin.returned}
                  </span>
                ) : null}
              </div>
            </div>
            <Bar value={panorama.totais.liquidoCents} max={panorama.totais.metaCents} className="mt-4" />
          </Card>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Card>
              <Eyebrow className="mb-3">{t.admin.byProgram}</Eyebrow>
              <ul className="space-y-3">
                {panorama.programas.map((programa) => (
                  <li key={programa.programa}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span className="font-semibold">
                        {programa.programa} <span className="font-normal text-muted-foreground">· {programa.membros} {t.admin.members}</span>
                      </span>
                      <span className="text-muted-foreground">
                        <Reais cents={programa.liquidoCents} className="font-semibold text-foreground" />
                        {programa.metaCents ? ` de ${fmtReais(programa.metaCents)} · ${pct(programa.liquidoCents, programa.metaCents)}%` : ""}
                      </span>
                    </div>
                    <Bar value={programa.liquidoCents} max={programa.metaCents || programa.liquidoCents} className="mt-1.5" />
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <Eyebrow className="mb-3">{t.admin.byTeam}</Eyebrow>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3 font-semibold">{t.admin.team}</th>
                      <th className="py-2 pr-3 font-semibold">{t.admin.educator}</th>
                      <th className="py-2 pr-3 text-right font-semibold">{t.common.today}</th>
                      <th className="py-2 text-right font-semibold">{t.equipe.total}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {panorama.equipes.map((equipe) => (
                      <tr key={equipe.id}>
                        <td className="py-2.5 pr-3">
                          <Link href={`/admin/equipes?equipe=${equipe.id}`} className="font-medium hover:text-primary">
                            {equipe.nome}
                          </Link>
                          <span className="ml-2 text-xs text-muted-foreground">{equipe.programa}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{equipe.educador?.nome ?? "—"}</td>
                        <td className="py-2.5 pr-3 text-right">
                          <span className={equipe.enviadosHoje < equipe.membros ? "text-coral" : "text-muted-foreground"}>
                            {equipe.enviadosHoje}/{equipe.membros}
                          </span>{" "}
                          <Reais cents={equipe.liquidoHojeCents} className="font-semibold" />
                        </td>
                        <td className="py-2.5 text-right font-semibold">
                          <Reais cents={equipe.liquidoCents} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      ) : null}

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

function Metas({ data, onChanged }: { data: AdminResultados; onChanged: () => void }) {
  const t = usePainelMessages();
  const [alvo, setAlvo] = useState<OrientacaoAlvo | null>(null);
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
                <th className="py-2 pr-3 text-right font-semibold">Nova meta</th>
                <th className="py-2 font-semibold">{t.indicadores.innerGoal}</th>
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
                  <td className="py-2 pr-3 text-right font-semibold tabular-nums text-primary-deep">{fmtReais(linha.metaCents)}</td>
                  <td className="max-w-xs py-2">
                    <button type="button" className="group flex w-full items-start gap-2 text-left" onClick={() => setAlvo({ modulo: "rm", membroId: linha.membro.id, nome: linha.membro.nome })} title={linha.orientacao?.texto}>
                      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                      {linha.orientacao ? (
                        <span className="min-w-0">
                          <span className="line-clamp-2">{linha.orientacao.texto}</span>
                          <span className="block text-xs text-muted-foreground">{fmtDia(linha.orientacao.data)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground group-hover:text-primary">{t.indicadores.addOrientation}</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <OrientacaoDialog key={alvo?.membroId ?? "closed"} alvo={alvo} onClose={() => setAlvo(null)} onSaved={onChanged} />
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

// RM by region and by country (Wang Song, 23/11/2026): the same numbers as
// Resultados, added up by the region and the country of each team's local
// (Organização › Áreas). Follows the filters above.
function PorArea({ data }: { data: AdminResultados }) {
  const t = usePainelMessages();
  const { regioes, paises, total } = data.porArea;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t.admin.net} value={fmtReais(total.liquidoCents)} hint={`${fmtReais(total.dinheiroCents + total.pixCents)} ${t.admin.gross.toLowerCase()} − ${fmtReais(total.despesasCents)}`} />
        <Stat label={t.admin.regions} value={regioes.filter((row) => row.id !== "sem_area").length} hint={`${paises.filter((row) => row.id !== "sem_area").length} ${t.admin.countries.toLowerCase()}`} />
        <Stat label={maiuscula(t.admin.teams)} value={total.equipes} hint={`${total.membros} ${t.admin.members}`} />
        <Stat label={t.admin.avgPerReport} value={fmtReais(total.mediaCents)} hint={t.admin.reportsCounted(total.relatorios)} />
      </div>
      <AreaTabela titulo={t.admin.byRegion} coluna={t.missao.regiao} linhas={regioes} total={total} />
      <AreaTabela titulo={t.admin.byCountry} coluna={t.missao.pais} linhas={paises} total={total} />
    </>
  );
}

const maiuscula = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function AreaTabela({ titulo, coluna, linhas, total }: { titulo: string; coluna: string; linhas: ArrecadacaoAreaLinha[]; total: ArrecadacaoAreaLinha }) {
  const t = usePainelMessages();
  if (linhas.length === 0) {
    return (
      <Card>
        <Eyebrow className="mb-2">{titulo}</Eyebrow>
        <p className="text-sm text-muted-foreground">{t.admin.noAreaData}</p>
      </Card>
    );
  }
  const numero = "py-2.5 pr-3 text-right tabular-nums";
  return (
    <Card>
      <Eyebrow className="mb-3">{titulo}</Eyebrow>
      {/* phone: one card per area, nothing to slide sideways */}
      <ul className="space-y-3 md:hidden">
        {linhas.map((row) => (
          <li key={row.id} className="rounded-2xl border border-border/60 p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate font-semibold">
                {row.nome}
                {row.regiao ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">{row.regiao}</span> : null}
              </p>
              <Reais cents={row.liquidoCents} className="shrink-0 font-semibold text-primary-deep" />
            </div>
            <Bar value={row.liquidoCents} max={total.liquidoCents} className="mt-2" />
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2"><dt>{t.admin.cash}</dt><dd className="tabular-nums text-foreground">{fmtReais(row.dinheiroCents)}</dd></div>
              <div className="flex justify-between gap-2"><dt>{t.admin.pix}</dt><dd className="tabular-nums text-foreground">{fmtReais(row.pixCents)}</dd></div>
              <div className="flex justify-between gap-2"><dt>{t.admin.expenses}</dt><dd className="tabular-nums text-foreground">{fmtReais(row.despesasCents)}</dd></div>
              <div className="flex justify-between gap-2"><dt>{t.admin.share}</dt><dd className="tabular-nums text-foreground">{Math.round(row.participacao * 100)}%</dd></div>
              <div className="flex justify-between gap-2"><dt>{maiuscula(t.admin.teams)}</dt><dd className="tabular-nums text-foreground">{row.equipes} · {row.membros} {t.admin.members}</dd></div>
              <div className="flex justify-between gap-2"><dt>{t.admin.avgShort}</dt><dd className="tabular-nums text-foreground">{fmtReais(row.mediaCents)}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-semibold">{coluna}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t.admin.teams}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t.admin.members}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t.admin.reportsShort}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t.admin.cash}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t.admin.pix}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t.admin.expenses}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t.admin.net}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t.admin.avgPerReport}</th>
              <th className="py-2 text-right font-semibold">{t.admin.share}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {linhas.map((row) => (
              <tr key={row.id}>
                <td className="py-2.5 pr-3">
                  <span className="font-medium">{row.nome}</span>
                  {row.regiao ? <span className="ml-2 text-xs text-muted-foreground">{row.regiao}</span> : null}
                </td>
                <td className={numero}>{row.equipes}</td>
                <td className={numero}>{row.membros}</td>
                <td className={numero}>{row.relatorios.toLocaleString("pt-BR")}</td>
                <td className={numero}>{fmtReais(row.dinheiroCents)}</td>
                <td className={numero}>{fmtReais(row.pixCents)}</td>
                <td className={numero}>{fmtReais(row.despesasCents)}</td>
                <td className={cn(numero, "font-semibold text-primary-deep")}>{fmtReais(row.liquidoCents)}</td>
                <td className={numero}>{fmtReais(row.mediaCents)}</td>
                <td className="py-2.5 text-right tabular-nums">{Math.round(row.participacao * 100)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td className="py-2.5 pr-3">{maiuscula(t.equipe.total)}</td>
              <td className={numero}>{total.equipes}</td>
              <td className={numero}>{total.membros}</td>
              <td className={numero}>{total.relatorios.toLocaleString("pt-BR")}</td>
              <td className={numero}>{fmtReais(total.dinheiroCents)}</td>
              <td className={numero}>{fmtReais(total.pixCents)}</td>
              <td className={numero}>{fmtReais(total.despesasCents)}</td>
              <td className={cn(numero, "text-primary-deep")}>{fmtReais(total.liquidoCents)}</td>
              <td className={numero}>{fmtReais(total.mediaCents)}</td>
              <td className="py-2.5 text-right tabular-nums">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

function RelatoriosDoDia({ projeto }: { projeto: ProjetoResumo }) {
  const t = usePainelMessages();
  const [data, setData] = useState(projeto.hoje);
  const [pendentes, setPendentes] = useState(false);
  const list = useApi<{ relatorios: RelatorioRow[]; podeValidar: Record<string, boolean> }>(
    `/api/admin/hj/relatorios?projeto=${projeto.id}&${pendentes ? "estado=enviado" : `data=${data}`}`,
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
  baixarCsv([header, ...lines], `resultados-${slugOf(data)}.csv`);
}

// The report by region and by country, both tables in one file (Wang Song).
function exportAreasCsv(data: AdminResultados) {
  const reais = (cents: number) => (cents / 100).toFixed(2);
  const header = ["Nível", "Nome", "Região", "Equipes", "Membros", "Relatórios", "Dinheiro", "Pix", "Despesas", "Líquido", "Média por relatório", "% do total"];
  const row = (nivel: string, item: ArrecadacaoAreaLinha) => [
    nivel,
    item.nome,
    item.regiao ?? "",
    item.equipes,
    item.membros,
    item.relatorios,
    reais(item.dinheiroCents),
    reais(item.pixCents),
    reais(item.despesasCents),
    reais(item.liquidoCents),
    reais(item.mediaCents),
    (item.participacao * 100).toFixed(1),
  ];
  const { regioes, paises, total } = data.porArea;
  baixarCsv(
    [header, ...regioes.map((item) => row("Região", item)), ...paises.map((item) => row("País", item)), row("Total", total)],
    `rm-por-regiao-e-pais-${slugOf(data)}.csv`,
  );
}

function slugOf(data: AdminResultados) {
  const slug = (data.projeto?.nome ?? "rm").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return slug || "rm";
}

function baixarCsv(rows: unknown[][], nome: string) {
  // A cell that starts like a formula (=, +, -, @) gets a leading apostrophe
  // so a spreadsheet shows it as text instead of evaluating it.
  const safe = (cell: unknown) => {
    const text = String(cell);
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
  };
  const csv = rows.map((row) => row.map((cell) => `"${safe(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}
