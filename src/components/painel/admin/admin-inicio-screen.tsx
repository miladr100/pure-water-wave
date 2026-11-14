"use client";

import { Check, FileSignature, HandCoins, Heart, MessageCircle, StickyNote, Trophy, Users, Waves } from "lucide-react";
import Link from "next/link";

import { useApi } from "@/components/academy/use-api";
import { Chip } from "@/components/academy/chip";
import { Bar, Card, Eyebrow, Failed, LoadingBlock, Reais, Stat } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { fmtDia } from "@/lib/hj/dates";
import { fmtReais, pct } from "@/lib/hj/rm";
import type { AcontecimentoTipo, AdminHjInicio } from "@/lib/hj/types";

// "46,1%" — a share, written the Brazilian way
const parte = (value: number, total: number) => `${String(pct(value, total)).replace(".", ",")}%`;

const TIPO_ICON: Record<AcontecimentoTipo, typeof Heart> = {
  contato: MessageCircle,
  gateway: Waves,
  conferencia: Heart,
  ficha: FileSignature,
  etapa: Check,
  nota: StickyNote,
};

// The educator's and administrator's home: the course's general numbers
// in cards — people, per program, boys and girls, average age, who
// stands out in the RM and in the testimony drive — then one line per
// project running today. The fundraising tables moved to Restauração
// Material › Resultados (Yeseong, 14/11/2026).
export function AdminInicioScreen() {
  const t = usePainelMessages();
  const home = useApi<AdminHjInicio>("/api/admin/hj/inicio");

  if (home.error) {
    return <Failed error={home.error} onRetry={home.reload} />;
  }
  if (home.loading || !home.data) {
    return <LoadingBlock />;
  }

  const { projeto, totais, geral, testemunho } = home.data;
  const hoje = projeto?.hoje ?? testemunho.projeto?.hoje ?? null;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PainelHeading title={t.admin.homeTitle} description={hoje ? fmtDia(hoje, "longo") : undefined} />

      {/* ---------- Dados gerais do curso ---------- */}
      <section className="space-y-4">
        <SectionTitle icon={Users} label={t.admin.generalTitle} detail={t.admin.people(geral.pessoas)} href="/admin/pessoas" linkLabel={t.nav.pessoas} />
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
          <Stat
            label={t.admin.timeHj}
            value={geral.pessoas}
            hint={`${geral.meninos} ${t.admin.boys.toLowerCase()} · ${geral.meninas} ${t.admin.girls.toLowerCase()}${geral.semGenero > 0 ? ` · ${t.admin.noGender(geral.semGenero)}` : ""}`}
            className="border-primary/30 bg-secondary/40"
          />
          {geral.porPrograma.map((programa) => (
            <Stat
              key={programa.programa}
              label={programa.nome}
              value={programa.pessoas}
              hint={
                <Link href={`/admin/pessoas?programa=${programa.programa}`} className="hover:underline">
                  {programa.programa} · {parte(programa.pessoas, geral.pessoas)} {t.admin.ofTimeHj}
                </Link>
              }
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label={t.admin.boys} value={geral.meninos} hint={geral.pessoas > 0 ? parte(geral.meninos, geral.pessoas) : undefined} />
          <Stat label={t.admin.girls} value={geral.meninas} hint={geral.pessoas > 0 ? parte(geral.meninas, geral.pessoas) : undefined} />
          <Stat label={t.admin.avgAge} value={geral.idadeMedia !== null ? t.admin.years(geral.idadeMedia) : "—"} hint={geral.comIdade > 0 ? t.admin.withBirthday(geral.comIdade) : undefined} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Eyebrow>{t.admin.rmHighlights}</Eyebrow>
              <Link href="/admin/arrecadacao" className="text-sm font-medium text-primary hover:underline">
                {t.admin.resultsTab} →
              </Link>
            </div>
            {geral.destaquesRm.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.admin.noHighlights}</p>
            ) : (
              <ol className="space-y-2.5">
                {geral.destaquesRm.map((item, index) => (
                  <Destaque key={item.membro.id} index={index} nome={item.membro.nome} href={`/admin/pessoas/${item.membro.id}`} detail={item.equipe} value={<Reais cents={item.totalCents} className="font-semibold text-primary-deep" />} />
                ))}
              </ol>
            )}
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Eyebrow>{t.admin.testemunhoHighlights}</Eyebrow>
              <Link href="/admin/testemunho/equipes" className="text-sm font-medium text-primary hover:underline">
                {t.nav.equipes} →
              </Link>
            </div>
            {geral.destaquesTestemunho.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.admin.noHighlights}</p>
            ) : (
              <ol className="space-y-2.5">
                {geral.destaquesTestemunho.map((item, index) => (
                  <Destaque key={item.membro.id} index={index} nome={item.membro.nome} href={`/admin/pessoas/${item.membro.id}`} detail={item.equipe ?? ""} value={<span className="text-sm font-semibold text-primary-deep">{t.admin.guestsOf(item.convidados, item.jardim)}</span>} />
                ))}
              </ol>
            )}
          </Card>
        </div>
      </section>

      {/* ---------- Projetos em andamento ---------- */}
      <section className="space-y-4">
        <SectionTitle label={t.admin.projectsToday} detail={projeto || testemunho.projeto ? "" : t.common.noProject} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary-deep">
                  <HandCoins className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-primary-deep">{t.areas.rm}</p>
                  <p className="text-xs text-muted-foreground">{projeto ? `${projeto.nome} · ${t.common.day(projeto.diaAtual, projeto.totalDias)}` : t.common.noProject}</p>
                </div>
              </div>
              <Link href="/admin/arrecadacao" className="text-sm font-medium text-primary hover:underline">
                {t.admin.resultsTab} →
              </Link>
            </div>
            {projeto ? (
              <>
                <p className="mt-3 font-display text-3xl font-semibold text-primary-deep tabular-nums">{fmtReais(totais.liquidoCents)}</p>
                <p className="text-sm text-muted-foreground">
                  {t.admin.ofGoal(fmtReais(totais.metaCents))} · {pct(totais.liquidoCents, totais.metaCents)}% · {totais.enviadosHoje}/{totais.membros} {t.admin.sentToday}
                  {totais.pendentesValidacao > 0 ? (
                    <>
                      {" · "}
                      <Link href="/admin/arrecadacao?aba=relatorios" className="text-primary hover:underline">
                        {totais.pendentesValidacao} {t.admin.pendingValidation}
                      </Link>
                    </>
                  ) : null}
                </p>
                <Bar value={totais.liquidoCents} max={totais.metaCents} className="mt-3" />
              </>
            ) : null}
          </Card>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary-deep">
                  <Heart className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-primary-deep">{t.areas.testemunho}</p>
                  <p className="text-xs text-muted-foreground">{testemunho.projeto ? `${testemunho.projeto.nome} · ${fmtDia(testemunho.projeto.inicio)} – ${fmtDia(testemunho.projeto.fim)}` : t.admin.noTestemunhoProject}</p>
                </div>
              </div>
              <Link href="/admin/testemunho/equipes" className="text-sm font-medium text-primary hover:underline">
                {t.nav.equipes} →
              </Link>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-primary-deep tabular-nums">
              {testemunho.convidados} <span className="font-sans text-base font-normal text-muted-foreground">{t.missao.guests.toLowerCase()}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                {t.indicadores.kit1} <strong className="text-foreground">{testemunho.porEquipe.reduce((sum, equipe) => sum + equipe.indicadores.kit1, 0)}</strong>
              </span>
              <span>
                {t.indicadores.fichas} <strong className="text-foreground">{testemunho.porEquipe.reduce((sum, equipe) => sum + equipe.indicadores.fichas, 0)}</strong>
              </span>
              <span>
                {t.indicadores.kit2} <strong className="text-foreground">{testemunho.porEquipe.reduce((sum, equipe) => sum + equipe.indicadores.kit2, 0)}</strong>
              </span>
              <span>
                {t.indicadores.jardim} <strong className="text-foreground">{testemunho.porEquipe.reduce((sum, equipe) => sum + equipe.indicadores.jardim, 0)}</strong>
              </span>
              {testemunho.comAtencao > 0 ? (
                <Link href="/admin/testemunho/equipes" className="inline-flex">
                  <Chip tone="coral">{t.admin.teamsWithAttention(testemunho.comAtencao)}</Chip>
                </Link>
              ) : null}
            </div>
          </Card>
        </div>

        <Card>
          <Eyebrow className="mb-3">{t.admin.recentEvents}</Eyebrow>
          {testemunho.recentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.admin.noRecentEvents}</p>
          ) : (
            <ol className="grid gap-3 sm:grid-cols-2">
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
      </section>
    </div>
  );
}

function Destaque({ index, nome, href, detail, value }: { index: number; nome: string; href: string; detail: string; value: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className={index === 0 ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary-deep"}>
        {index === 0 ? <Trophy className="h-3.5 w-3.5" /> : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <Link href={href} className="font-medium hover:text-primary">
          {nome}
        </Link>
        {detail ? <p className="truncate text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      {value}
    </li>
  );
}

function SectionTitle({ icon: Icon, label, detail, href, linkLabel }: { icon?: typeof Users; label: string; detail: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/60 pb-2">
      <div>
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-primary-deep">
          {Icon ? <Icon className="h-5 w-5" /> : null}
          {label}
        </h2>
        {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}
