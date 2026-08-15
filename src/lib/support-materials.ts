import type { UserLanguage } from "@/lib/user-languages";

export type SupportDownload = {
  id: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  fileUrl: string;
  fileLabel: string;
};

export type SupportVideo = {
  id: string;
  title: string;
  subtitle: string;
  youtubeId: string;
};

const SUPPORT_DOWNLOADS_PT: SupportDownload[] = [
  {
    id: "guia-estudo-principio-pt",
    title: "Guia de Estudo do Princípio Divino",
    subtitle: "Material para download (PDF)",
    thumbnailUrl: "/library-previews/guia-estudo-principio-divino-pt.jpg",
    fileUrl: "/api/biblioteca/pdf/guia-estudo-principio-divino-pt",
    fileLabel: "Baixar PDF",
  },
  {
    id: "manual-apoio-videos-ki1-pt",
    title: "Manual Apoio dos Vídeos do Kit 1",
    subtitle: "Material para download (PDF)",
    thumbnailUrl: "/library-previews/manual-apoio-videos-ki1-pt.jpeg",
    fileUrl:
      "https://drive.google.com/file/d/1rKAKBJzrM6pJrOcynncX9fuSkY3Fa6N6/view?usp=sharing",
    fileLabel: "Baixar PDF",
  },
  {
    id: "hj-journal-pt",
    title: "HJ Journal",
    subtitle: "Material para download (PDF)",
    thumbnailUrl: "/library-previews/hj-journal-pt.jpeg",
    fileUrl:
      "https://drive.google.com/file/d/1IfBnTMpNu9YR3DoPp5IfzXnHLau4f3WU/view?usp=sharing",
    fileLabel: "Baixar PDF",
  },
  {
    id: "ficha-de-verificacao-pt",
    title: "Ficha de Verificação AFUPM",
    subtitle: "Material para download (PDF)",
    thumbnailUrl: "/library-previews/ficha-de-verificacao-afupm-pt.jpeg",
    fileUrl:
      "https://drive.google.com/file/d/12RzvHJeAnwJnZf0JuRrjsOKFQwa16ZJJ/view?usp=drive_link",
    fileLabel: "Baixar PDF",
  },
  {
    id: "ficha-de-filiacao-pt",
    title: "Ficha de Filição AFUPM",
    subtitle: "Material para download (PDF)",
    thumbnailUrl: "/library-previews/ficha-de-filiacao-afupm-pt.jpeg",
    fileUrl:
      "https://drive.google.com/file/d/1MhjJp8i76w1x_QbvThuc2RLFfIvRnQw7/view?usp=sharing",
    fileLabel: "Baixar PDF",
  },
];

const SUPPORT_DOWNLOADS_ES: SupportDownload[] = [
  {
    id: "guia-estudio-principio-divino-qa-es",
    title: "Guía de Estudio del Principio Divino (Q&A)",
    subtitle: "Material para descargar",
    thumbnailUrl: "/library-previews/guia-estudio-principio-divino-qa-es.jpeg",
    fileUrl: "https://drive.google.com/file/d/1fBWRqd1OG26ykVnIiKSRCHyH4wK-lH3W/view?usp=sharing",
    fileLabel: "Baixar PDF",
  },
  {
    id: "manual-apoyo-videos-ki1-es",
    title: "Manual de Apoyo de los Videos del Kit 1",
    subtitle: "Material para descargar",
    thumbnailUrl: "/library-previews/manual-apoyo-videos-ki1-es.jpeg",
    fileUrl:
      "https://drive.google.com/file/d/1LcvuEbjP6aAUsQWKD7grmHecjG1V80K6/view?usp=sharing",
    fileLabel: "Baixar PDF",
  },
  {
    id: "hj-journal-es",
    title: "HJ Journal",
    subtitle: "Material para descargar",
    thumbnailUrl: "/library-previews/hj-journal-es.jpeg",
    fileUrl:
      "https://drive.google.com/file/d/1MoALyQAO7g50-bRGtOC4gj6MT8FMlqVu/view?usp=sharing",
    fileLabel: "Baixar PDF",
  },
  {
    id: "ficha-compromiso-es",
    title: "Ficha de Compromiso",
    subtitle: "Material para descargar",
    thumbnailUrl: "/library-previews/ficha-compromiso-es.jpeg",
    fileUrl:
      "https://docs.google.com/document/d/1vhTUVRRuWXw5fJORzBvZk5v4PEUpbzoK/edit?usp=sharing",
    fileLabel: "Abrir documento",
  },
  {
    id: "formulario-registro-membresia-es",
    title: "Formulario de Registro de Membresía",
    subtitle: "Material para descargar",
    thumbnailUrl: "/library-previews/formulario-registro-membresia-es.jpeg",
    fileUrl:
      "https://docs.google.com/document/d/1LNhkvsigRmeAQyA6mm8pGQD19uZ7zU92/edit?usp=sharing",
    fileLabel: "Abrir documento",
  },
];

