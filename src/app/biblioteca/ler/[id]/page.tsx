import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PdfViewerLoader } from "@/components/pdf-viewer-loader";
import { getSession, isPastorSession } from "@/lib/auth";
import { getLibraryPdfById } from "@/lib/library-pdfs";

type LerPdfPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
};

export async function generateMetadata({ params }: LerPdfPageProps): Promise<Metadata> {
  const { id } = await params;
  const pdf = getLibraryPdfById(id);

  return {
    title: pdf ? `${pdf.title} — Biblioteca Água Pura` : "Biblioteca — Água Pura",
    robots: { index: false, follow: false },
  };
}

export default async function LerPdfPage({ params, searchParams }: LerPdfPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isPastorSession(session)) {
    redirect("/login");
  }

  const { id } = await params;
  const { page, q } = await searchParams;
  const pdf = getLibraryPdfById(id);

  if (!pdf) {
    notFound();
  }

  const initialPage = page ? Number.parseInt(page, 10) : undefined;
  const initialQuery = q?.trim() || undefined;

  return (
    <PdfViewerLoader
      pdf={pdf}
      session={session}
      initialPage={
        initialPage && Number.isFinite(initialPage) && initialPage > 0
          ? initialPage
          : undefined
      }
      initialQuery={initialQuery}
    />
  );
}
