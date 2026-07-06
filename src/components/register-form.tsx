"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { USER_LANGUAGE_LABELS, USER_LANGUAGES, type UserLanguage } from "@/lib/user-languages";

type RegisterFormProps = {
  onSuccessChange?: (success: boolean) => void;
};

export function CadastroCard() {
  const [success, setSuccess] = useState(false);

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-display text-2xl">Cadastro</CardTitle>
        {!success ? (
          <CardDescription>
            Preencha os dados abaixo. É necessário o segredo de cadastro para
            concluir.
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <RegisterForm onSuccessChange={setSuccess} />
      </CardContent>
    </Card>
  );
}

export function RegisterForm({ onSuccessChange }: RegisterFormProps) {
  const [secret, setSecret] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [churchName, setChurchName] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState<UserLanguage | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    if (!language) {
      setError("Selecione uma língua.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          fullName,
          email,
          password,
          phone,
          churchName,
          country,
          language,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível concluir o cadastro.");
        return;
      }

      setSuccess(true);
      onSuccessChange?.(true);
      setSecret("");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setChurchName("");
      setCountry("");
      setLanguage("");
    } catch {
      setError("Não foi possível concluir o cadastro.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-muted-foreground">
          Cadastro realizado com sucesso. Agora você já pode acessar a plataforma.
        </p>
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="secret">Segredo de cadastro</Label>
        <Input
          id="secret"
          name="secret"
          type="password"
          placeholder="Informe o segredo"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Seu nome completo"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Crie uma senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={6}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone com DDD</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="churchName">Nome da igreja local</Label>
        <Input
          id="churchName"
          name="churchName"
          type="text"
          placeholder="Igreja local"
          value={churchName}
          onChange={(event) => setChurchName(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">País</Label>
        <Input
          id="country"
          name="country"
          type="text"
          placeholder="Brasil"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Língua</Label>
        <Select
          value={language}
          onValueChange={(value) => setLanguage(value as UserLanguage)}
          disabled={isLoading}
          required
        >
          <SelectTrigger id="language">
            <SelectValue placeholder="Selecione a língua" />
          </SelectTrigger>
          <SelectContent>
            {USER_LANGUAGES.map((code) => (
              <SelectItem key={code} value={code}>
                {USER_LANGUAGE_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Cadastrando..." : "Cadastrar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Fazer login
        </Link>
      </p>
    </form>
  );
}
