import type { Metadata } from "next";

import { CheckoutResult } from "@/components/checkout-result";

export const metadata: Metadata = {
  title: "Pagamento não concluído — Água Pura",
  description: "Não foi possível concluir o pagamento.",
};

export default function CheckoutFailurePage() {
  return (
    <CheckoutResult
      variant="failure"
      title="Pagamento não concluído"
      description="O pagamento foi cancelado ou não pôde ser processado. Você pode tentar novamente quando quiser — sua onda ainda pode começar hoje."
      retryHref="/#doar"
    />
  );
}
