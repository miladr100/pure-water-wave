"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useLocale } from "@/components/academy/locale-provider";
import { PasswordField } from "@/components/academy/password-field";
import { SectionCard } from "@/components/academy/profile-shared";
import { describeError } from "@/components/academy/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api, ApiError } from "@/lib/academy/api-client";
import type { MeProfile } from "@/lib/academy/types";

function ChangeEmailForm({
  profile,
  onSaved,
}: {
  profile: MeProfile;
  onSaved: (email: string) => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const data = await api<{ ok: boolean; email: string }>("/api/academia/auth/email", {
        method: "PATCH",
        body: { newEmail: newEmail.trim(), currentPassword },
      });
      setNewEmail("");
      setCurrentPassword("");
      onSaved(data.email);
      toast.success(t.profile.emailChanged);
      router.refresh();
    } catch (caught) {
      const code = caught instanceof ApiError ? caught.code : undefined;
      setError(code === "EMAIL_IN_USE" ? t.auth.emailInUse : describeError(caught, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-current-email">{t.auth.email}</Label>
        <Input id="profile-current-email" value={profile.email} readOnly disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-new-email">{t.profile.newEmail}</Label>
        <Input
          id="profile-new-email"
          type="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          required
          disabled={busy}
          autoComplete="email"
        />
      </div>
      <PasswordField
        id="profile-email-password"
        label={t.profile.confirmWithPassword}
        autoComplete="current-password"
        value={currentPassword}
        onChange={setCurrentPassword}
        disabled={busy}
        required
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="outline"
          className="rounded-full"
          disabled={busy || !newEmail || !currentPassword}
        >
          {busy ? t.common.saving : t.profile.changeEmail}
        </Button>
      </div>
    </form>
  );
}

// The library's password form, unchanged in behaviour.
function ChangePasswordForm() {
  const { t } = useLocale();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t.settings.passwordsMismatch);
      return;
    }

    setBusy(true);

    try {
      await api<{ ok: boolean }>("/api/academia/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t.settings.passwordUpdated);
    } catch (caught) {
      const text = describeError(caught, t);
      setError(text === t.common.error ? t.settings.passwordFailed : text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium">{t.settings.passwordSection}</p>
      <PasswordField
        id="profile-current-password"
        label={t.settings.currentPassword}
        autoComplete="current-password"
        value={currentPassword}
        onChange={setCurrentPassword}
        disabled={busy}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          id="profile-new-password"
          label={t.settings.newPassword}
          autoComplete="new-password"
          value={newPassword}
          onChange={setNewPassword}
          disabled={busy}
          required
          minLength={6}
        />
        <PasswordField
          id="profile-confirm-password"
          label={t.settings.confirmPassword}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          disabled={busy}
          required
          minLength={6}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" variant="outline" className="rounded-full" disabled={busy}>
          {busy ? t.settings.changingPassword : t.settings.changePassword}
        </Button>
      </div>
    </form>
  );
}

export function ProfileAccount({
  profile,
  onEmailChanged,
}: {
  profile: MeProfile;
  onEmailChanged: (email: string) => void;
}) {
  const { t } = useLocale();

  return (
    <SectionCard title={t.profile.accountSection}>
      <div className="space-y-6">
        <ChangeEmailForm profile={profile} onSaved={onEmailChanged} />
        <Separator />
        <ChangePasswordForm />
      </div>
    </SectionCard>
  );
}
