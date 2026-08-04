"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type SupportMaterialsCarouselProps = {
  children: ReactNode;
};

export function SupportMaterialsCarousel({
  children,
}: SupportMaterialsCarouselProps) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: false,
      }}
      className="w-full"
    >
      <div className="relative px-10 sm:px-12">
        <CarouselContent className="-ml-4">{children}</CarouselContent>

        <CarouselPrevious className="left-0 top-1/2 h-10 w-10 -translate-y-1/2 border-border/60 bg-card shadow-sm disabled:opacity-40" />
        <CarouselNext className="right-0 top-1/2 h-10 w-10 -translate-y-1/2 border-border/60 bg-card shadow-sm disabled:opacity-40" />
      </div>
    </Carousel>
  );
}

export function SupportMaterialsCarouselItem({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CarouselItem className="basis-[85%] pl-4 sm:basis-1/2 lg:basis-1/3">
      {children}
    </CarouselItem>
  );
}

export function SupportMaterialsCarouselNavHint() {
  return (
    <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:hidden">
      <ChevronLeft className="h-3.5 w-3.5" />
      Deslize ou use as setas
      <ChevronRight className="h-3.5 w-3.5" />
    </p>
  );
}

export function SupportMaterialsEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
