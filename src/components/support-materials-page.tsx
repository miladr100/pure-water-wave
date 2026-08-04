import {
  SupportDownloadCard,
} from "@/components/support-download-card";
import { SupportVideoCard } from "@/components/support-video-card";
import { LibraryHeader } from "@/components/library-header";
import {
  SupportMaterialsCarousel,
  SupportMaterialsCarouselItem,
  SupportMaterialsCarouselNavHint,
  SupportMaterialsEmpty,
} from "@/components/support-materials-carousel";
import {
  SUPPORT_DOWNLOADS,
  SUPPORT_VIDEOS,
} from "@/lib/support-materials";
import type { SessionPayload } from "@/lib/auth";

type SupportMaterialsPageProps = {
  session: SessionPayload;
};

export function SupportMaterialsPage({ session }: SupportMaterialsPageProps) {
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <LibraryHeader
        title="Material de apoio"
        subtitle={`Olá, ${firstName}. Baixe arquivos e assista aos vídeos.`}
        showSupportMaterialsLink={false}
        showBackToLibrary
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <h1 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">
            Materiais de apoio
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Arquivos para download e vídeos de formação para apoiar seu trabalho pastoral.
          </p>
        </section>

        <section className="mb-14">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-semibold text-primary-deep">
              Materiais para download
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Toque no card para baixar o arquivo.
            </p>
          </div>

          {SUPPORT_DOWNLOADS.length > 0 ? (
            <>
              <SupportMaterialsCarousel>
                {SUPPORT_DOWNLOADS.map((item) => (
                  <SupportMaterialsCarouselItem key={item.id}>
                    <SupportDownloadCard item={item} />
                  </SupportMaterialsCarouselItem>
                ))}
              </SupportMaterialsCarousel>
              <SupportMaterialsCarouselNavHint />
            </>
          ) : (
            <SupportMaterialsEmpty message="Nenhum material para download ainda." />
          )}
        </section>

        <section>
          <div className="mb-5">
            <h2 className="font-display text-2xl font-semibold text-primary-deep">
              Vídeos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Toque no card para abrir o vídeo no YouTube.
            </p>
          </div>

          {SUPPORT_VIDEOS.length > 0 ? (
            <>
              <SupportMaterialsCarousel>
                {SUPPORT_VIDEOS.map((item) => (
                  <SupportMaterialsCarouselItem key={item.id}>
                    <SupportVideoCard item={item} />
                  </SupportMaterialsCarouselItem>
                ))}
              </SupportMaterialsCarousel>
              <SupportMaterialsCarouselNavHint />
            </>
          ) : (
            <SupportMaterialsEmpty message="Nenhum vídeo disponível ainda." />
          )}
        </section>
      </main>
    </div>
  );
}
