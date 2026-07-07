import { LogoutButton } from "@/components/logout-button";
import { LibraryPdfCardLoader } from "@/components/library-pdf-card-loader";
import { LibrarySearch } from "@/components/library-search";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { BrandLogo } from "@/components/brand-logo";
import { LIBRARY_PDFS } from "@/lib/library-pdfs";
import type { SessionPayload } from "@/lib/auth";

type LibraryDashboardProps = {
  session: SessionPayload;
};

export function LibraryDashboard({ session }: LibraryDashboardProps) {
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10 w-10" />
            <div>
              <p className="font-display text-xl font-semibold text-primary-deep">
                Biblioteca Água Pura
              </p>
              <p className="text-sm text-muted-foreground">
                Olá, {firstName}. Explore os materiais disponíveis.
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            Sua biblioteca pastoral
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Livros e materiais de formação para apoiar seu ministério com jovens,
            famílias e lideranças.
          </p>
        </section>

        <PwaInstallPrompt />

        <LibrarySearch />

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {LIBRARY_PDFS.map((pdf) => (
            <LibraryPdfCardLoader key={pdf.id} pdf={pdf} />
          ))}
        </section>
      </main>
    </div>
  );
}
