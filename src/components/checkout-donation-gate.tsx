"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CheckoutResult } from "@/components/checkout-result";

type GateState = "loading" | "error" | "ready";

export function CheckoutDonationGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<GateState>("loading");

  useEffect(() => {
    const externalReference = searchParams.get("external_reference");

    if (!externalReference) {
      router.replace("/");
      return;
    }

    const payload = {
      collection_id: searchParams.get("collection_id"),
      collection_status: searchParams.get("collection_status"),
      payment_id: searchParams.get("payment_id"),
      status: searchParams.get("status"),
      external_reference: externalReference,
      payment_type: searchParams.get("payment_type"),
      merchant_order_id: searchParams.get("merchant_order_id"),
      preference_id: searchParams.get("preference_id"),
      site_id: searchParams.get("site_id"),
      processing_mode: searchParams.get("processing_mode"),
      merchant_account_id: searchParams.get("merchant_account_id"),
    };

    async function syncDonation() {
      try {
        const res = await fetch("/api/donations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          setState("error");
          return;
        }

        setState("ready");
      } catch {
        setState("error");
      }
    }

    void syncDonation();
  }, [searchParams, router]);

  if (state === "error") {
    return (
      <CheckoutResult
        variant="failure"
        title="Ops!"
        description="Parece que ocorreu algum erro durante a sua doação, por favor tente novamente."
      />
    );
  }

  if (state === "loading") {
    return null;
  }

  return children;
}
