"use client";

import { useLocale } from "@/components/academy/locale-provider";
import { LocaleProvider as SiteLocaleProvider } from "@/components/locale-provider";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

// The "Instalar no celular" section inside the academy's profile. The
// section reads the site's own copy, so it gets the site's locale provider
// for the account's language.
export function InstallAppSection() {
  const { language } = useLocale();
  return (
    <SiteLocaleProvider language={language}>
      <PwaInstallPrompt />
    </SiteLocaleProvider>
  );
}
