export type LibraryTool = {
  id: string;
  href: string;
  icon: "journal" | "hdh" | "videos";
};

export const LIBRARY_TOOLS: LibraryTool[] = [
  {
    id: "hj-journal",
    href: "/biblioteca/ferramentas/hj-journal",
    icon: "journal",
  },
  {
    id: "hdh-meditation",
    href: "/biblioteca/ferramentas/hdh-meditacao",
    icon: "hdh",
  },
  {
    id: "video-support-manual",
    href: "/biblioteca/ferramentas/manual-videos",
    icon: "videos",
  },
];
