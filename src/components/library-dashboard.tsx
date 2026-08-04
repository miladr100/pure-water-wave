import { LibraryAiCta } from "@/components/library-ai-cta";
import { LibraryHeader } from "@/components/library-header";
import { LibraryPdfCardLoader } from "@/components/library-pdf-card-loader";
import { LibrarySearch } from "@/components/library-search";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { LIBRARY_PDFS } from "@/lib/library-pdfs";
import type { SessionPayload } from "@/lib/auth";

type LibraryDashboardProps = {
  session: SessionPayload;
};

export function LibraryDashboard({ session }: LibraryDashboardProps) {
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <LibraryHeader
        title="Biblioteca Água Pura"
        subtitle={`Olá, ${firstName}. Explore os materiais disponíveis.`}
      />

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

        <LibraryAiCta />
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
