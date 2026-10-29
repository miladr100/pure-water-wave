"use client";

import Link from "next/link";
import { FileUp, Plus } from "lucide-react";

import { NewAccountDialog } from "@/components/admin/new-account-dialog";
import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import type { AccountKind } from "@/lib/academy/types";

// The pair of buttons every people list carries on the right of its heading:
// "new <kind>" opening the account dialog, and the CSV import link.
export function AccountActions({ kind, onCreated }: { kind: AccountKind; onCreated: () => void }) {
  const { t } = useLocale();
  const label: Record<AccountKind, string> = {
    pastor: t.admin.newPastor,
    hjteam: t.admin.newStudent,
    educador: t.admin.newEducator,
  };

  return (
    <>
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/admin/contas/importar">
          <FileUp className="h-4 w-4" />
          {t.admin.importCsv}
        </Link>
      </Button>
      <NewAccountDialog
        kind={kind}
        onCreated={onCreated}
        trigger={
          <Button className="rounded-full">
            <Plus className="h-4 w-4" />
            {label[kind]}
          </Button>
        }
      />
    </>
  );
}
