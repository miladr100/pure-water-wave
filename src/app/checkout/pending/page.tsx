import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutDonationGate } from "@/components/checkout-donation-gate";
import { CheckoutResult } from "@/components/checkout-result";

export const metadata: Metadata = {
  title: "Pagamento em análise — Água Pura",
  description: "Seu pagamento está sendo processado.",
};

export default function CheckoutPendingPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutDonationGate>
        <CheckoutResult
          variant="pending"
          title="Pagamento em análise"
          description="Recebemos sua doação e o pagamento está sendo processado. Assim que for confirmado, você receberá a confirmação por e-mail."
        />
      </CheckoutDonationGate>
    </Suspense>
  );
}
