"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { Card, Failed, LoadingBlock } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/academy/api-client";
import type { ProgramaBody, ProgramaCatalogo } from "@/lib/hj/types";

// Programs and their cohorts (docs/painel/P2 US-P2-01): the administrator
// renames, (de)activates and keeps the cohort lists people are filed under.
export function ProgramasScreen() {
  const t = usePainelMessages();
  const list = useApi<{ programas: ProgramaCatalogo[] }>("/api/admin/hj/programas");

  if (list.error) {
    return <Failed error={list.error} onRetry={list.reload} />;
  }
  if (list.loading || !list.data) {
    return <LoadingBlock />;
  }

  return (
    <div className="space-y-6">
      <PainelHeading eyebrow={t.admin.orgTitle} title={t.pessoa.programsTitle} description={t.pessoa.programsBody} />
      <div className="grid gap-5 md:grid-cols-2">
        {list.data.programas.map((programa) => (
          <ProgramaCard key={`${programa.sigla}:${JSON.stringify(programa)}`} programa={programa} onSaved={() => list.reload()} />
        ))}
      </div>
    </div>
  );
}

function ProgramaCard({ programa, onSaved }: { programa: ProgramaCatalogo; onSaved: () => void }) {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const [nome, setNome] = useState(programa.nome);
  const [ativo, setAtivo] = useState(programa.ativo);
  const [turmas, setTurmas] = useState(programa.turmas);
  const [nova, setNova] = useState("");
  const [busy, setBusy] = useState(false);
  const dirty = nome !== programa.nome || ativo !== programa.ativo || JSON.stringify(turmas) !== JSON.stringify(programa.turmas);

  async function save() {
    setBusy(true);
    try {
      const body: ProgramaBody = { sigla: programa.sigla, nome, ativo, turmas };
      await api("/api/admin/hj/programas", { method: "PUT", body });
      toast.success(t.pessoa.programSaved);
      onSaved();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  function addTurma() {
    const name = nova.trim();
    if (!name || turmas.some((item) => item.nome.toLowerCase() === name.toLowerCase())) {
      return;
    }
    setTurmas([...turmas, { nome: name, ativa: true }]);
    setNova("");
  }

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <Chip tone="primary">{programa.sigla}</Chip>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t.admin.active}</span>
            <Switch checked={ativo} onCheckedChange={setAtivo} aria-label={t.admin.active} />
          </label>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`nome-${programa.sigla}`}>{t.admin.projectName}</Label>
          <Input id={`nome-${programa.sigla}`} value={nome} onChange={(event) => setNome(event.target.value)} className="h-10 rounded-xl" maxLength={60} />
        </div>
        <div className="space-y-2">
          <Label>{t.pessoa.cohorts}</Label>
          <ul className="flex flex-wrap gap-2">
            {turmas.map((turma, index) => (
              <li key={turma.nome} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${turma.ativa ? "border-border bg-card" : "border-dashed text-muted-foreground"}`}>
                <button type="button" className="hover:underline" onClick={() => setTurmas(turmas.map((item, i) => (i === index ? { ...item, ativa: !item.ativa } : item)))} title={turma.ativa ? t.pessoa.inactive : t.admin.active}>
                  {turma.nome}
                  {!turma.ativa ? ` · ${t.pessoa.inactive.toLowerCase()}` : ""}
                </button>
                <button type="button" aria-label={`${t.admin.removeMember} ${turma.nome}`} onClick={() => setTurmas(turmas.filter((_, i) => i !== index))} className="text-muted-foreground hover:text-coral">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              value={nova}
              onChange={(event) => setNova(event.target.value)}
              placeholder={t.pessoa.cohortName}
              aria-label={t.pessoa.cohortName}
              className="h-10 rounded-xl"
              maxLength={60}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTurma();
                }
              }}
            />
            <Button type="button" variant="outline" className="rounded-full" onClick={addTurma}>
              <Plus className="h-4 w-4" />
              {t.pessoa.newCohort}
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full" disabled={busy || !dirty}>
            {busy ? t.common.saving : t.common.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
