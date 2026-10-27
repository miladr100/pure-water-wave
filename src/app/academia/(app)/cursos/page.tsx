import { redirect } from "next/navigation";

import { Catalog } from "@/components/academy/catalog";
import { PageShell } from "@/components/academy/page-shell";
import { getSession } from "@/lib/academy/auth";

export default async function CatalogPage() {
  const session = await getSession();
  if (!session) {
    redirect("/academia/login");
  }

  return (
    <PageShell session={session}>
      <Catalog />
    </PageShell>
  );
}
