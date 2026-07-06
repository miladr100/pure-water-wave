import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CadastroCard } from "@/components/register-form";
import { getSession, isPastorSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Cadastro — Água Pura",
  description: "Cadastre-se no movimento Água Pura.",
  robots: { index: false, follow: false },
};

export default async function CadastroPage() {
  const session = await getSession();

  if (session && isPastorSession(session)) {
    redirect("/biblioteca");
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-b from-background to-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-semibold text-primary-deep">
            Água Pura
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastro de pastores no movimento
          </p>
        </div>

        <CadastroCard />

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">
            Voltar para o site
          </Link>
        </p>
      </div>
    </main>
  );
}
