import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/academy/auth-shell";
import { LocaleProvider } from "@/components/academy/locale-provider";
import { RegisterForm } from "@/components/academy/register-form";
import { getSession, isAcademySession } from "@/lib/academy/auth";
import { getAppMessages } from "@/lib/i18n/academy-messages";
import { detectLanguage } from "@/lib/academy/detect-language";

export const metadata: Metadata = {
  title: "Cadastro — Academia Água Pura",
  description: "Crie sua conta na Academia Água Pura.",
  robots: { index: false, follow: false },
};

export default async function CadastroPage() {
  const session = await getSession();

  if (session && isAcademySession(session)) {
    redirect(session.role === "tutor" ? "/admin" : "/academia");
  }

  const language = await detectLanguage();
  const t = getAppMessages(language);

  return (
    <LocaleProvider language={language}>
      <AuthShell
        heading={t.header.academyTitle}
        tagline={t.auth.registerDescription}
        cardTitle={t.auth.registerTitle}
        wide
        footer={
          <Link href="/" className="transition hover:text-foreground">
            {t.auth.backToSite}
          </Link>
        }
      >
        <RegisterForm />
      </AuthShell>
    </LocaleProvider>
  );
}
