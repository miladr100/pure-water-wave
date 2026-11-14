"use client";

import { ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";

import { Chip } from "@/components/academy/chip";
import { useApi } from "@/components/academy/use-api";
import { Card, Eyebrow, Failed, LoadingBlock, Stat } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { fmtDia } from "@/lib/hj/dates";
import { ETAPA_LABELS, ETAPA_ORDEM } from "@/lib/hj/testemunho";
import type { TestemunhoNode, TestemunhoResultados } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

// Guests by mission area: the tree região → país → local → equipe with
// the counts at every level, plus the totals by program. The numbers per
// "centro de testemunho" Yeseong asked for; the overview by area for
// Rev. Kim (Milad), 14/11/2026.
export function TestemunhoResultadosScreen() {
  const t = usePainelMessages();
  const data = useApi<TestemunhoResultados>("/api/admin/hj/testemunho/resultados");
  const [open, setOpen] = useState<Set<string> | null>(null);

  if (data.error) {
    return <Failed error={data.error} onRetry={data.reload} />;
  }
  if (data.loading || !data.data) {
    return <LoadingBlock />;
  }
  const { projeto, total, arvore, porPrograma } = data.data;
  const allIds: string[] = [];
  const collect = (node: TestemunhoNode) => {
    allIds.push(node.id);
    node.filhos.forEach(collect);
  };
  arvore.forEach(collect);
  // regions open by default; everything else closed until asked
  const opened = open ?? new Set(arvore.map((node) => node.id));
  const toggle = (id: string) =>
    setOpen(() => {
      const next = new Set(opened);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const rows: { node: TestemunhoNode; depth: number }[] = [];
  const walk = (node: TestemunhoNode, depth: number) => {
    rows.push({ node, depth });
    if (opened.has(node.id)) {
      node.filhos.forEach((child) => walk(child, depth + 1));
    }
  };
  arvore.forEach((node) => walk(node, 0));

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow={t.nav.testemunho}
        title={t.missao.resultsTitle}
        description={projeto ? `${projeto.nome} · ${fmtDia(projeto.inicio)} – ${fmtDia(projeto.fim)}` : t.admin.noTestemunhoProject}
        actions={
          <>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(new Set(allIds))}>
              {t.missao.expandAll}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(new Set())}>
              {t.missao.collapseAll}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={t.missao.guests} value={total.convidados} hint={total.alertas > 0 ? t.admin.alerts(total.alertas) : undefined} />
        {ETAPA_ORDEM.map((etapa) => (
          <Stat key={etapa} label={ETAPA_LABELS[etapa]} value={total.porEtapa[etapa]} />
        ))}
      </div>

      <Card className="p-0 sm:p-0">
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">{t.missao.noTeams}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">{t.missao.regiao} / {t.missao.pais} / {t.missao.local} / {t.missao.equipe}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.missao.guests}</th>
                  <th className="px-3 py-3 text-right font-semibold">{ETAPA_LABELS.pre_gateway}</th>
                  <th className="px-3 py-3 text-right font-semibold">{ETAPA_LABELS.gateway}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.indicadores.kit1}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.indicadores.fichas}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.indicadores.kit2}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.indicadores.jardim}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.missao.membersWithGuest}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map(({ node, depth }) => (
                  <tr key={node.id} className={cn(node.tipo === "regiao" && "bg-secondary/40 font-semibold", node.tipo === "equipe" && "text-muted-foreground")}>
                    <td className="px-4 py-2.5" style={{ paddingLeft: `${depth * 1.25 + 1}rem` }}>
                      <span className="flex items-center gap-1.5">
                        {node.filhos.length > 0 ? (
                          <button type="button" onClick={() => toggle(node.id)} className="rounded-full p-0.5 text-muted-foreground hover:text-primary-deep" aria-label={opened.has(node.id) ? t.missao.collapseAll : t.missao.expandAll}>
                            <ChevronRight className={cn("h-4 w-4 transition-transform", opened.has(node.id) && "rotate-90")} />
                          </button>
                        ) : (
                          <span className="w-5" />
                        )}
                        <span className={cn(node.tipo !== "equipe" && "text-foreground")}>{node.nome}</span>
                        {node.programa ? <Chip tone="muted">{node.programa}</Chip> : null}
                        {node.atencao ? (
                          <span title={node.atencao.texto} className="inline-flex">
                            <Chip tone="coral">{t.indicadores.attention}</Chip>
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">{node.convidados}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{node.porEtapa.pre_gateway}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{node.porEtapa.gateway}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{node.indicadores.kit1}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{node.indicadores.fichas}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{node.indicadores.kit2}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{node.indicadores.jardim}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {node.membrosComConvidado}/{node.membros}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {porPrograma.length > 0 ? (
        <Card>
          <Eyebrow className="mb-3">{t.missao.byProgram}</Eyebrow>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">{t.admin.program}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{t.missao.guests}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{t.indicadores.kit1}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{t.indicadores.fichas}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{t.indicadores.kit2}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{t.indicadores.jardim}</th>
                  <th className="py-2 text-right font-semibold">{t.missao.membersWithGuest}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {porPrograma.map((row) => (
                  <Fragment key={row.programa}>
                    <tr>
                      <td className="py-2.5 pr-3 font-medium">{row.programa}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{row.convidados}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{row.indicadores.kit1}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{row.indicadores.fichas}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{row.indicadores.kit2}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{row.indicadores.jardim}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        {row.membrosComConvidado}/{row.membros}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
