"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  USER_LANGUAGE_LABELS,
  USER_LANGUAGES,
  type UserLanguage,
} from "@/lib/user-languages";

export function LanguageSwitcher() {
  const router = useRouter();
  const { language, t } = useLocale();
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleSelect(nextLanguage: UserLanguage) {
    if (nextLanguage === language || isUpdating) {
      return;
    }

    setIsUpdating(true);

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
      setIsUpdating(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={isUpdating}
          aria-label={t.common.language}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">
            {USER_LANGUAGE_LABELS[language]}
          </span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {USER_LANGUAGES.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => {
              void handleSelect(option);
            }}
            className="gap-2"
          >
            <span className="flex-1">{USER_LANGUAGE_LABELS[option]}</span>
            {option === language ? (
              <Check className="h-4 w-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
