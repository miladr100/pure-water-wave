import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { BibliotecaScreen } from "@/components/painel/admin/biblioteca-screen";
import { isAdministrator } from "@/lib/academy/administrator";
import { getSession } from "@/lib/academy/auth";
import { LIBRARY_PDFS } from "@/lib/library-pdfs";
import { getSupportDownloadsByLanguage, getSupportVideosByLanguage } from "@/lib/support-materials";
import type { UserLanguage } from "@/lib/user-languages";

// Administração › Biblioteca. The content that ships with the code is
// listed read-only beside the items the administrator adds by link.
export default async function AdminBibliotecaPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!(await isAdministrator(session))) {
    notFound();
  }

  const languages: UserLanguage[] = ["pt", "es", "en"];
  const fixos = [
    ...LIBRARY_PDFS.map((pdf) => ({ tipo: "livro" as const, titulo: pdf.title, idioma: pdf.language })),
    ...languages.flatMap((language) =>
      getSupportDownloadsByLanguage(language).map((item) => ({ tipo: "material" as const, titulo: item.title, idioma: language })),
    ),
    ...languages.flatMap((language) =>
      getSupportVideosByLanguage(language).map((item) => ({ tipo: "video" as const, titulo: item.title, idioma: language })),
    ),
  ];

  return (
    <AdminShell session={session}>
      <BibliotecaScreen fixos={fixos} />
    </AdminShell>
  );
}
