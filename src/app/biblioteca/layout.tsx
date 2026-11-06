import type { ReactNode } from "react";

import { LocaleProvider as AcademyLocaleProvider } from "@/components/academy/locale-provider";
import { LibraryMemberShell } from "@/components/library-member-shell";
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
      <LibraryViewerProvider viewer={viewer}>
        {academySession ? (
          // Members and educators get the panel's frame around the library;
          // the library's own header steps aside for them (LibraryHeader).
          <AcademyLocaleProvider language={academySession.language}>
            <LibraryMemberShell session={academySession}>{children}</LibraryMemberShell>
          </AcademyLocaleProvider>
        ) : (
          children
        )}
      </LibraryViewerProvider>
    </LocaleProvider>
  );
}