export function getSupportDownloadsByLanguage(
  language: UserLanguage,
): SupportDownload[] {
  return language === "es" ? SUPPORT_DOWNLOADS_ES : SUPPORT_DOWNLOADS_PT;
}

const SUPPORT_VIDEOS_PT: SupportVideo[] = [
  {
    id: "seminario-01-introducao-pt",
    title: "01 — Introdução geral",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "WNBzectoJPU",
  },
  {
    id: "seminario-02-criacao-pt",
    title: "02 — O Princípio da Criação",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "-fwCMLda1z4",
  },
  {
    id: "seminario-03-queda-pt",
    title: "03 — A Queda do Homem",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "uCIHiJlXyqw",
  },
  {
    id: "seminario-04-escatologia-pt",
    title: "04 — Escatologia",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "vLA-nv_dnM4",
  },
  {
    id: "seminario-05-missao-messias-pt",
    title: "05 — A Missão do Messias",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "9_1Bz3_JTLc",
  },
  {
    id: "seminario-06-ressurreicao-pt",
    title: "06 — Ressurreição",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "e1QOVtz6dCA",
  },
  {
    id: "seminario-07-predestinacao-pt",
    title: "07 — Predestinação",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "HRv9im01yuc",
  },
  {
    id: "seminario-08-cristologia-pt",
    title: "08 — Cristologia",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "3Hxd7yc4LAQ",
  },
  {
    id: "seminario-09-restauracao-pt",
    title: "09 — Princípios da Restauração (Introdução II)",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "7FCeFKcD9a8",
  },
  {
    id: "seminario-10-familia-adao-pt",
    title: "10 — A Família de Adão",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "Rs8jHayliGY",
  },
  {
    id: "seminario-11-familia-noe-pt",
    title: "11 — A Família de Noé",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "EYppiYu0dS4",
  },
  {
    id: "seminario-12-familia-abraao-pt",
    title: "12 — A Família de Abraão",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "dW_MkYRxmow",
  },
  {
    id: "seminario-13-moises-pt",
    title: "13 — A Providência centralizada em Moisés",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "Yah9cPvCmEM",
  },
  {
    id: "seminario-14-jesus-pt",
    title: "14 — A Providência centralizada em Jesus",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "wdg1QMAFws0",
  },
  {
    id: "seminario-15-paralelos-pt",
    title: "15 — Paralelos históricos",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "lMqfkxzWGQg",
  },
  {
    id: "seminario-16-segundo-advento-pt",
    title: "16 — O Segundo Advento",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "pLLQIZzRncM",
  },
];

const SUPPORT_VIDEOS_ES: SupportVideo[] = [
  {
    id: "seminario-01-introducao-es",
    title: "01 — Introducción General",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "QbLgx_qku_A",
  },
  {
    id: "seminario-02-criacao-es",
    title: "02 — Principios de la Creación",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "b2EKnJRqDAQ",
  },
  {
    id: "seminario-03-queda-es",
    title: "03 — Caida del Hombre",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "ZF-LhCP95Ps",
  },
  {
    id: "seminario-04-escatologia-es",
    title: "04 — Consumação da História Humana",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "nrWNfsdhHl8",
  },
  {
    id: "seminario-05-missao-messias-es",
    title: "05 — A missão do Messias",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "W-sJRPuprPE",
  },
  {
    id: "seminario-06-ressurreicao-es",
    title: "06 — Resurrección",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "78_dg5JR5xA",
  },
  {
    id: "seminario-07-predestinacao-es",
    title: "07 — Predestinación",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "FdNqHIshqSU",
  },
  {
    id: "seminario-08-cristologia-es",
    title: "08 — Cristología",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "Q1V1WzOtry4",
  },
  {
    id: "seminario-09-restauracao-es",
    title: "09 — Principios de la Restauración (Introducción II)",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "rHSFruEneOY",
  },
  {
    id: "seminario-10-familia-adao-es",
    title: "10 — La Familia de Adán",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "rK0Q5GbSDKg",
  },
  {
    id: "seminario-11-familia-noe-es",
    title: "11 — La Familia de Noé",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "TFZ87SJYInE",
  },
  {
    id: "seminario-12-familia-abraao-es",
    title: "12 — La Familia de Abraham",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "AsaYaTqQ9AA",
  },
  {
    id: "seminario-13-moises-es",
    title: "13 — La Providencia centrada en Moisés",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "Pkc9aB_Ki14",
  },
  {
    id: "seminario-14-jesus-es",
    title: "14 — La Providencia centrada en Jesús",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "ult4rSBH6Do",
  },
  {
    id: "seminario-15-paralelos-es",
    title: "15 — Paralelos históricos",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "qzkkfOmNv8g",
  },
  {
    id: "seminario-16-segundo-advento-es",
    title: "16 — El Segundo Advenimiento",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "Ff22u-Hu3cg",
  },
];

export function getSupportVideosByLanguage(
  language: UserLanguage,
): SupportVideo[] {
  return language === "es" ? SUPPORT_VIDEOS_ES : SUPPORT_VIDEOS_PT;
}

export function getYoutubeThumbnailUrl(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getYoutubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
