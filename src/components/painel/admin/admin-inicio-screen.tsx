"use client";

import Link from "next/link";

import { useApi } from "@/components/academy/use-api";
import { Bar, Card, Eyebrow, Failed, LoadingBlock, Reais, Stat } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { fmtDia } from "@/lib/hj/dates";
import { fmtReais, pct } from "@/lib/hj/rm";
import { ETAPA_LABELS, ETAPA_ORDEM } from "@/lib/hj/testemunho";
import type { AdminHjInicio } from "@/lib/hj/types";

// The administration's home: the project today, by program and by team,
// and the testimony picture.
export function AdminInicioScreen() {
  const t = usePainelMessages();
  const home = useApi<AdminHjInicio>("/api/admin/hj/inicio");

  if (home.error) {
    return <Failed error={home.error} onRetry={home.reload} />;
  }
  if (home.loading || !home.data) {
    return <LoadingBlock />;
  }

  const { projeto, totais, programas, equipes, testemunho } = home.data;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PainelHeading
        eyebrow={projeto ? `${projeto.nome} · ${t.common.day(projeto.diaAtual, projeto.totalDias)}` : t.areas.admin}
        title={t.admin.homeTitle}
        description={projeto ? fmtDia(projeto.hoje, "longo") : t.common.noProject}
      />

      {projeto ? (
        <>
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Eyebrow>{t.admin.raised}</Eyebrow>
                <p className="font-display text-4xl font-semibold text-primary-deep tabular-nums">{fmtReais(totais.liquidoCents)}</p>
                <p className="text-sm text-muted-foreground">
                  {t.admin.ofGoal(fmtReais(totais.metaCents))} · {pct(totais.liquidoCents, totais.metaCents)}%
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{totais.membros}</strong> {t.admin.members}
                </span>
                <span>
                  <strong className="text-foreground">{totais.equipes}</strong> {t.admin.teams}
                </span>
                <span>
                  <strong className="text-foreground">{totais.enviadosHoje}</strong> {t.admin.sentToday}
                </span>
                <Link href="/admin/arrecadacao?aba=relatorios" className="text-primary hover:underline">
                  <strong>{totais.pendentesValidacao}</strong> {t.admin.pendingValidation}
                </Link>
                {totais.devolvidos > 0 ? (
                  <span className="text-coral">
                    <strong>{totais.devolvidos}</strong> {t.admin.returned}
                  </span>
                ) : null}
              </div>
            </div>
            <Bar value={totais.liquidoCents} max={totais.metaCents} className="mt-4" />
          </Card>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Card>
              <Eyebrow className="mb-3">{t.admin.byProgram}</Eyebrow>
              <ul className="space-y-3">
                {programas.map((programa) => (
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
                    {equipes.map((equipe) => (
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>{t.admin.testemunhoSummary}</Eyebrow>
          <Link href="/admin/testemunho" className="text-sm font-medium text-primary hover:underline">
            {t.inicio.seeGuests}
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label={t.inicio.guests(testemunho.convidados).replace(/^\d+ /, "")} value={testemunho.convidados} />
          {ETAPA_ORDEM.map((etapa) => (
            <Stat key={etapa} label={ETAPA_LABELS[etapa]} value={testemunho.porEtapa[etapa]} />
          ))}
        </div>
        {testemunho.alertas > 0 ? <p className="mt-3 text-sm font-medium text-coral">{t.admin.alerts(testemunho.alertas)}</p> : null}
      </Card>
    </div>
  );
}
