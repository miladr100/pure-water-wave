import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      src="/assets/pwlogo.png"
      alt="Água Pura"
      className={cn("rounded-full object-cover", className)}
    />
  );
}
