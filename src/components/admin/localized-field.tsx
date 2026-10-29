"use client";

import { useLocale } from "@/components/academy/locale-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Localized } from "@/lib/academy/localized";
import { USER_LANGUAGES, type UserLanguage } from "@/lib/user-languages";
import { cn } from "@/lib/utils";

// One field, three languages. Portuguese is the reference text and the only
// required one; a blank translation falls back to it on the student's side.
export function LocalizedField({
  id,
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  required = false,
  disabled = false,
  className,
}: {
  id: string;
  label?: string;
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useLocale();

  const update = (language: UserLanguage, text: string) => onChange({ ...value, [language]: text });

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label htmlFor={`${id}-pt`}>{label}</Label> : null}
      <Tabs defaultValue="pt">
        <TabsList className="h-8">
          {USER_LANGUAGES.map((language) => (
            <TabsTrigger
              key={language}
              value={language}
              className={cn("h-6 px-2 text-xs", !value[language]?.trim() && "text-muted-foreground")}
            >
              {t.admin.languageTabs[language]}
            </TabsTrigger>
          ))}
        </TabsList>
        {USER_LANGUAGES.map((language) => (
          <TabsContent key={language} value={language} className="mt-2">
            {multiline ? (
              <Textarea
                id={`${id}-${language}`}
                value={value[language] ?? ""}
                onChange={(event) => update(language, event.target.value)}
                rows={rows}
                required={required && language === "pt"}
                disabled={disabled}
                aria-label={label ? `${label} (${t.admin.languageTabs[language]})` : undefined}
              />
            ) : (
              <Input
                id={`${id}-${language}`}
                value={value[language] ?? ""}
                onChange={(event) => update(language, event.target.value)}
                required={required && language === "pt"}
                disabled={disabled}
                aria-label={label ? `${label} (${t.admin.languageTabs[language]})` : undefined}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
