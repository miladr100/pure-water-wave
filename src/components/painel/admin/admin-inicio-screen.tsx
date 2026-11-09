"use client";

import { Check, FileSignature, Heart, MessageCircle, StickyNote, Waves } from "lucide-react";
import Link from "next/link";

import { useApi } from "@/components/academy/use-api";
import { Bar, Card, Eyebrow, Failed, LoadingBlock, Reais, Stat } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { fmtDia } from "@/lib/hj/dates";
import { fmtReais, pct } from "@/lib/hj/rm";
import { ETAPA_LABELS, ETAPA_ORDEM } from "@/lib/hj/testemunho";
import type { AcontecimentoTipo, AdminHjInicio } from "@/lib/hj/types";

const TIPO_ICON: Record<AcontecimentoTipo, typeof Heart> = {
  contato: MessageCircle,
  gateway: Waves,
  conferencia: Heart,
  ficha: FileSignature,
  etapa: Check,
  nota: StickyNote,
};

// The administration's home: the fundraising overview (by program, by
// team) and the testimony overview (by stage, by team, latest happenings),
// each under the project of its kind that runs today.
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
  const hoje = projeto?.hoje ?? testemunho.projeto?.hoje ?? null;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PainelHeading title={t.admin.homeTitle} description={hoje ? fmtDia(hoje, "longo") : undefined} />

      {/* ---------- Arrecadação ---------- */}
      <section className="space-y-5">
        <SectionTitle
          label={t.admin.arrecadacaoSection}
          detail={projeto ? `${projeto.nome} · ${t.common.day(projeto.diaAtual, projeto.totalDias)}` : t.common.noProject}
          href="/admin/arrecadacao"
          linkLabel={t.admin.resultsTab}
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
        ) : (
          <Card>
            <p className="text-muted-foreground">{t.common.noProject}</p>
          </Card>
        )}
      </section>

      {/* ---------- Testemunho ---------- */}
      <section className="space-y-5">
        <SectionTitle
          label={t.admin.testemunhoSection}
          detail={testemunho.projeto ? `${testemunho.projeto.nome} · ${fmtDia(testemunho.projeto.inicio)} – ${fmtDia(testemunho.projeto.fim)}` : t.admin.noTestemunhoProject}
          href="/admin/testemunho"
          linkLabel={t.inicio.seeGuests}
        />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Convidados" value={testemunho.convidados} hint={testemunho.alertas > 0 ? t.admin.alerts(testemunho.alertas) : undefined} />
          {ETAPA_ORDEM.map((etapa) => (
            <Stat key={etapa} label={ETAPA_LABELS[etapa]} value={testemunho.porEtapa[etapa]} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card>
            <Eyebrow className="mb-3">{t.admin.guestsByTeam}</Eyebrow>
            {testemunho.porEquipe.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.testemunho.empty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3 font-semibold">{t.admin.team}</th>
                      <th className="py-2 pr-3 text-right font-semibold">Convidados</th>
                      <th className="py-2 pr-3 text-right font-semibold">{ETAPA_LABELS.sistema1}</th>
                      <th className="py-2 pr-3 text-right font-semibold">{ETAPA_LABELS.jardim}</th>
                      <th className="py-2 text-right font-semibold">{t.testemunho.filterAlert}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {testemunho.porEquipe.map((equipe) => (
                      <tr key={equipe.id}>
                        <td className="py-2.5 pr-3">
                          <span className="font-medium">{equipe.nome}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{equipe.programa}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{equipe.convidados}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{equipe.sistema1}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{equipe.jardim}</td>
                        <td className={`py-2.5 text-right tabular-nums ${equipe.alertas > 0 ? "font-semibold text-coral" : "text-muted-foreground"}`}>{equipe.alertas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <Eyebrow className="mb-3">{t.admin.recentEvents}</Eyebrow>
            {testemunho.recentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.admin.noRecentEvents}</p>
            ) : (
              <ol className="space-y-3">
                {testemunho.recentes.map((item) => {
                  const Icon = TIPO_ICON[item.tipo];
                  return (
                    <li key={item.id} className="flex gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-deep">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 text-sm">
                        <Link href={`/admin/testemunho/${item.convidado.id}`} className="font-medium hover:text-primary">
                          {item.convidado.nome}
                        </Link>
                        <span className="text-muted-foreground"> · {item.texto}</span>
                        <p className="text-xs text-muted-foreground">
                          {fmtDia(item.data)} · {item.autor.nome}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ label, detail, href, linkLabel }: { label: string; detail: string; href: string; linkLabel: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/60 pb-2">
      <div>
        <h2 className="font-display text-2xl font-semibold text-primary-deep">{label}</h2>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      <Link href={href} className="text-sm font-medium text-primary hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}
