"use client";

import { createContext, useContext, type ReactNode } from "react";

// Who is looking at the library: a pastor (the library is their whole
// area), an academy student or an educator. The header uses it to offer the
// way back to the academy or the panel, and to keep the library's own
// settings dialog for pastors only (academy accounts manage theirs in the
// academy profile).
export type LibraryViewer = "pastor" | "student" | "tutor";

const LibraryViewerContext = createContext<LibraryViewer>("pastor");

export function LibraryViewerProvider({
  viewer,
  children,
}: {
  viewer: LibraryViewer;
  children: ReactNode;
}) {
  return <LibraryViewerContext.Provider value={viewer}>{children}</LibraryViewerContext.Provider>;
}

export function useLibraryViewer() {
  return useContext(LibraryViewerContext);
}
