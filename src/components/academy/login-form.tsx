"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useLocale } from "@/components/academy/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginErrorState =
  | { kind: "message"; text: string }
  | { kind: "not_registered" }
  | null;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LoginErrorState>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/academia/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = (await response.json()) as {
        error?: string;
        code?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        if (data.code === "USER_NOT_FOUND") {
          setError({ kind: "not_registered" });
          return;
        }

        setError({ kind: "message", text: data.error ?? t.auth.failed });
        return;
      }

      // `next` is set by the middleware when a protected page bounced here.
      const next = searchParams.get("next");
      const target = next && next.startsWith("/") ? next : (data.redirectTo ?? "/academia");
      router.push(target);
      router.refresh();
    } catch {
      setError({ kind: "message", text: t.auth.failed });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login">{t.auth.email}</Label>
        <Input
          id="login"
          name="login"
          type="email"
          autoComplete="username"
          placeholder="seu@email.com"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {error?.kind === "message" ? (
        <p className="text-sm text-destructive" role="alert">
          {error.text}
        </p>
      ) : null}

      {error?.kind === "not_registered" ? (
        <div className="space-y-1 text-center" role="alert">
          <p className="text-sm text-destructive">{t.auth.notRegistered}</p>
          <Link href="/academia/cadastro" className="inline-block text-sm font-medium text-primary hover:underline">
            {t.auth.register}
          </Link>
        </div>
      ) : null}

      <Button type="submit" className="w-full rounded-full" size="lg" disabled={isLoading}>
        {isLoading ? t.auth.entering : t.auth.enter}
      </Button>

      <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
        <Link href="/academia/esqueci-senha" className="font-medium text-primary hover:underline">
          {t.auth.forgot}
        </Link>
        <Link href="/academia/cadastro" className="hover:text-foreground">
          {t.auth.register}
        </Link>
      </div>
    </form>
  );
}
