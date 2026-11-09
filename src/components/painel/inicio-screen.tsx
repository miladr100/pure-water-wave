"use client";

import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

import { firstNameOf } from "@/components/academy/format";
import { useApi, useMe } from "@/components/academy/use-api";
import { Chip } from "@/components/academy/chip";
import { Card, Eyebrow, Failed, LoadingBlock, Reais } from "@/components/painel/bits";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import type { SessionPayload } from "@/lib/academy/auth";
import { fmtDia } from "@/lib/hj/dates";
import { fmtReais } from "@/lib/hj/rm";
import type { PainelInicio } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

// The member's home: what needs them today, their goal, their guests, the
// team's day for a captain, and the way back into the academy.
export function InicioScreen({ session }: { session: SessionPayload }) {
  const t = usePainelMessages();
  const inicio = useApi<PainelInicio>("/api/painel/inicio");
  const me = useMe();

  if (inicio.error) {
    return <Failed error={inicio.error} onRetry={inicio.reload} />;
  }
  if (inicio.loading || !inicio.data) {
    return <LoadingBlock />;
  }

  const data = inicio.data;
  const { projeto, hoje, rm, equipeHoje, testemunho, membro } = data;
  const relatorio = hoje.relatorio;
  const continueLesson = me?.continueLesson ?? null;

  const todayCard = (() => {
    if (!projeto) {
      return { chip: null, body: t.common.noProject, cta: null };
    }
    if (!data.equipe) {
      return { chip: null, body: t.common.noTeam, cta: null };
    }
    if (hoje.descanso && !relatorio) {
      return { chip: <Chip tone="muted">{t.common.rest}</Chip>, body: t.inicio.restBody, cta: null };
    }
    if (!relatorio) {
      return {
        chip: <Chip tone="coral">{t.inicio.pending}</Chip>,
        body: t.inicio.pendingBody,
        cta: { href: "/painel/arrecadacao", label: t.inicio.fill, primary: true },
      };
    }
    if (relatorio.estado === "devolvido") {
      return {
        chip: <Chip tone="coral">{t.estados.devolvido}</Chip>,
        body: (
          <>
            {t.inicio.returnedBody} <q className="font-medium text-foreground">{relatorio.motivoDevolucao}</q>
          </>
        ),
        cta: { href: `/painel/arrecadacao?dia=${relatorio.data}`, label: t.inicio.fix, primary: true },
      };
    }
    if (relatorio.estado === "validado") {
      return {
        chip: <Chip tone="mint">{t.estados.validado}</Chip>,
        body: (
          <>
            {t.inicio.validatedBody} <Reais cents={relatorio.liquidoCents} className="font-semibold text-foreground" />
          </>
        ),
        cta: { href: "/painel/arrecadacao", label: t.inicio.view, primary: false },
      };
    }
    return {
      chip: <Chip tone="muted">{t.estados.enviado}</Chip>,
      body: (
        <>
          {t.inicio.sentBody} <Reais cents={relatorio.liquidoCents} className="font-semibold text-foreground" />
        </>
      ),
      cta: { href: "/painel/arrecadacao", label: t.inicio.view, primary: false },
    };
  })();

  const maxBar = rm ? Math.max(rm.metaCents, ...rm.ultimos7.map((dia) => dia.liquidoCents ?? 0), 1) : 1;

  return (
    <div className="space-y-6 sm:space-y-8">
      <section>
        <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
          {t.inicio.greeting(firstNameOf(session.fullName))}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {fmtDia(hoje.data, "longo")}
          {projeto ? ` · ${t.common.day(projeto.diaAtual, projeto.totalDias)} do RM` : ""}
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow>
              {t.nav.arrecadacao} · {t.common.today}
            </Eyebrow>
            {todayCard.chip}
          </div>
          <p className="text-[15px] leading-relaxed">{todayCard.body}</p>
          {data.devolvidos.length > 0 ? (
            <div className="rounded-2xl border border-coral/40 bg-coral/10 px-3 py-2 text-sm">
              <p className="font-semibold text-coral">{t.inicio.returnedList(data.devolvidos.length)}</p>
              <ul className="mt-1 space-y-0.5">
                {data.devolvidos.map((row) => (
                  <li key={row.id}>
                    <Link href={`/painel/arrecadacao?dia=${row.data}`} className="text-foreground underline-offset-2 hover:underline">
                      {fmtDia(row.data)}
                    </Link>
                    {row.motivoDevolucao ? <span className="text-muted-foreground"> · {row.motivoDevolucao}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {todayCard.cta ? (
            <Button asChild variant={todayCard.cta.primary ? "default" : "outline"} className="mt-auto self-start rounded-full">
              <Link href={todayCard.cta.href}>
                {todayCard.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </Card>

        {rm ? (
          <Card className="flex flex-col gap-3">
            <Eyebrow>{t.inicio.goal}</Eyebrow>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-display text-3xl font-semibold text-primary-deep tabular-nums">{fmtReais(rm.metaCents)}</p>
              <p className="text-xs text-muted-foreground">{t.inicio.goalHint(fmtReais(rm.mediaCents), fmtReais(rm.recordeCents))}</p>
            </div>
            <div className="grid h-16 grid-cols-7 items-end gap-1.5" aria-label={t.inicio.last7}>
              {rm.ultimos7.map((dia) => {
                const height = dia.liquidoCents == null ? 12 : Math.max(10, Math.round((dia.liquidoCents / maxBar) * 100));
                const isToday = dia.data === hoje.data;
                return (
                  <div
                    key={dia.data}
                    title={`${fmtDia(dia.data)}: ${dia.descanso ? t.common.rest : dia.liquidoCents == null ? "—" : fmtReais(dia.liquidoCents)}`}
                    className={cn(
                      "rounded-t-md",
                      dia.liquidoCents == null
                        ? dia.descanso
                          ? "bg-muted"
                          : "border border-dashed border-border bg-muted/60"
                        : isToday
                          ? "bg-gradient-to-b from-[#009dc9] to-[#0079b9]"
                          : "bg-accent",
                    )}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.inicio.totalProject}</span>
              <Reais cents={rm.totalCents} className="font-bold" />
            </div>
          </Card>
        ) : null}

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow>{t.inicio.testemunho}</Eyebrow>
            {testemunho.atencao.length > 0 ? <Chip tone="coral">{t.inicio.needAttention(testemunho.atencao.length)}</Chip> : null}
          </div>
          <p>
            <strong>{t.inicio.guests(testemunho.total)}</strong>
          </p>
          {testemunho.atencao.length > 0 ? (
            <ul className="space-y-1.5 text-sm">
              {testemunho.atencao.slice(0, 3).map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <Link href={`/painel/testemunho/${item.id}`} className="truncate text-foreground hover:text-primary">
                    {item.nome}
                  </Link>
                  <span className="shrink-0 text-coral">{item.alerta.texto}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <Button asChild variant="outline" className="mt-auto self-start rounded-full">
            <Link href="/painel/testemunho">{t.inicio.seeGuests}</Link>
          </Button>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {continueLesson ? (
          <Link
            href={`/academia/cursos/${continueLesson.courseSlug}/aulas/${continueLesson.lessonId}`}
            className="group grid overflow-hidden rounded-3xl border border-border/60 bg-card text-foreground shadow-card transition hover:-translate-y-0.5 hover:shadow-glow sm:grid-cols-[10rem_minmax(0,1fr)]"
          >
            <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[#00558d] via-[#0083b1] to-[#2bc5c5] sm:h-full">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 text-primary-deep">
                <Play className="h-5 w-5 fill-current" />
              </span>
            </div>
            <div className="flex flex-col gap-1 p-5">
              <Eyebrow>{t.inicio.academyContinue}</Eyebrow>
              <p className="font-display text-lg font-semibold text-primary-deep">
                Aula {continueLesson.lessonNumber} · {continueLesson.lessonTitle}
              </p>
              <p className="text-sm text-muted-foreground">
                {continueLesson.courseTitle} · {Math.round(continueLesson.percent)}%
              </p>
            </div>
          </Link>
        ) : (
          <Link href="/academia" className="flex items-center justify-between gap-4 rounded-3xl border border-border/60 bg-card p-5 text-foreground shadow-card transition hover:-translate-y-0.5">
            <div>
              <Eyebrow>{t.areas.academia}</Eyebrow>
              <p className="mt-1 font-display text-lg font-semibold text-primary-deep">{t.inicio.academyOpen}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
          </Link>
        )}

        {equipeHoje && data.equipe ? (
          <Link href="/painel/equipe" className="flex flex-col gap-1 rounded-3xl border border-border/60 bg-card p-5 text-foreground shadow-card transition hover:-translate-y-0.5">
            <Eyebrow>{data.equipe.nome}</Eyebrow>
            <p className="font-display text-2xl font-semibold text-primary-deep tabular-nums">
              {fmtReais(equipeHoje.liquidoCents)} {t.common.today}
            </p>
            <p className="text-sm text-muted-foreground">
              {t.inicio.teamSent(equipeHoje.enviados, equipeHoje.total)}
              {equipeHoje.pendentes > 0 ? ` · ${t.inicio.teamPending(equipeHoje.pendentes)}` : ""}
              {membro.papeis.capitao ? ` · ${t.equipe.captain.toLowerCase()}: você` : ""}
            </p>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
