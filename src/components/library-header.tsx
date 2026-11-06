"use client";

// The library's header used to live here: logo with the settings menu,
// title, nav buttons, feedback and logout. Every signed-in reader now gets
// the shared frame from src/app/biblioteca/layout.tsx (header with the
// library's menus, sidebar on the computer, bottom bar on the phone), so
// this component draws nothing. It keeps its props so the library pages
// that still mount it compile untouched until they are tidied.
type LibraryHeaderProps = {
  title: string;
  subtitle: string;
  fullName: string;
  showSupportMaterialsLink?: boolean;
  showVideosLink?: boolean;
  showToolsLink?: boolean;
  showBackToLibrary?: boolean;
};

export function LibraryHeader(props: LibraryHeaderProps) {
  void props;
  return null;
}
