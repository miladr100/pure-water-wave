"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAppTheme } from "@/lib/theme";

type LoginErrorState = { kind: "message"; text: string } | null;

// The site's one Login. The academy's endpoint recognises every account
// (library and academy) and says where the person belongs: pastors go to
// the library, HJ Team members to the academy, educators to the panel.
// Accounts are created by the educators in the panel, so there is no
// sign-up link here.
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTheme } = useTheme();
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
        user?: { theme?: string };
      };

      if (!response.ok) {
        setError({
          kind: "message",
          text:
            data.code === "USER_NOT_FOUND"
              ? "Este usuário não está cadastrado. Fale com a equipe Água Pura."
              : (data.error ?? "Não foi possível entrar. Tente novamente."),
        });
        return;
      }

      // The academy stores the person's theme; adopt it before moving on.
      if (isAppTheme(data.user?.theme)) {
        setTheme(data.user.theme);
      }

      // A protected page that bounced here says where to go back to.
      const next = searchParams.get("next");
      const target = next && next.startsWith("/") ? next : (data.redirectTo ?? "/biblioteca");
      router.push(target);
      router.refresh();
    } catch {
      setError({
        kind: "message",
        text: "Não foi possível entrar. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login">E-mail</Label>
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
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error.text}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/esqueci-senha"
          className="font-medium text-primary hover:underline"
        >
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}
