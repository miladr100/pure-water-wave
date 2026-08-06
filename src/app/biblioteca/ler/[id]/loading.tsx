"use client";

import { Loader2 } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { useLocale } from "@/components/locale-provider";

export default function LerPdfLoading() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-background via-secondary/30 to-background px-6 text-center">
      <BrandLogo className="h-12 w-12 opacity-80" />
      <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden />
      <div>
        <p className="font-display text-lg font-semibold text-primary-deep">
          {t.reader.openingTitle}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.reader.openingDescription}
        </p>
      </div>
    </div>
  );
}
