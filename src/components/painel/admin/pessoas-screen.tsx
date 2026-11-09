"use client";

import { Search, Shield, ShieldOff, UserCheck, UserMinus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/academy/chip";
import { fmtDate } from "@/components/academy/format";
import { useLocale } from "@/components/academy/locale-provider";
import { describeError, useApi } from "@/components/academy/use-api";
import { NewAccountDialog } from "@/components/admin/new-account-dialog";
import { Card, Failed, LoadingBlock } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { refreshEu, usePainelEu, usePainelMessages } from "@/components/painel/use-painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/academy/api-client";
import type { PessoaRow } from "@/lib/hj/types";

type Papel = "membro" | "educador" | "administrador";

// People and their roles in the panel. Members and educators are listed
// for every educator; granting and removing roles is the administrator's.
export function PessoasScreen({ papel }: { papel: Papel }) {
  const t = usePainelMessages();
  const { t: ta, language } = useLocale();
  const eu = usePainelEu();
  const [busca, setBusca] = useState("");
  const list = useApi<{ pessoas: PessoaRow[] }>(`/api/admin/hj/pessoas?papel=${papel}${busca ? `&busca=${encodeURIComponent(busca)}` : ""}`);
  const [busy, setBusy] = useState<string | null>(null);
  const isAdmin = Boolean(eu?.papeis.administrador);

  async function setRole(row: PessoaRow, body: { educador?: boolean; administrador?: boolean }) {
    setBusy(row.id);
    try {
      const reply = await api<{ equipesLiberadas: number }>(`/api/admin/hj/pessoas/${row.id}/papeis`, { method: "POST", body });
      toast.success(reply.equipesLiberadas > 0 ? `${t.admin.rolesSaved} · ${t.admin.teamsReleased(reply.equipesLiberadas)}` : t.admin.rolesSaved);
      list.reload();
      void refreshEu();
    } catch (error) {
      toast.error(describeError(error, ta));
    } finally {
      setBusy(null);
    }
  }

  const title = papel === "membro" ? t.admin.membersTab : papel === "educador" ? t.admin.educatorsTab : t.admin.adminsTab;
  const kind = papel === "membro" ? "hjteam" : "educador";

  return (
    <div className="space-y-6">
      <PainelHeading
        eyebrow={t.admin.peopleTitle}
        title={title}
        description={list.data ? `${list.data.pessoas.length} ${papel === "membro" ? t.admin.members : ""}`.trim() : undefined}
        actions={
          <>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder={t.common.search} className="h-10 rounded-full pl-9" aria-label={t.common.search} />
            </div>
            {papel !== "administrador" ? (
              <NewAccountDialog
                kind={kind}
                trigger={<Button className="rounded-full">{papel === "membro" ? t.admin.newMember : t.admin.newEducator}</Button>}
                onCreated={() => list.reload()}
              />
            ) : null}
            {papel === "membro" ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/admin/contas/importar">{t.admin.importCsv}</Link>
              </Button>
            ) : null}
          </>
        }
      />

      {list.error ? (
        <Failed error={list.error} onRetry={list.reload} />
      ) : list.loading || !list.data ? (
        <LoadingBlock />
      ) : (
        <Card className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">{t.testemunho.name}</th>
                  <th className="px-4 py-3 font-semibold">{t.admin.team}</th>
                  <th className="px-4 py-3 font-semibold">Papéis</th>
                  <th className="px-4 py-3 font-semibold">Último acesso</th>
                  {isAdmin ? <th className="px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {list.data.pessoas.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/alunos/${row.id}`} className="font-medium hover:text-primary">
                        {row.nome}
                      </Link>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.equipe ? `${row.equipe.nome}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1">
                        {row.papeis.capitao ? <Chip tone="primary">Capitã(o)</Chip> : null}
                        {row.papeis.educador ? <Chip tone="mint">Educador(a)</Chip> : null}
                        {row.papeis.administrador ? <Chip tone="coral">Administrador(a)</Chip> : null}
                        {!row.papeis.capitao && !row.papeis.educador ? <Chip tone="muted">Membro</Chip> : null}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.ultimoAcesso ? fmtDate(row.ultimoAcesso, language) : "—"}</td>
                    {isAdmin ? (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1">
                          {row.papeis.educador ? (
                            <Button type="button" size="sm" variant="ghost" className="rounded-full" disabled={busy === row.id || row.id === eu?.id} onClick={() => void setRole(row, { educador: false, administrador: false })}>
                              <UserMinus className="h-4 w-4" />
                              {t.admin.removeEducator}
                            </Button>
                          ) : (
                            <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={busy === row.id} onClick={() => void setRole(row, { educador: true })}>
                              <UserCheck className="h-4 w-4" />
                              {t.admin.makeEducator}
                            </Button>
                          )}
                          {row.papeis.educador ? (
                            row.papeis.administrador ? (
                              <Button type="button" size="sm" variant="ghost" className="rounded-full" disabled={busy === row.id || row.id === eu?.id} onClick={() => void setRole(row, { administrador: false })}>
                                <ShieldOff className="h-4 w-4" />
                                {t.admin.removeAdmin}
                              </Button>
                            ) : (
                              <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={busy === row.id} onClick={() => void setRole(row, { administrador: true })}>
                                <Shield className="h-4 w-4" />
                                {t.admin.makeAdmin}
                              </Button>
                            )
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
