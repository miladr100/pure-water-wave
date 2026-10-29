import type { ReactNode } from "react";

import { LibraryViewerProvider, type LibraryViewer } from "@/components/library-viewer";
import { LocaleProvider } from "@/components/locale-provider";
import { getSession as getAcademySession } from "@/lib/academy/auth";
import { getSession } from "@/lib/auth";

export default async function BibliotecaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, academySession] = await Promise.all([getSession(), getAcademySession()]);
  const language = session?.language ?? "pt";
  // An academy account carries a library cookie too (see session-bridge),
  // so the academy session, when present, says who is really here.
  const viewer: LibraryViewer = academySession?.role ?? "pastor";

  return (
    <LocaleProvider language={language}>
      <LibraryViewerProvider viewer={viewer}>{children}</LibraryViewerProvider>
    </LocaleProvider>
  );
}
