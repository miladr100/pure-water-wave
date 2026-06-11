"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export function CheckoutRetryButton() {
  const searchParams = useSearchParams();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    const externalReference = searchParams.get("external_reference");
    if (!externalReference) {
      setError("Dados da doação não encontrados. Volte ao site e tente novamente.");
      return;
    }

    setIsRetrying(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalReference,
          preferenceId: searchParams.get("preference_id"),
          paymentId: searchParams.get("payment_id"),
        }),
      });

      const json = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Erro ao iniciar pagamento");
      }

      window.location.href = json.url;
    } catch {
      setIsRetrying(false);
      setError("Não foi possível abrir o pagamento. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-full px-8"
        onClick={handleRetry}
        disabled={isRetrying}
      >
        {isRetrying ? "Abrindo..." : "Tentar novamente"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
