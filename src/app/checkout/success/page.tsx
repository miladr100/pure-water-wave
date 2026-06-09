import type { Metadata } from "next";

import { CheckoutResult } from "@/components/checkout-result";

export const metadata: Metadata = {
  title: "Doação confirmada — Água Pura",
  description: "Obrigado por fazer parte da onda.",
};

export default function CheckoutSuccessPage() {
  return (
    <CheckoutResult
      variant="success"
      title="Obrigado pela doação!"
      description="Seu pagamento foi aprovado. Você faz parte da onda de jovens que transformam o mundo com pureza e propósito."
    />
  );
}
