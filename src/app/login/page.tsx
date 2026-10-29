import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession as getAcademySession } from "@/lib/academy/auth";
import { redirectFor } from "@/lib/academy/session-bridge";
import { getSession, isSystemUserSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Login — Água Pura",
  description: "Acesse a área restrita do movimento Água Pura",
};

export default async function LoginPage() {
  // Already signed in: go where the account belongs (academy accounts also
  // carry a library cookie, so check the academy one first).
  const [session, academySession] = await Promise.all([getSession(), getAcademySession()]);

  if (academySession) {
    redirect(redirectFor(academySession.role));
  }

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
            Acesse sua conta para continuar
          </p>
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="font-display text-2xl">Login</CardTitle>
            <CardDescription>
              Acesso para pastores, HJ Team e educadores do Água Pura.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
