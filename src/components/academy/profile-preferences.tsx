"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useLocale } from "@/components/academy/locale-provider";
import { SectionCard, patchProfile } from "@/components/academy/profile-shared";
import { describeError } from "@/components/academy/use-api";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { MeProfile } from "@/lib/academy/types";
import { THEME_PREFERENCES, type AppTheme } from "@/lib/theme";
import { USER_LANGUAGE_LABELS, USER_LANGUAGES, type UserLanguage } from "@/lib/user-languages";

const THEME_ICONS: Record<AppTheme, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

export function ProfilePreferences({
  profile,
  onSaved,
}: {
  profile: MeProfile;
  onSaved: (profile: MeProfile) => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [busy, setBusy] = useState<"language" | "theme" | "other" | null>(null);

  const themeLabels: Record<AppTheme, string> = {
    light: t.profile.themeLight,
    dark: t.profile.themeDark,
    system: t.profile.themeSystem,
  };

  async function handleLanguage(language: UserLanguage) {
    if (language === profile.language || busy) {
      return;
    }
    setBusy("language");
    try {
      const data = await patchProfile({ language });
      onSaved(data.profile);
      // The UI copy follows the session, which the server refreshed.
      router.refresh();
    } catch (error) {
      toast.error(describeError(error, t));
    } finally {
      setBusy(null);
    }
  }

  async function handleTheme(next: AppTheme) {
    // The device switches at once; the account remembers it for next time.
    setTheme(next);
    if (next === profile.theme || busy) {
      return;
    }
    setBusy("theme");
    try {
      const data = await patchProfile({ theme: next });
      onSaved(data.profile);
    } catch (error) {
      toast.error(describeError(error, t));
    } finally {
      setBusy(null);
    }
  }

  async function handleOtherLanguage(showOtherLanguage: boolean) {
    if (busy) {
      return;
    }
    setBusy("other");
    try {
      const data = await patchProfile({ showOtherLanguage });
      onSaved(data.profile);
      toast.success(t.profile.saved);
    } catch (error) {
      toast.error(describeError(error, t));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SectionCard title={t.profile.preferencesSection}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="profile-language">{t.common.language}</Label>
          <Select
            value={profile.language}
            onValueChange={(value) => void handleLanguage(value as UserLanguage)}
            disabled={busy === "language"}
          >
            <SelectTrigger id="profile-language" className="sm:max-w-xs">
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

        <div className="space-y-2">
          <p className="text-sm font-medium">{t.profile.theme}</p>
          <div className="grid grid-cols-3 gap-2 sm:max-w-md" role="group" aria-label={t.profile.theme}>
            {THEME_PREFERENCES.map((option) => {
              const Icon = THEME_ICONS[option];
              return (
                <Button
                  key={option}
                  type="button"
                  variant={theme === option ? "default" : "outline"}
                  className="rounded-full"
                  aria-pressed={theme === option}
                  onClick={() => void handleTheme(option)}
                >
                  <Icon className="h-4 w-4" />
                  {themeLabels[option]}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="profile-other-language">{t.profile.otherLanguage}</Label>
            <p className="text-sm text-muted-foreground">{t.profile.otherLanguageHint}</p>
          </div>
          <Switch
            id="profile-other-language"
            checked={profile.showOtherLanguage}
            onCheckedChange={(value) => void handleOtherLanguage(value)}
            disabled={busy === "other"}
            className="mt-1"
          />
        </div>
      </div>
    </SectionCard>
  );
}
