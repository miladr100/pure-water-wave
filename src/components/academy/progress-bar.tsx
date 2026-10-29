import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-primary/15", className)}
    >
      <div
        className="h-full rounded-full bg-gradient-cta transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
