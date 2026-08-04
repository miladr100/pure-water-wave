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

export const SUPPORT_DOWNLOADS: SupportDownload[] = [
  {
    id: "guia-estudo-principio",
    title: "Guia de Estudo do Princípio Divino",
    subtitle: "Material para download (PDF)",
    thumbnailUrl: "/library-previews/guia-estudo-principio-divino-pt.jpg",
    fileUrl: "/api/biblioteca/pdf/guia-estudo-principio-divino-pt",
    fileLabel: "Baixar PDF",
  },
  {
    id: "manual-auxiliar-videos-ki1",
    title: "Manual Auxiliar para o Kit 1",
    subtitle: "Material para download (PDF)",
    thumbnailUrl: "/library-previews/manual-auxiliar-videos-ki1-pt.jpeg",
    fileUrl: "https://drive.google.com/file/d/12RzvHJeAnwJnZf0JuRrjsOKFQwa16ZJJ/view?usp=sharing",
    fileLabel: "Baixar PDF",
  },
  {
    id: "ficha-de-verificacao",
    title: "Ficha de Verificação AFUPM-2023",
    subtitle: "Material para download (PDF)",
    thumbnailUrl: "/library-previews/ficha-de-verificacao-afupm-pt.jpeg",
    fileUrl: "https://drive.google.com/file/d/12RzvHJeAnwJnZf0JuRrjsOKFQwa16ZJJ/view?usp=drive_link",
    fileLabel: "Baixar PDF",
  },
  {
    id: "ficha-de-filiacao",
    title: "Ficha de Filição AFUPM-2023",
    subtitle: "Material para download (PDF)",
    thumbnailUrl: "/library-previews/ficha-de-filiacao-afupm-pt.jpeg",
    fileUrl: "https://drive.google.com/file/d/1MhjJp8i76w1x_QbvThuc2RLFfIvRnQw7/view?usp=sharing",
    fileLabel: "Baixar PDF",
  },
];

export const SUPPORT_VIDEOS: SupportVideo[] = [
  {
    id: "seminario-01-introducao",
    title: "01 — Introdução geral",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "WNBzectoJPU",
  },
  {
    id: "seminario-02-criacao",
    title: "02 — O Princípio da Criação",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "-fwCMLda1z4",
  },
  {
    id: "seminario-03-queda",
    title: "03 — A Queda do Homem",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "uCIHiJlXyqw",
  },
  {
    id: "seminario-04-escatologia",
    title: "04 — Escatologia",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "vLA-nv_dnM4",
  },
  {
    id: "seminario-05-missao-messias",
    title: "05 — A Missão do Messias",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "9_1Bz3_JTLc",
  },
  {
    id: "seminario-06-ressurreicao",
    title: "06 — Ressurreição",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "e1QOVtz6dCA",
  },
  {
    id: "seminario-07-predestinacao",
    title: "07 — Predestinação",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "HRv9im01yuc",
  },
  {
    id: "seminario-08-cristologia",
    title: "08 — Cristologia",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "3Hxd7yc4LAQ",
  },
  {
    id: "seminario-09-restauracao",
    title: "09 — Princípios da Restauração (Introdução II)",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "7FCeFKcD9a8",
  },
  {
    id: "seminario-10-familia-adao",
    title: "10 — A Família de Adão",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "Rs8jHayliGY",
  },
  {
    id: "seminario-11-familia-noe",
    title: "11 — A Família de Noé",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "EYppiYu0dS4",
  },
  {
    id: "seminario-12-familia-abraao",
    title: "12 — A Família de Abraão",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "dW_MkYRxmow",
  },
  {
    id: "seminario-13-moises",
    title: "13 — A Providência centralizada em Moisés",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "Yah9cPvCmEM",
  },
  {
    id: "seminario-14-jesus",
    title: "14 — A Providência centralizada em Jesus",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "wdg1QMAFws0",
  },
  {
    id: "seminario-15-paralelos",
    title: "15 — Paralelos históricos",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "lMqfkxzWGQg",
  },
  {
    id: "seminario-16-segundo-advento",
    title: "16 — O Segundo Advento",
    subtitle: "Seminário de 7 dias — Princípio Divino",
    youtubeId: "pLLQIZzRncM",
  },
];

export function getYoutubeThumbnailUrl(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getYoutubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
