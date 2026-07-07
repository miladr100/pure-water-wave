"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { getLibraryPdfReaderPath } from "@/lib/library-pdfs";

type LibraryPdfCardLinkProps = {
  pdfId: string;
  children: ReactNode;
};

export function LibraryPdfCardLink({ pdfId, children }: LibraryPdfCardLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const href = getLibraryPdfReaderPath(pdfId);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={isPending}
      className="group relative block h-full"
    >
      {children}

      {isPending ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/85 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm font-medium text-primary-deep">Abrindo livro...</p>
        </div>
      ) : null}
    </Link>
  );
}
