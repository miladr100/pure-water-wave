"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import type { MeuPerfilHj } from "@/app/api/painel/perfil/route";
import { Failed, LoadingBlock } from "@/components/painel/bits";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/academy/api-client";

// The HJ Team card of the person's own profile: program, cohort, team
// and educator (read-only, the educator keeps them) and the fields the
// person keeps themself. The educator's confidential half is not here,
// by design (Victor, 14/11/2026).
export function PerfilHjSection() {
  const me = useApi<MeuPerfilHj>("/api/painel/perfil");

  if (me.error) {
    return <Failed error={me.error} onRetry={me.reload} />;
  }
  if (me.loading || !me.data) {
    return <LoadingBlock />;
  }
  return <Form key={JSON.stringify(me.data.perfil)} data={me.data} onSaved={() => me.reload()} />;
}

function Form({ data, onSaved }: { data: MeuPerfilHj; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [curso, setCurso] = useState(data.perfil.cursoUniversitario);
  const [formacao, setFormacao] = useState(data.perfil.formacao);
  const [desde, setDesde] = useState(data.perfil.membroDesde ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api("/api/painel/perfil", { method: "PATCH", body: { cursoUniversitario: curso, formacao, membroDesde: desde || null } });
      toast.success(t.pessoa.saved);
      onSaved();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
      <h3 className="font-display text-xl font-semibold text-primary-deep">{t.pessoa.myHjSection}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t.pessoa.myHjBody}</p>
      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.pessoa.program}</dt>
          <dd className="mt-0.5 flex items-center gap-2">
            {data.perfil.programa ? <Chip tone="primary">{data.perfil.programa}</Chip> : null}
            <span>{data.programaNome || t.pessoa.noProgram}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.pessoa.cohort}</dt>
          <dd className="mt-0.5">{data.perfil.turma || t.pessoa.noCohort}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.pessoa.team}</dt>
          <dd className="mt-0.5">{data.equipe ? `${data.equipe.nome}${data.equipe.capitao ? ` · ${t.admin.captain} ${data.equipe.capitao.nome}` : ""}` : t.common.noTeam}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.pessoa.educator}</dt>
          <dd className="mt-0.5">{data.educador?.nome ?? "—"}</dd>
        </div>
      </dl>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="hj-desde">{t.pessoa.memberSince}</Label>
          <Input id="hj-desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} className="h-10 rounded-xl" />
          {data.anosComoMembro !== null ? <p className="text-xs text-muted-foreground">{t.pessoa.memberFor(data.anosComoMembro)}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hj-curso">{t.pessoa.course}</Label>
          <Input id="hj-curso" value={curso} onChange={(event) => setCurso(event.target.value)} className="h-10 rounded-xl" maxLength={120} />
          <p className="text-xs text-muted-foreground">{t.pessoa.courseHint}</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="hj-formacao">{t.pessoa.formation}</Label>
          <Input id="hj-formacao" value={formacao} onChange={(event) => setFormacao(event.target.value)} className="h-10 rounded-xl" maxLength={300} />
          <p className="text-xs text-muted-foreground">{t.pessoa.formationHint}</p>
        </div>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" className="rounded-full" disabled={busy}>
            {busy ? t.common.saving : t.common.save}
          </Button>
        </div>
      </form>
    </section>
  );
}
