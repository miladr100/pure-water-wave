"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { Card, Eyebrow, Failed, LoadingBlock } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { refreshEu, usePainelMessages } from "@/components/painel/use-painel";
import { api } from "@/lib/academy/api-client";
import { fmtDia } from "@/lib/hj/dates";
import { MODULO_TESTEMUNHO_MODOS, type ConfiguracoesAdmin, type ModuloTestemunhoModo } from "@/lib/hj/types";
import { cn } from "@/lib/utils";

// Configurações: the testimony module's switch (shown to members while a
// drive runs, always, or hidden). Reminders and integrations come here
// once the group decides them (docs/painel/decisoes-pendentes.md).
export function ConfiguracoesScreen() {
  const t = usePainelMessages();
  const { t: ta } = useLocale();
  const data = useApi<ConfiguracoesAdmin>("/api/admin/hj/configuracoes");
  const [busy, setBusy] = useState(false);

  if (data.error) {
    return <Failed error={data.error} onRetry={data.reload} />;
  }
  if (data.loading || !data.data) {
    return <LoadingBlock />;
  }
  const config = data.data;

  async function setModo(modo: ModuloTestemunhoModo) {
    setBusy(true);
    try {
      await api("/api/admin/hj/configuracoes", { method: "PUT", body: { modulos: { testemunho: modo } } });
      toast.success(t.config.saved);
      data.reload();
      void refreshEu();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PainelHeading title={t.admin.settingsTitle} description={t.config.body} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>{t.config.testemunhoModule}</Eyebrow>
          <Chip tone={config.testemunhoVisivelParaMembros ? "mint" : "muted"}>{config.testemunhoVisivelParaMembros ? t.config.visibleNow : t.config.hiddenNow}</Chip>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {config.projetoTestemunho ? t.config.projectRunning(config.projetoTestemunho.nome, `${fmtDia(config.projetoTestemunho.inicio)} – ${fmtDia(config.projetoTestemunho.fim)}`) : t.admin.noTestemunhoProject}
        </p>
        <div role="radiogroup" aria-label={t.config.testemunhoModule} className="mt-4 grid gap-2 sm:grid-cols-3">
          {MODULO_TESTEMUNHO_MODOS.map((modo) => {
            const active = config.modulos.testemunho === modo;
            return (
              <button
                key={modo}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={busy}
                onClick={() => void setModo(modo)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  active ? "border-primary bg-secondary/60 shadow-sm" : "border-border/60 bg-card hover:border-primary/40",
                )}
              >
                <p className="font-semibold text-primary-deep">{t.config.modos[modo].title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.config.modos[modo].body}</p>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t.config.educatorsAlways}</p>
      </Card>
      <Card>
        <Eyebrow>{t.config.laterTitle}</Eyebrow>
        <p className="mt-1 text-sm text-muted-foreground">{t.admin.settingsBody}</p>
      </Card>
    </div>
  );
}
