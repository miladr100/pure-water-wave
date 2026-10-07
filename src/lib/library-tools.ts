export type LibraryTool = {
  id: string;
  href: string;
  icon: "journal" | "hdh" | "videos" | "index" | "pledge";
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
  {
    id: "divine-principle-index",
    href: "/biblioteca/ferramentas/principio-divino-indexado",
    icon: "index",
  },
  {
    id: "family-pledge",
    href: "/biblioteca/ferramentas/juramento-da-familia",
    icon: "pledge",
  },
];
