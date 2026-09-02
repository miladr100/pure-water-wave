import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DivinePrincipleIndexPage } from "@/components/divine-principle-index-page";
import { getSession, isSystemUserSession } from "@/lib/auth";
import {
  getDivinePrinciplePathIds,
  getDivinePrincipleView,
} from "@/lib/divine-principle-index";

type RouteProps = {
  params: Promise<{ path?: string[] }>;
};

export function generateStaticParams() {
  const ids = new Set([
    ...getDivinePrinciplePathIds("pt"),
    ...getDivinePrinciplePathIds("es"),
    ...getDivinePrinciplePathIds("en"),
  ]);

  return [
    { path: [] as string[] },
    ...[...ids].map((id) => ({
      path: id.split("/"),
    })),
  ];
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { path } = await params;
  const session = await getSession();
  const view = getDivinePrincipleView(path, session?.language ?? "pt");

  return {
    title: view
      ? `${view.title} — Biblioteca Água Pura`
      : "Princípio Divino Indexado — Biblioteca Água Pura",
    robots: { index: false, follow: false },
  };
}

export default async function BibliotecaPrincipioDivinoIndexadoPage({
  params,
}: RouteProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isSystemUserSession(session)) {
    redirect("/login");
  }

  const { path } = await params;
  const view = getDivinePrincipleView(path, session.language);

  if (!view) {
    notFound();
  }

  return <DivinePrincipleIndexPage session={session} view={view} />;
}
