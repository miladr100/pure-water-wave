"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { useLocale } from "@/components/academy/locale-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// A password input with the eye toggle the library's settings dialog had.
export function PasswordField({
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
  const { t } = useLocale();
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
          aria-label={t.auth.password}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
