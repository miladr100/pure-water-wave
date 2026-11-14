"use client";

import { ArrowLeft, Cake, GraduationCap, Lock, Mail, MapPin, Phone, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { fmtBirthday, fmtDate } from "@/components/academy/format";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { UserAvatar } from "@/components/academy/user-avatar";
import { Card, Eyebrow, Failed, LoadingBlock, Reais } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/academy/api-client";
import type { HjConfidencial, HjPerfil } from "@/lib/hj/perfil";
import { ETAPA_LABELS, ETAPA_ORDEM } from "@/lib/hj/testemunho";
import { HJ_PROGRAMAS, type PessoaDetalhe, type PessoaPatchBody, type ProgramaCatalogo } from "@/lib/hj/types";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type TriState = "" | "sim" | "nao";
const tri = (value: boolean | null): TriState => (value === null ? "" : value ? "sim" : "nao");
const fromTri = (value: TriState): boolean | null => (value === "" ? null : value === "sim");

// One person as the educator sees them: the photo and the basic data on
// top, the HJ Team profile (program, cohort, course, formation), the
// confidential half only educators fill in, and what they did in the
// panel (guests, RM). The academy's own page stays a link away.
export function PessoaScreen({ pessoaId }: { pessoaId: string }) {
  const t = usePainelMessages();
  const { language } = useLocale();
  const detail = useApi<{ pessoa: PessoaDetalhe }>(`/api/admin/hj/pessoas/${pessoaId}`);
  const catalogo = useApi<{ programas: ProgramaCatalogo[] }>("/api/admin/hj/programas");

  if (detail.error) {
    return <Failed error={detail.error} onRetry={detail.reload} />;
  }
  if (detail.loading || !detail.data) {
    return <LoadingBlock />;
  }
  const pessoa = detail.data.pessoa;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link href="/admin/pessoas">
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Link>
      </Button>

      <PainelHeading
        eyebrow={t.admin.peopleTitle}
        title={pessoa.nome}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {pessoa.programa ? <Chip tone="primary">{catalogo.data?.programas.find((p) => p.sigla === pessoa.programa)?.nome ?? pessoa.programa}</Chip> : null}
            {pessoa.turma ? <Chip tone="muted">{pessoa.turma}</Chip> : null}
            {pessoa.papeis.capitao ? <Chip tone="primary">{t.admin.captain}</Chip> : null}
            {pessoa.papeis.educador ? <Chip tone="mint">Educador(a)</Chip> : null}
            {pessoa.resumo ? <span className="text-muted-foreground">{pessoa.resumo}</span> : null}
          </span>
        }
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/admin/alunos/${pessoa.id}`}>
              <GraduationCap className="h-4 w-4" />
              {t.pessoa.academyLink}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <UserAvatar fullName={pessoa.nome} photoUrl={pessoa.fotoUrl} className="h-20 w-20 shadow-soft" textClassName="text-2xl" />
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-display text-xl font-semibold text-primary-deep">{pessoa.nome}</p>
                <p className="text-muted-foreground">{pessoa.idade !== null ? t.pessoa.age(pessoa.idade) : t.pessoa.noAge}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <Fact icon={Mail}>{pessoa.email}</Fact>
              <Fact icon={Phone}>{pessoa.telefone || "—"}</Fact>
              <Fact icon={MapPin}>{[pessoa.pais, pessoa.cidade].filter(Boolean).join(" · ") || "—"}</Fact>
              <Fact icon={Cake}>{pessoa.nascimento ? fmtBirthday(pessoa.nascimento, language) : "—"}</Fact>
              <Fact icon={Users}>
                {pessoa.equipe ? pessoa.equipe.nome : t.common.noTeam}
                {pessoa.educadorResponsavel ? ` · ${pessoa.educadorResponsavel.nome}` : ""}
              </Fact>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Cadastro: {fmtDate(pessoa.criadoEm, language)} · Último acesso: {pessoa.ultimoAcesso ? fmtDate(pessoa.ultimoAcesso, language) : "—"}
            </p>
          </Card>

          <Card>
            <Eyebrow className="mb-3">{t.pessoa.guests}</Eyebrow>
            <p className="font-display text-3xl font-semibold text-primary-deep">{pessoa.convidados.total}</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {ETAPA_ORDEM.map((etapa) => (
                <li key={etapa}>
                  <strong className="text-foreground">{pessoa.convidados.porEtapa[etapa]}</strong> {ETAPA_LABELS[etapa]}
                </li>
              ))}
            </ul>
            {pessoa.rm ? (
              <>
                <Eyebrow className="mb-2 mt-5">{t.pessoa.rmSummary}</Eyebrow>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{pessoa.rm.diasEnviados}</strong> dias enviados · total <Reais cents={pessoa.rm.totalCents} className="font-semibold text-foreground" /> · média{" "}
                  <Reais cents={pessoa.rm.mediaCents} className="font-semibold text-foreground" />
                </p>
              </>
            ) : null}
          </Card>
        </div>

        <PerfilForm key={pessoa.id} pessoa={pessoa} programas={catalogo.data?.programas ?? []} onSaved={() => detail.reload()} />
      </div>
    </div>
  );
}

function Fact({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

function PerfilForm({ pessoa, programas, onSaved }: { pessoa: PessoaDetalhe; programas: ProgramaCatalogo[]; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [perfil, setPerfil] = useState<HjPerfil>(pessoa.perfil);
  const [conf, setConf] = useState<HjConfidencial>(pessoa.confidencial);
  const [anotacoes, setAnotacoes] = useState(pessoa.anotacoes);
  const [busy, setBusy] = useState(false);
  const turmas = programas.find((item) => item.sigla === perfil.programa)?.turmas.filter((item) => item.ativa) ?? [];

  async function save() {
    setBusy(true);
    try {
      const body: PessoaPatchBody = { perfil, confidencial: conf, anotacoes };
      await api(`/api/admin/hj/pessoas/${pessoa.id}`, { method: "PATCH", body });
      toast.success(t.pessoa.saved);
      onSaved();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Card>
        <Eyebrow className="mb-4">{t.pessoa.profileTitle}</Eyebrow>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-programa">{t.pessoa.program}</Label>
            <select
              id="p-programa"
              className={selectClass}
              value={perfil.programa ?? ""}
              onChange={(event) => setPerfil({ ...perfil, programa: (event.target.value || null) as HjPerfil["programa"], turma: "" })}
            >
              <option value="">{t.pessoa.noProgram}</option>
              {HJ_PROGRAMAS.map((sigla) => (
                <option key={sigla} value={sigla}>
                  {programas.find((item) => item.sigla === sigla)?.nome ?? sigla}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-turma">{t.pessoa.cohort}</Label>
            <select id="p-turma" className={selectClass} value={perfil.turma} onChange={(event) => setPerfil({ ...perfil, turma: event.target.value })} disabled={!perfil.programa}>
              <option value="">{t.pessoa.noCohort}</option>
              {turmas.map((item) => (
                <option key={item.nome} value={item.nome}>
                  {item.nome}
                </option>
              ))}
              {perfil.turma && !turmas.some((item) => item.nome === perfil.turma) ? <option value={perfil.turma}>{perfil.turma}</option> : null}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desde">{t.pessoa.memberSince}</Label>
            <Input id="p-desde" type="date" value={perfil.membroDesde ?? ""} onChange={(event) => setPerfil({ ...perfil, membroDesde: event.target.value || null })} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-curso">{t.pessoa.course}</Label>
            <Input id="p-curso" value={perfil.cursoUniversitario} onChange={(event) => setPerfil({ ...perfil, cursoUniversitario: event.target.value })} className="h-10 rounded-xl" maxLength={120} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-formacao">{t.pessoa.formation}</Label>
            <Input id="p-formacao" value={perfil.formacao} onChange={(event) => setPerfil({ ...perfil, formacao: event.target.value })} className="h-10 rounded-xl" maxLength={300} />
          </div>
        </div>
      </Card>

      <Card className="border-primary/30 bg-secondary/40">
        <div className="mb-1 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary-deep" aria-hidden />
          <Eyebrow>{t.pessoa.educatorSection}</Eyebrow>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{t.pessoa.educatorSectionBody}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-cheonbo">{t.pessoa.cheonBo}</Label>
            <select id="c-cheonbo" className={selectClass} value={tri(conf.familiaCheonBo)} onChange={(event) => setConf({ ...conf, familiaCheonBo: fromTri(event.target.value as TriState) })}>
              <option value="">{t.pessoa.unknown}</option>
              <option value="sim">{t.pessoa.yes}</option>
              <option value="nao">{t.pessoa.no}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-2g">{t.pessoa.secondGen}</Label>
            <select id="c-2g" className={selectClass} value={tri(conf.segundaGeracao)} onChange={(event) => setConf({ ...conf, segundaGeracao: fromTri(event.target.value as TriState) })}>
              <option value="">{t.pessoa.unknown}</option>
              <option value="sim">{t.pessoa.yes}</option>
              <option value="nao">{t.pessoa.no}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-pais">{t.pessoa.parents}</Label>
            <Input id="c-pais" value={conf.pais} onChange={(event) => setConf({ ...conf, pais: event.target.value })} className="h-10 rounded-xl" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-esp">{t.pessoa.liberated}</Label>
            <Input
              id="c-esp"
              type="number"
              min={0}
              inputMode="numeric"
              value={conf.espiritosLibertados ?? ""}
              onChange={(event) => setConf({ ...conf, espiritosLibertados: event.target.value === "" ? null : Number(event.target.value) })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="c-padrao">{t.pessoa.faithPattern}</Label>
            <Textarea id="c-padrao" value={conf.padraoVidaFe} onChange={(event) => setConf({ ...conf, padraoVidaFe: event.target.value })} rows={3} className="rounded-xl" maxLength={2000} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="c-notas">{t.pessoa.notes}</Label>
            <Textarea id="c-notas" value={anotacoes} onChange={(event) => setAnotacoes(event.target.value)} rows={4} className="rounded-xl" placeholder={t.pessoa.notesHint} maxLength={5000} />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full" disabled={busy}>
          {busy ? t.common.saving : t.common.save}
        </Button>
      </div>
    </form>
  );
}
