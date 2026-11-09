import type { MetadataRoute } from "next";

// One installable app for every kind of account. It starts at /login,
// which sends a signed-in person to their own home (Painel for members,
// administration for educators, Biblioteca for pastors) and shows the
// form to everyone else.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Água Pura",
    short_name: "Água Pura",
    description:
      "Painel HJ Team, Academia e Biblioteca do movimento Água Pura.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f8fb",
    theme_color: "#1a4d7a",
    lang: "pt-BR",
    categories: ["education", "books"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
