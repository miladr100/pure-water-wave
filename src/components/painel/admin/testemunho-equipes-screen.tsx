"use client";

import { AlertTriangle, MessageSquareText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Chip } from "@/components/academy/chip";
import { useApi } from "@/components/academy/use-api";
import { Card, Eyebrow, Failed, LoadingBlock, Stat } from "@/components/painel/bits";
import { OrientacaoDialog, type OrientacaoAlvo } from "@/components/painel/orientacao-dialog";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { fmtDia } from "@/lib/hj/dates";
import type { EquipeTestemunhoRow, TestemunhoEquipes } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

// Testemunho › Equipes: the four indicators Rev. Kim reads for every
// team, "Ponto de atenção" when two of them drift apart, and the last
// orientation the educator gave — so the next conversation starts from
// what was said last time (Yeseong, 14/11/2026).
export function TestemunhoEquipesScreen() {
  const t = usePainelMessages();
  const params = useSearchParams();
  const focus = params.get("equipe");
  const data = useApi<TestemunhoEquipes>("/api/admin/hj/testemunho/equipes");
  const [alvo, setAlvo] = useState<OrientacaoAlvo | null>(null);

  if (data.error) {
    return <Failed error={data.error} onRetry={data.reload} />;
  }
  if (data.loading || !data.data) {
    return <LoadingBlock />;
  }
  const { projeto, equipes, totais } = data.data;

  function Row({ equipe }: { equipe: EquipeTestemunhoRow }) {
    const focused = equipe.id === focus;
    return (
      <li id={`equipe-${equipe.id}`} className={cn("rounded-3xl border bg-card p-4 shadow-card sm:p-5", equipe.atencao ? "border-coral/50" : "border-border/60", focused && "ring-2 ring-primary/40")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-semibold text-primary-deep">{equipe.nome}</p>
              <Chip tone="muted">{equipe.programa}</Chip>
              {equipe.atencao ? (
                <Chip tone="coral">
                  <AlertTriangle className="h-3 w-3" />
                  {t.indicadores.attention}
                </Chip>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {t.admin.captain}: {equipe.capitao?.nome ?? t.admin.noCaptain} · {t.admin.educator}: {equipe.educador?.nome ?? "—"}
              {equipe.area ? ` · ${equipe.area.local.nome}` : ""} · {equipe.membrosComConvidado}/{equipe.membros} {t.missao.membersWithGuest.toLowerCase()}
            </p>
            {equipe.atencao ? <p className="mt-1 text-sm text-coral">{equipe.atencao.texto}</p> : null}
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              [t.missao.guests, equipe.convidados],
              [t.indicadores.kit1, equipe.indicadores.kit1],
              [t.indicadores.fichas, equipe.indicadores.fichas],
              [t.indicadores.kit2, equipe.indicadores.kit2],
              [t.indicadores.jardim, equipe.indicadores.jardim],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl bg-secondary/50 px-2 py-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="font-display text-xl font-semibold text-primary-deep tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-dashed border-border/70 p-3">
          <div className="min-w-0 flex-1 text-sm">
            <Eyebrow>{t.indicadores.lastOrientation}</Eyebrow>
            {equipe.orientacao ? (
              <>
                <p className="mt-1 whitespace-pre-wrap">{equipe.orientacao.texto}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.indicadores.givenBy(equipe.orientacao.autor.nome, fmtDia(equipe.orientacao.data))}</p>
              </>
            ) : (
              <p className="mt-1 text-muted-foreground">{t.indicadores.noOrientation}</p>
            )}
          </div>
          <Button size="sm" variant={equipe.atencao && !equipe.orientacao ? "default" : "outline"} className="rounded-full" onClick={() => setAlvo({ modulo: "testemunho", equipeId: equipe.id, nome: equipe.nome })}>
            <MessageSquareText className="h-4 w-4" />
            {t.indicadores.addOrientation}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <PainelHeading eyebrow={t.nav.testemunho} title={t.indicadores.teamsTitle} description={projeto ? `${projeto.nome} · ${fmtDia(projeto.inicio)} – ${fmtDia(projeto.fim)}` : t.indicadores.teamsBody} />
      <div className="grid gap-3 sm:grid-cols-5">
        <Stat label={t.missao.guests} value={totais.convidados} hint={totais.comAtencao > 0 ? t.indicadores.teamsWithAttention(totais.comAtencao) : undefined} />
        <Stat label={t.indicadores.kit1} value={totais.kit1} />
        <Stat label={t.indicadores.fichas} value={totais.fichas} />
        <Stat label={t.indicadores.kit2} value={totais.kit2} />
        <Stat label={t.indicadores.jardim} value={totais.jardim} />
      </div>
      <Card className="border-coral/30 bg-coral/5">
        <p className="text-sm text-muted-foreground">{t.indicadores.attentionBody}</p>
      </Card>
      {equipes.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">{t.missao.noTeams}</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {equipes.map((equipe) => (
            <Row key={equipe.id} equipe={equipe} />
          ))}
        </ul>
      )}
      <OrientacaoDialog key={alvo ? `${alvo.equipeId}` : "closed"} alvo={alvo} onClose={() => setAlvo(null)} onSaved={() => data.reload()} />
    </div>
  );
}
