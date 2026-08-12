"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginErrorState =
  | { kind: "message"; text: string }
  | { kind: "not_registered" }
  | null;

export function LoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LoginErrorState>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
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

        setError({
          kind: "message",
          text: data.error ?? "Não foi possível entrar. Tente novamente.",
        });
        return;
      }

      router.push(data.redirectTo ?? "/biblioteca");
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

      {error?.kind === "message" ? (
        <p className="text-sm text-destructive" role="alert">
          {error.text}
        </p>
      ) : null}

      {error?.kind === "not_registered" ? (
        <div className="space-y-1 text-center" role="alert">
          <p className="text-sm text-destructive">
            Este usuário não está cadastrado
          </p>
          <Link
            href="/cadastro"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Fazer meu cadastro
          </Link>
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
