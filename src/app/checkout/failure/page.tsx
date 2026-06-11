import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutDonationGate } from "@/components/checkout-donation-gate";
import { CheckoutResult } from "@/components/checkout-result";

export const metadata: Metadata = {
  title: "Pagamento não concluído — Água Pura",
  description: "Não foi possível concluir o pagamento.",
};

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={null}>
      <CheckoutDonationGate>
        <CheckoutResult
          variant="failure"
          title="Pagamento não concluído"
          description="O pagamento foi cancelado ou não pôde ser processado. Você pode tentar novamente quando quiser — sua onda ainda pode começar hoje."
          retryPayment
        />
      </CheckoutDonationGate>
    </Suspense>
  );
}
