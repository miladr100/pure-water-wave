import type { ReactNode } from "react";

import { LocaleProvider as AcademyLocaleProvider } from "@/components/academy/locale-provider";
import { LibraryMemberShell } from "@/components/library-member-shell";
import { LibraryViewerProvider, type LibraryViewer } from "@/components/library-viewer";
import { LocaleProvider } from "@/components/locale-provider";
import { getSession as getAcademySession } from "@/lib/academy/auth";
import { aiChatEnabled } from "@/lib/ai-chat";
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
  const aiChat = aiChatEnabled();

  // Everyone signed in reads the library inside the shared frame (sidebar
  // on the computer, bottom bar on the phone). Members and educators get
  // the area switch; a pastor gets the library's own menus and no switch.
  // Without a session the pages themselves send the visitor to /login.
  const frame = academySession ? (
    <AcademyLocaleProvider language={academySession.language}>
      <LibraryMemberShell session={academySession} aiChat={aiChat}>{children}</LibraryMemberShell>
    </AcademyLocaleProvider>
  ) : session ? (
    <AcademyLocaleProvider language={language}>
      <LibraryMemberShell pastor={{ fullName: session.fullName }} aiChat={aiChat}>{children}</LibraryMemberShell>
    </AcademyLocaleProvider>
  ) : (
    children
  );

  return (
    <LocaleProvider language={language}>
      <LibraryViewerProvider viewer={viewer}>{frame}</LibraryViewerProvider>
    </LocaleProvider>
  );
}
