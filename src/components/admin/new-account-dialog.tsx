"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { toastError } from "@/components/admin/helpers";
import { useLocale } from "@/components/academy/locale-provider";
import { FieldError, fieldErrorsOf } from "@/components/academy/profile-shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/academy/api-client";
import { COUNTRIES_MAIN, COUNTRIES_REST } from "@/lib/academy/countries";
import type {
  AccountKind,
  AdminCreateAccountBody,
  AdminCreateAccountResult,
} from "@/lib/academy/types";
import { USER_LANGUAGE_LABELS, USER_LANGUAGES, type UserLanguage } from "@/lib/user-languages";

const KINDS: AccountKind[] = ["pastor", "hjteam", "educador"];

type Props = {
  kind: AccountKind;
  trigger: ReactNode;
  onCreated?: (result: AdminCreateAccountResult) => void;
};

type FormState = {
  kind: AccountKind;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  birthday: string;
  language: UserLanguage;
  churchName: string;
  password: string;
};

function blankForm(kind: AccountKind): FormState {
  return {
    kind,
    fullName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    birthday: "",
    language: "pt",
    churchName: "",
    password: "",
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// One dialog for the three kinds of account the panel creates. The form view
// posts to /api/admin/contas; on success it flips to a result view that shows
// the generated password once, since the server never stores it in clear.
export function NewAccountDialog({ kind, trigger, onCreated }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {/* DialogContent unmounts on close, so every opening starts blank. */}
        <AccountFlow kind={kind} onClose={() => setOpen(false)} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  );
}

function AccountFlow({
  kind,
  onClose,
  onCreated,
}: {
  kind: AccountKind;
  onClose: () => void;
  onCreated?: (result: AdminCreateAccountResult) => void;
}) {
  const [result, setResult] = useState<AdminCreateAccountResult | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (result) {
    return (
      <AccountResult
        result={result}
        onAnother={() => {
          setResult(null);
          setFormKey((current) => current + 1);
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <AccountForm
      key={formKey}
      kind={kind}
      onClose={onClose}
      onCreated={(created) => {
        setResult(created);
        onCreated?.(created);
      }}
    />
  );
}

function AccountForm({
  kind,
  onClose,
  onCreated,
}: {
  kind: AccountKind;
  onClose: () => void;
  onCreated: (result: AdminCreateAccountResult) => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<FormState>(() => blankForm(kind));
  const [errors, setErrors] = useState<Record<string, string>>({});
  // The 409 answer carries a Portuguese sentence; it is shown under the field.
  const [duplicateText, setDuplicateText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPastor = form.kind === "pastor";
  const titleByKind: Record<AccountKind, string> = {
    pastor: t.admin.newPastor,
    hjteam: t.admin.newStudent,
    educador: t.admin.newEducator,
  };

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  // The server answers a code per field; there is no copy per code, so the
  // field is marked and the generic line explains (same as the profile form).
  const fieldMessage = (name: string) => (errors[name] ? t.common.error : undefined);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setDuplicateText(null);
    setBusy(true);

    const body: AdminCreateAccountBody = {
      kind: form.kind,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      country: form.country || undefined,
      city: form.city.trim() || undefined,
      birthday: form.birthday || null,
      language: form.language,
      churchName: isPastor ? form.churchName.trim() || undefined : undefined,
      password: form.password || undefined,
    };

    try {
      const created = await api<AdminCreateAccountResult>("/api/admin/contas", {
        method: "POST",
        body,
      });
      onCreated(created);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const field = error.code === "PHONE_IN_USE" ? "phone" : "email";
        setErrors({ [field]: "in_use" });
        setDuplicateText(error.message || (field === "email" ? t.auth.emailInUse : t.common.error));
        return;
      }
      const fields = fieldErrorsOf(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) {
        toastError(error, t.common.error);
      }
    } finally {
      setBusy(false);
    }
  }

  const duplicateMessage = (name: "email" | "phone") =>
    errors[name] === "in_use" ? (duplicateText ?? t.common.error) : fieldMessage(name);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{titleByKind[form.kind]}</DialogTitle>
        <DialogDescription>{t.admin.kindHint}</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="account-kind">{t.admin.accountKind}</Label>
        <Select
          value={form.kind}
          onValueChange={(value) => set("kind", value as AccountKind)}
          disabled={busy}
        >
          <SelectTrigger id="account-kind" aria-invalid={errors.kind ? true : undefined}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((item) => (
              <SelectItem key={item} value={item}>
                {t.admin.kinds[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={fieldMessage("kind")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="account-name">{t.auth.fullName}</Label>
          <Input
            id="account-name"
            value={form.fullName}
            onChange={(event) => set("fullName", event.target.value)}
            required
            minLength={2}
            disabled={busy}
            autoComplete="off"
            autoFocus
            aria-invalid={errors.fullName ? true : undefined}
          />
          <FieldError message={fieldMessage("fullName")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-email">{t.auth.email}</Label>
          <Input
            id="account-email"
            type="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            required
            disabled={busy}
            autoComplete="off"
            aria-invalid={errors.email ? true : undefined}
          />
          <FieldError message={duplicateMessage("email")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-phone">
            {t.auth.phone}
            {isPastor ? <span aria-hidden="true"> *</span> : null}
          </Label>
          <Input
            id="account-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
            required={isPastor}
            disabled={busy}
            autoComplete="off"
            placeholder="+55 11 99999-9999"
            aria-invalid={errors.phone ? true : undefined}
          />
          {isPastor ? (
            <p className="text-xs text-muted-foreground">{t.admin.phoneRequiredForPastors}</p>
          ) : null}
          <FieldError message={duplicateMessage("phone")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-country">{t.auth.country}</Label>
          <Select
            value={form.country}
            onValueChange={(value) => set("country", value)}
            disabled={busy}
          >
            <SelectTrigger id="account-country" aria-invalid={errors.country ? true : undefined}>
              <SelectValue placeholder={t.auth.selectCountry} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES_MAIN.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
              {COUNTRIES_REST.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldMessage("country")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-city">{t.auth.city}</Label>
          <Input
            id="account-city"
            value={form.city}
            onChange={(event) => set("city", event.target.value)}
            disabled={busy}
            autoComplete="off"
            aria-invalid={errors.city ? true : undefined}
          />
          <FieldError message={fieldMessage("city")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-birthday">{t.profile.birthday}</Label>
          <Input
            id="account-birthday"
            type="date"
            value={form.birthday}
            max={todayIso()}
            onChange={(event) => set("birthday", event.target.value)}
            disabled={busy}
            aria-invalid={errors.birthday ? true : undefined}
          />
          <FieldError message={fieldMessage("birthday")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-language">{t.common.language}</Label>
          <Select
            value={form.language}
            onValueChange={(value) => set("language", value as UserLanguage)}
            disabled={busy}
          >
            <SelectTrigger id="account-language" aria-invalid={errors.language ? true : undefined}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_LANGUAGES.map((item) => (
                <SelectItem key={item} value={item}>
                  {USER_LANGUAGE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldMessage("language")} />
        </div>

        {isPastor ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="account-church">{t.admin.churchName}</Label>
            <Input
              id="account-church"
              value={form.churchName}
              onChange={(event) => set("churchName", event.target.value)}
              disabled={busy}
              autoComplete="off"
              aria-invalid={errors.churchName ? true : undefined}
            />
            <FieldError message={fieldMessage("churchName")} />
          </div>
        ) : null}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="account-password">{t.admin.initialPassword}</Label>
          <Input
            id="account-password"
            type="password"
            value={form.password}
            onChange={(event) => set("password", event.target.value)}
            disabled={busy}
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
          />
          <p className="text-xs text-muted-foreground">{t.admin.initialPasswordHint}</p>
          <FieldError message={fieldMessage("password")} />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={busy || !form.fullName.trim() || !form.email.trim()}>
          {busy ? t.common.saving : t.admin.createAccount}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AccountResult({
  result,
  onAnother,
  onClose,
}: {
  result: AdminCreateAccountResult;
  onAnother: () => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    if (!result.temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopied(true);
      toast.success(t.admin.copied);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.common.error);
    }
  }

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-primary" aria-hidden="true" />
          {t.admin.accountCreated}
        </DialogTitle>
        <DialogDescription>
          <span className="font-medium text-foreground">{result.fullName}</span>
          {" · "}
          {result.email}
          {" · "}
          {t.admin.kinds[result.kind]}
        </DialogDescription>
      </DialogHeader>

      {result.temporaryPassword ? (
        <div className="rounded-2xl border border-primary/30 bg-secondary/60 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-primary-deep">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {t.admin.temporaryPassword}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 select-all break-all rounded-md bg-background px-3 py-2 font-mono text-lg tracking-wide text-foreground">
              {result.temporaryPassword}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyPassword()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t.admin.copied : t.admin.copy}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t.admin.temporaryPasswordHint}</p>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {result.emailed ? t.admin.emailedCredentials : t.admin.notEmailed}
      </p>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onAnother}>
          {t.admin.newAccount}
        </Button>
        <Button type="button" onClick={onClose}>
          {t.common.close}
        </Button>
      </DialogFooter>
    </div>
  );
}
