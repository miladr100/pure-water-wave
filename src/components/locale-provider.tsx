"use client";

import { createContext, useContext, type ReactNode } from "react";

import { getAppMessages, type AppMessages } from "@/lib/i18n/messages";
import type { UserLanguage } from "@/lib/user-languages";

type LocaleContextValue = {
  language: UserLanguage;
  t: AppMessages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  language,
  children,
}: {
  language: UserLanguage;
  children: ReactNode;
}) {
  const value: LocaleContextValue = {
    language,
    t: getAppMessages(language),
  };

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale deve ser usado dentro de LocaleProvider");
  }

  return context;
}
