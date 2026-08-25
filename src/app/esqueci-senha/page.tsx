import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession, isSystemUserSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Esqueci minha senha — Água Pura",
  description: "Redefina a senha da sua conta na Biblioteca Água Pura.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session && isSystemUserSession(session)) {
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
            Redefina sua senha com o código enviado por e-mail
          </p>
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="font-display text-2xl">
              Esqueci minha senha
            </CardTitle>
            <CardDescription>
              Informe o e-mail, confirme o código e defina uma nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground transition">
            Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
