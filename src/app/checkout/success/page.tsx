import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutDonationGate } from "@/components/checkout-donation-gate";
import { CheckoutResult } from "@/components/checkout-result";

export const metadata: Metadata = {
  title: "Doação confirmada — Água Pura",
  description: "Obrigado pela sua contribuição. Sua doação foi recebida com sucesso.",
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutDonationGate>
        <CheckoutResult
          variant="success"
          wide
          title="❤️ Obrigado pela sua contribuição!"
          description={
            <>
              <p className="text-lg font-medium text-foreground">
                Sua doação foi recebida com sucesso.
              </p>
              <div className="mt-6 space-y-4 text-left text-muted-foreground">
                <p>
                  Obrigado por acreditar que o futuro da sociedade começa dentro da família.
                </p>
                <p>
                  Através da sua generosidade, jovens terão acesso a programas de formação,
                  ações sociais, experiências transformadoras e oportunidades para desenvolver
                  liderança, caráter e propósito de vida.
                </p>
                <p>
                  Cada contribuição — seja uma doação única ou um compromisso contínuo — ajuda a
                  fortalecer famílias, transformar comunidades e inspirar uma nova geração a fazer
                  a diferença no mundo.
                </p>
                <p className="font-medium text-foreground">
                  Hoje, você se tornou parte desta onda de transformação.
                </p>
              </div>
            </>
          }
        />
      </CheckoutDonationGate>
    </Suspense>
  );
}
