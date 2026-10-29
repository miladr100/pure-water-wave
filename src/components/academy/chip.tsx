import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChipTone = "primary" | "coral" | "mint" | "muted" | "destructive";

const TONES: Record<ChipTone, string> = {
  primary: "bg-primary text-primary-foreground",
  coral: "bg-coral text-coral-foreground",
  mint: "bg-mint text-mint-foreground",
  muted: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

export function Chip({
  tone = "muted",
  className,
  children,
}: {
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
