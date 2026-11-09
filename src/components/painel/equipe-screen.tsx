"use client";

import { useState } from "react";

import { useApi } from "@/components/academy/use-api";
import { Card, EstadoChip, Eyebrow, Failed, LoadingBlock, Reais } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { RelatorioLinha } from "@/components/painel/validacao";
import { fmtDia } from "@/lib/hj/dates";
import type { EquipePainel, RelatorioRow } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

// The captain's team: who sent today, what waits for validation, and each
// member's numbers in the project.
export function EquipeScreen() {
  const t = usePainelMessages();
  const team = useApi<EquipePainel>("/api/painel/equipe");
  const [tab, setTab] = useState<"hoje" | "historico">("hoje");

  if (team.error) {
    return (
      <>
        <PainelHeading title={t.equipe.title} />
        {team.error.status === 404 ? (
          <Card>{team.error.code === "NOT_CAPTAIN" ? t.equipe.notCaptain : t.common.noTeam}</Card>
        ) : (
          <Failed error={team.error} onRetry={team.reload} />
        )}
      </>
    );
  }
  if (team.loading || !team.data) {
    return <LoadingBlock />;
  }

  const { equipe, projeto, hoje, membros, pendentes, historico, totalHojeCents, podeValidar } = team.data;
  const enviados = membros.filter((membro) => membro.hoje && membro.hoje.estado !== "devolvido").length;

  function onChanged(row: RelatorioRow) {
    void row;
    team.reload();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PainelHeading
        eyebrow={`${projeto.nome} · ${t.common.day(projeto.diaAtual, projeto.totalDias)}`}
        title={equipe.nome}
        description={[
          equipe.capitao ? `${t.equipe.captain}: ${equipe.capitao.nome}` : null,
          equipe.educador ? `${t.equipe.educator}: ${equipe.educador.nome}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <div className="inline-flex rounded-full bg-muted p-0.5">
            {(["hoje", "historico"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn(
                  "h-9 rounded-full px-4 text-[13px] font-semibold text-muted-foreground",
                  tab === item && "bg-card text-primary-deep shadow-sm",
                )}
              >
                {item === "hoje" ? t.equipe.membersToday : t.equipe.history}
              </button>
            ))}
          </div>
        }
      />

      {tab === "hoje" ? (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <Card>
              <Eyebrow>{t.equipe.totalToday}</Eyebrow>
              <p className="mt-1 font-display text-3xl font-semibold text-primary-deep tabular-nums">
                <Reais cents={totalHojeCents} />
              </p>
              <p className="text-sm text-muted-foreground">{t.inicio.teamSent(enviados, membros.length)} · {fmtDia(hoje)}</p>
            </Card>
            <Card className="md:col-span-2">
              <Eyebrow className="mb-2">{t.equipe.pending}</Eyebrow>
              {pendentes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.equipe.noPending}</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {pendentes.map((row) => (
                    <RelatorioLinha key={row.id} row={row} canValidate={podeValidar[row.id] ?? false} onChanged={onChanged} />
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <Eyebrow className="mb-3">{t.equipe.membersToday}</Eyebrow>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">{t.admin.membersLabel}</th>
                    <th className="py-2 pr-3 font-semibold">{t.common.today}</th>
                    <th className="py-2 pr-3 text-right font-semibold">{t.equipe.meta}</th>
                    <th className="py-2 pr-3 text-right font-semibold">{t.equipe.media}</th>
                    <th className="py-2 text-right font-semibold">{t.equipe.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {membros.map((membro) => (
                    <tr key={membro.id}>
                      <td className="py-2.5 pr-3">
                        <span className="font-medium">{membro.nome}</span>
                        {membro.capitao ? <span className="ml-2 text-xs text-muted-foreground">{t.equipe.captain.toLowerCase()}</span> : null}
                      </td>
                      <td className="py-2.5 pr-3">
                        {membro.hoje ? (
                          <span className="flex items-center gap-2">
                            <Reais cents={membro.hoje.liquidoCents} className="font-semibold" />
                            <EstadoChip estado={membro.hoje.estado} />
                          </span>
                        ) : (
                          <span className="text-coral">{t.equipe.notSent}</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <Reais cents={membro.metaCents} />
                      </td>
                      <td className="py-2.5 pr-3 text-right text-muted-foreground">
                        <Reais cents={membro.mediaCents} />
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        <Reais cents={membro.totalCents} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <Eyebrow className="mb-2">{t.equipe.history}</Eyebrow>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.relatorio.noHistory}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {historico.map((row) => (
                <RelatorioLinha key={row.id} row={row} canValidate={podeValidar[row.id] ?? false} onChanged={onChanged} />
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
