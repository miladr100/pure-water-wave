import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// The library's login/cadastro frame: brand, a line under it, one card.
// The wave background and the hero photo are the site's, so the academy
// feels like a door of purewaterwave.org rather than a separate product.
type AuthShellProps = {
  heading: string;
  tagline: string;
  cardTitle: string;
  cardDescription?: string;
  footer?: ReactNode;
  children: ReactNode;
  wide?: boolean;
};

export function AuthShell({
  heading,
  tagline,
  cardTitle,
  cardDescription,
  footer,
  children,
  wide = false,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-gradient-wave px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-primary/10 to-transparent"
      />
      <div className={wide ? "w-full max-w-lg" : "w-full max-w-md"}>
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-3">
            <BrandLogo className="h-16 w-16 shadow-soft" />
          </Link>
          <p className="font-display text-3xl font-semibold text-primary-deep">{heading}</p>
          <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
        </div>

        <Card className="border-border/60 shadow-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="font-display text-2xl">{cardTitle}</CardTitle>
            {cardDescription ? <CardDescription>{cardDescription}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {footer ? (
          <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
