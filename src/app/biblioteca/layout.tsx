import type { ReactNode } from "react";

import { LocaleProvider } from "@/components/locale-provider";
import { getSession } from "@/lib/auth";

export default async function BibliotecaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const language = session?.language ?? "pt";

  return <LocaleProvider language={language}>{children}</LocaleProvider>;
}
