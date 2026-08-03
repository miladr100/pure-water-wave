import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LibraryAiCta() {

  const linkIaChat = "https://bot-pw-n8n.duckdns.org/webhook/2ba26011-ad3c-420d-8058-0529cdd65c77/chat"

  return (
    <section className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-secondary/40 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-primary-deep">
              Fale com a IA
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Busque informações dos livros perguntando à nossa IA. Ela responde
              com base nos materiais da biblioteca e indica as fontes.
            </p>
          </div>
        </div>

        <Button asChild className="shrink-0">
          <Link href={linkIaChat} target="_blank">
            <Sparkles className="h-4 w-4" />
            Fale com a IA
          </Link>
        </Button>
      </div>
    </section>
  );
}
