"use client";

import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { useLocale } from "@/components/locale-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  USER_LANGUAGE_LABELS,
  USER_LANGUAGES,
  type UserLanguage,
} from "@/lib/user-languages";
import { cn } from "@/lib/utils";

type LibrarySettingsMenuProps = {
  fullName: string;
  logoClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete,
  required,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required={required}
          minLength={minLength}
          className="pr-10"
        />
        <button
          type="button"
          className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          disabled={disabled}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function LibrarySettingsMenu({
  fullName,
  logoClassName = "h-10 w-10",
  open,
  onOpenChange,
}: LibrarySettingsMenuProps) {
  const router = useRouter();
  const { language, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;

  function setIsOpen(nextOpen: boolean) {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  const [name, setName] = useState(fullName);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);

  useEffect(() => {
    setName(fullName);
  }, [fullName]);

  async function handleSaveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameError(null);
    setNameMessage(null);
    setIsSavingName(true);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });

      const data = (await response.json()) as { error?: string; fullName?: string };

      if (!response.ok) {
        setNameError(data.error ?? t.settings.nameFailed);
        return;
      }

      setName(data.fullName ?? name);
      setNameMessage(t.settings.nameUpdated);
      router.refresh();
    } catch {
      setNameError(t.settings.nameFailed);
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(t.settings.passwordsMismatch);
      return;
    }

    setIsSavingPassword(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setPasswordError(data.error ?? t.settings.passwordFailed);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(t.settings.passwordUpdated);
    } catch {
      setPasswordError(t.settings.passwordFailed);
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleLanguageChange(nextLanguage: UserLanguage) {
    if (nextLanguage === language || isUpdatingLanguage) {
      return;
    }

    setIsUpdatingLanguage(true);

    try {
      const response = await fetch("/api/auth/language", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: nextLanguage }),
      });

      if (!response.ok) {
        throw new Error("Failed to update language");
      }

      router.refresh();
    } finally {
      setIsUpdatingLanguage(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-full border-2 border-transparent p-0.5 transition hover:border-primary hover:shadow-[0_0_0_3px] hover:shadow-primary/25 focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_3px] focus-visible:shadow-primary/25"
          aria-label={t.settings.open}
        >
          <BrandLogo
            className={cn("shrink-0 cursor-pointer", logoClassName)}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.settings.title}</DialogTitle>
          <DialogDescription>{t.settings.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveName} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="settings-name">{t.settings.name}</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              disabled={isSavingName}
            />
          </div>
          {nameError ? (
            <p className="text-sm text-destructive">{nameError}</p>
          ) : null}
          {nameMessage ? (
            <p className="text-sm text-primary">{nameMessage}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSavingName}>
            {isSavingName ? t.settings.saving : t.settings.saveName}
          </Button>
        </form>

        <Separator />

        <form onSubmit={handleChangePassword} className="space-y-3">
          <p className="text-sm font-medium">{t.settings.passwordSection}</p>
          <PasswordField
            id="settings-current-password"
            label={t.settings.currentPassword}
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            disabled={isSavingPassword}
            required
          />
          <PasswordField
            id="settings-new-password"
            label={t.settings.newPassword}
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
            disabled={isSavingPassword}
            required
            minLength={6}
          />
          <PasswordField
            id="settings-confirm-password"
            label={t.settings.confirmPassword}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={isSavingPassword}
            required
            minLength={6}
          />
          {passwordError ? (
            <p className="text-sm text-destructive">{passwordError}</p>
          ) : null}
          {passwordMessage ? (
            <p className="text-sm text-primary">{passwordMessage}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSavingPassword}>
            {isSavingPassword
              ? t.settings.changingPassword
              : t.settings.changePassword}
          </Button>
        </form>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">{t.settings.appearance}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              {t.settings.light}
            </Button>
            <Button
              type="button"
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              {t.settings.dark}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label htmlFor="settings-language">{t.common.language}</Label>
          <Select
            value={language}
            onValueChange={(value) => {
              void handleLanguageChange(value as UserLanguage);
            }}
            disabled={isUpdatingLanguage}
          >
            <SelectTrigger id="settings-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_LANGUAGES.map((option) => (
                <SelectItem key={option} value={option}>
                  {USER_LANGUAGE_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  );
}
