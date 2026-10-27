"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { todayIso } from "@/components/academy/format";
import { useLocale } from "@/components/academy/locale-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES_MAIN, COUNTRIES_REST } from "@/lib/academy/countries";
import { USER_LANGUAGE_LABELS, USER_LANGUAGES, type UserLanguage } from "@/lib/user-languages";

export function RegisterForm() {
  const router = useRouter();
  const { t, language: uiLanguage } = useLocale();
  const { setTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [birthday, setBirthday] = useState("");
  const [language, setLanguage] = useState<UserLanguage>(uiLanguage);
  const [isTutor, setIsTutor] = useState(false);
  const [tutorSecret, setTutorSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordsMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/academia/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone,
          country,
          city,
          birthday: birthday || undefined,
          language,
          tutorSecret: isTutor ? tutorSecret : "",
        }),
      });

      const data = (await response.json()) as { error?: string; code?: string; redirectTo?: string };

      if (!response.ok) {
        setError(data.code === "EMAIL_IN_USE" ? t.auth.emailInUse : (data.error ?? t.common.error));
        return;
      }

      // A new account starts on the device's own theme.
      setTheme("system");
      router.push(data.redirectTo ?? "/academia");
      router.refresh();
    } catch {
      setError(t.common.error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t.auth.fullName}</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} disabled={isLoading} autoComplete="name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} autoComplete="email" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={isLoading} autoComplete="new-password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} disabled={isLoading} autoComplete="new-password" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">{t.auth.country}</Label>
          <Select value={country} onValueChange={setCountry} disabled={isLoading}>
            <SelectTrigger id="country">
              <SelectValue placeholder={t.auth.selectCountry} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES_MAIN.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
              {COUNTRIES_REST.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{t.auth.city}</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} disabled={isLoading} autoComplete="address-level2" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{t.auth.phone}</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} autoComplete="tel" placeholder="+55 11 99999-9999" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthday">{t.profile.birthday}</Label>
          <Input id="birthday" type="date" max={todayIso()} value={birthday} onChange={(e) => setBirthday(e.target.value)} disabled={isLoading} autoComplete="bday" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">{t.common.language}</Label>
        <Select value={language} onValueChange={(value) => setLanguage(value as UserLanguage)} disabled={isLoading}>
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_LANGUAGES.map((item) => (
              <SelectItem key={item} value={item}>{USER_LANGUAGE_LABELS[item]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <Checkbox checked={isTutor} onCheckedChange={(value) => setIsTutor(Boolean(value))} className="mt-0.5" disabled={isLoading} />
        <span>{t.auth.iAmTutor}</span>
      </label>

      {isTutor ? (
        <div className="space-y-2">
          <Label htmlFor="tutorSecret">{t.auth.tutorSecret}</Label>
          <Input id="tutorSecret" value={tutorSecret} onChange={(e) => setTutorSecret(e.target.value)} disabled={isLoading} autoComplete="off" />
          <p className="text-xs text-muted-foreground">{t.auth.tutorSecretHint}</p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full rounded-full" size="lg" disabled={isLoading || !country}>
        {isLoading ? t.auth.creating : t.auth.create}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/academia/login" className="font-medium text-primary hover:underline">
          {t.auth.haveAccount}
        </Link>
      </p>
    </form>
  );
}
