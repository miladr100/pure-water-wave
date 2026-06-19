import Link from "next/link";
import type { ReactNode } from "react";

import { CheckoutRetryButton } from "@/components/checkout-retry-button";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CheckoutResultProps = {
  title: string;
  description: ReactNode;
  variant?: "success" | "pending" | "failure";
  retryPayment?: boolean;
  retryHref?: string;
  wide?: boolean;
};

export function CheckoutResult({
  title,
  description,
  retryPayment = false,
  retryHref,
  wide = false,
}: CheckoutResultProps) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-wave">
      <div
        className={cn(
          "w-full rounded-3xl bg-card border border-border p-10 shadow-card text-center",
          wide ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <BrandLogo className="mx-auto h-14 w-14" />
        <h1 className="mt-6 font-display text-3xl sm:text-4xl text-balance">
          {title}
        </h1>
        <div className="mt-4 leading-relaxed">{description}</div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="h-11 rounded-full px-8">
            <Link href="/">Voltar ao site</Link>
          </Button>
          {retryPayment && <CheckoutRetryButton />}
          {!retryPayment && retryHref && (
            <Button asChild variant="outline" className="h-11 rounded-full px-8">
              <Link href={retryHref}>Tentar novamente</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}