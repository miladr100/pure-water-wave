"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "request" | "verify" | "password" | "done";

const RESEND_COOLDOWN_SECONDS = 60;

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (step !== "verify" || secondsLeft <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [step, secondsLeft]);

  async function sendCode() {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = (await response.json()) as {
      error?: string;
      message?: string;
      code?: string;
    };

    if (!response.ok) {
      return {
        ok: false as const,
        error: data.error ?? "Não foi possível enviar o código.",
        notRegistered: data.code === "USER_NOT_FOUND",
      };
    }

    return {
      ok: true as const,
      message: data.message ?? "Enviamos um código para o seu e-mail.",
    };
  }

  async function handleRequestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotRegistered(false);
    setInfo(null);
    setIsLoading(true);

    try {
      const result = await sendCode();

      if (!result.ok) {
        setError(result.error);
        setNotRegistered(result.notRegistered);
        return;
      }

      setInfo(result.message);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setStep("verify");
    } catch {
      setError("Não foi possível enviar o código. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (secondsLeft > 0) {
      return;
    }

    setError(null);
    setNotRegistered(false);
    setIsResending(true);

    try {
      const result = await sendCode();

      if (!result.ok) {
        setError(result.error);
        setNotRegistered(result.notRegistered);
        return;
      }

      setCode("");
      setInfo("Enviamos um novo código para o seu e-mail.");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Não foi possível enviar o código. Tente novamente.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível confirmar o código.");
        return;
      }

      setStep("password");
    } catch {
      setError("Não foi possível confirmar o código. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }

      setStep("done");
    } catch {
      setError("Não foi possível redefinir a senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-foreground">
          Senha alterada com sucesso. Enviamos um e-mail de confirmação. Você já
          pode entrar com a nova senha.
        </p>
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  if (step === "password") {
    return (
      <form onSubmit={handleResetPassword} className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Código confirmado. Defina a nova senha da sua conta.
        </p>

        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 6 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Redefinir senha"}
        </Button>
      </form>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-5">
        {info ? (
          <p className="text-sm text-muted-foreground">{info}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Digite o código de 6 dígitos enviado para o seu e-mail.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isLoading || isResending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Código recebido no e-mail</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            required
            disabled={isLoading || isResending}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isLoading || isResending}
        >
          {isLoading ? "Confirmando..." : "Confirmar código"}
        </Button>

        <div className="space-y-2 text-center">
          {secondsLeft > 0 ? (
            <p className="text-sm tabular-nums text-muted-foreground">
              Enviar novamente em{" "}
              <span className="font-semibold text-foreground">
                {formatCountdown(secondsLeft)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Não recebeu o código?
            </p>
          )}

          <button
            type="button"
            className="w-full text-center text-sm font-medium text-primary hover:underline disabled:pointer-events-none disabled:text-muted-foreground disabled:no-underline"
            onClick={handleResendCode}
            disabled={isLoading || isResending || secondsLeft > 0}
          >
            {isResending ? "Enviando..." : "Enviar novamente"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestCode} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {error ? (
        <div className="space-y-1 text-center" role="alert">
          <p className="text-sm text-destructive">{error}</p>
          {notRegistered ? (
            <Link
              href="/cadastro"
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              Fazer meu cadastro
            </Link>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Enviando..." : "Enviar código"}
      </Button>
    </form>
  );
}
