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
    title: "09 — Introducción II — Principios de la Restauración",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "rd5WKAoJlRo",
  },
  {
    id: "seminario-10-familia-adao-es",
    title: "10 — Providência da Restauração — Centrada na Família de Adão",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "o7uuSLBjMh8",
  },
  {
    id: "seminario-11-familia-noe-es",
    title: "11 — Providencia de la Restauración — Centrada en la Familia de Noé",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "baSebczWrjw",
  },
  {
    id: "seminario-12-familia-abraao-es",
    title: "12 — Providencia de la Restauración — Centrada en la Familia de Abraham",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "dks15dQKXJE",
  },
  {
    id: "seminario-13-moises-es",
    title: "13 — Providencia de la Restauración — Centrada en Moisés",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "xlVr42sc5DA",
  },
  {
    id: "seminario-14-jesus-es",
    title: "14 — Providencia de la Restauración — Centrada en Jesús",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "NxMEj4l7wK8",
  },
  {
    id: "seminario-15-paralelos-es",
    title: "15 — Ciclos Históricos",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "8WPlkmWjleo",
  },
  {
    id: "seminario-16-segundo-advento-es",
    title: "16 — Segunda Llegada",
    subtitle: "Seminario de 7 días — Principio Divino",
    youtubeId: "jX_V-vzP_Vk",
  },
];

const SUPPORT_VIDEOS_ES_SUBREGION_2: SupportVideo[] = [
  {
    id: "seminario-sr2-01-introduccion",
    title: "01 — Introducción General",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "G-Yq-VT67oc",
  },
  {
    id: "seminario-sr2-02-creacion",
    title: "02 — Principios de la Creación",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "gZzz8jpBqzY",
  },
  {
    id: "seminario-sr2-03-caida",
    title: "03 — La Caída Humana",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "rqgI8hyBYBU",
  },
  {
    id: "seminario-sr2-04-consumacion-pt1",
    title: "04 — La Consumación de la Historia Humana (Parte 1)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "VNs11b_odgw",
  },
  {
    id: "seminario-sr2-04-consumacion-pt2",
    title: "04 — La Consumación de la Historia Humana (Parte 2)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "IUV8ed9lUjo",
  },
  {
    id: "seminario-sr2-05-mesias",
    title: "05 — La Misión del Mesías",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "VQpeZ5XCfk0",
  },
  {
    id: "seminario-sr2-06-resurreccion",
    title: "06 — La Resurrección",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "cP3vql91NN0",
  },
  {
    id: "seminario-sr2-07-predestinacion",
    title: "07 — La Predestinación",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "P7hF5S4--UY",
  },
  {
    id: "seminario-sr2-08-cristologia",
    title: "08 — Cristología",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "jz052rWRDLo",
  },
  {
    id: "seminario-sr2-09-intro-restauracion",
    title: "09 — Introducción a los Principios de la Restauración",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "zx1ANqAqpqU",
  },
  {
    id: "seminario-sr2-10-familia-adan",
    title: "10 — La Providencia de la Restauración Centrada en la Familia de Adán",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "v-KKUlRepFE",
  },
  {
    id: "seminario-sr2-11-familia-noe",
    title: "11 — La Providencia de la Restauración Centrada en la Familia de Noé",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "zvG463UOkdM",
  },
  {
    id: "seminario-sr2-12-familia-abraham",
    title: "12 — La Providencia de la Restauración Centrada en la Familia de Abraham",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "BaH5aAA8fIM",
  },
  {
    id: "seminario-sr2-13-moises-pt1",
    title: "13 — La Providencia de la Restauración Centrada en Moisés (Parte 1)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "7suRkic1_fw",
  },
  {
    id: "seminario-sr2-13-moises-pt2",
    title: "13 — La Providencia de la Restauración Centrada en Moisés (Parte 2)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "qT1KdEeR2j4",
  },
  {
    id: "seminario-sr2-13-moises-pt3",
    title: "13 — La Providencia de la Restauración Centrada en Moisés (Parte 3)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "Se5UOTKkYsc",
  },
  {
    id: "seminario-sr2-14-jesus-pt1",
    title: "14 — La Providencia de la Restauración Centrada en Jesús (Parte 1)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "gnFhOYLBJ4k",
  },
  {
    id: "seminario-sr2-14-jesus-pt2",
    title: "14 — La Providencia de la Restauración Centrada en Jesús (Parte 2)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "ZJ0Hm8zSa28",
  },
  {
    id: "seminario-sr2-15-ciclos-pt1",
    title: "15 — Ciclos Históricos (Parte 1)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "8qfAgCBYzdI",
  },
  {
    id: "seminario-sr2-15-ciclos-pt2",
    title: "15 — Ciclos Históricos (Parte 2)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "tois1ltq0kI",
  },
  {
    id: "seminario-sr2-15-ciclos-pt3",
    title: "15 — Ciclos Históricos (Parte 3)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "nWuwyJLo2Qo",
  },
  {
    id: "seminario-sr2-15-ciclos-pt4",
    title: "15 — Ciclos Históricos (Parte 4)",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "Tt9N5XJvE3M",
  },
  {
    id: "seminario-sr2-16-segunda-llegada",
    title: "16 — La segunda llegada",
    subtitle: "Subregión 2 — Principio Divino",
    youtubeId: "MA6FUqLQw94",
  },
];

type LocalizedSupportVideo = {
  id: string;
  youtubeId: string;
  titles: Record<UserLanguage, string>;
};

const TESTIMONIAL_SUBTITLES: Record<UserLanguage, string> = {
  pt: "Testemunhos sobre Restauração Material",
  es: "Testimonios sobre Restauración Material",
  en: "Testimonies on Fundraising",
};

const SUPPORT_TESTIMONIAL_VIDEOS: LocalizedSupportVideo[] = [
  {
    id: "testemunho-rm-01-henrry-valencia",
    youtubeId: "Fw9XpXh3ZCg",
    titles: {
      pt: "01 — Henrry Valencia | Experiência com a Segunda Geração",
      es: "01 — Henrry Valencia | Experiencia con la Segunda Generación",
      en: "01 — Henrry Valencia | Experience with the Second Generation",
    },
  },
  {
    id: "testemunho-rm-02-juliana-de-cesero",
    youtubeId: "AX4FRdksSls",
    titles: {
      pt: "02 — Juliana de Césero | Desafios da Restauração Material na Europa",
      es: "02 — Juliana de Césero | Desafíos de la Restauración Material en Europa",
      en: "02 — Juliana de Césero | Challenges of Fundraising in Europe",
    },
  },
  {
    id: "testemunho-rm-03-sofia-mijin-correa",
    youtubeId: "9RMPkhfWHcU",
    titles: {
      pt: "03 — Sofia Mijin Correa | Deus me transformou através da Restauração Material",
      es: "03 — Sofia Mijin Correa | Dios me transformó a través de la Restauración Material",
      en: "03 — Sofia Mijin Correa | God transformed me through Fundraising",
    },
  },
  {
    id: "testemunho-rm-04-nari-tamar-alegre",
    youtubeId: "-U6_SFXl6uY",
    titles: {
      pt: "04 — Nari Tamar Alegre | O receio da missão e a superação com Deus",
      es: "04 — Nari Tamar Alegre | El temor de la misión y la superación con Dios",
      en: "04 — Nari Tamar Alegre | Fear of the mission and overcoming it with God",
    },
  },
  {
    id: "testemunho-rm-05-alice-cunha",
    youtubeId: "dZyeLsv_dys",
    titles: {
      pt: "05 — Alice Cunha | Experiência com o coração de Deus na RM na Europa",
      es: "05 — Alice Cunha | Experiencia con el corazón de Dios en la RM en Europa",
      en: "05 — Alice Cunha | Experience with God's heart in Fundraising in Europe",
    },
  },
  {
    id: "testemunho-rm-06-ki-sung",
    youtubeId: "6Oh6WBCbYEg",
    titles: {
      pt: "06 — Ki Sung | Restauração Material nos EUA",
      es: "06 — Ki Sung | Restauración Material en los EE. UU.",
      en: "06 — Ki Sung | Fundraising in the USA",
    },
  },
  {
    id: "testemunho-rm-07-azucena-de-lora",
    youtubeId: "maQSJR2YYRQ",
    titles: {
      pt: "07 — Azucena de Lora | Minha transformação através da Restauração Material",
      es: "07 — Azucena de Lora | Mi transformación a través de la Restauración Material",
      en: "07 — Azucena de Lora | My transformation through Fundraising",
    },
  },
];

export function getSupportTestimonialVideos(
  language: UserLanguage,
): SupportVideo[] {
  return localizeSupportVideos(
    SUPPORT_TESTIMONIAL_VIDEOS,
    language,
    TESTIMONIAL_SUBTITLES[language],
  );
}

const FAITH_TESTIMONIAL_SUBTITLES: Record<UserLanguage, string> = {
  pt: "Testemunhos sobre Vida de Fé",
  es: "Testimonios sobre Vida de Fe",
  en: "Testimonies on the Life of Faith",
};

const SUPPORT_FAITH_TESTIMONIAL_VIDEOS: LocalizedSupportVideo[] = [
  {
    id: "testemunho-fe-01-takuya-uchino",
    youtubeId: "-VllizJCywU",
    titles: {
      pt: "01 — Takuya Uchino | Mudança de Paradigma",
      es: "01 — Takuya Uchino | Cambio de Paradigma",
      en: "01 — Takuya Uchino | Paradigm Shift",
    },
  },
  {
    id: "testemunho-fe-02-hwail-rober",
    youtubeId: "fHFrWOznt8Q",
    titles: {
      pt: "02 — Hwail Rober | A decisão para fazer curso de vida de fé",
      es: "02 — Hwail Rober | La decisión de hacer el curso de vida de fe",
      en: "02 — Hwail Rober | The decision to take the life of faith course",
    },
  },
  {
    id: "testemunho-fe-03-edison-alexander-hiciano",
    youtubeId: "Tgyju0VkobM",
    titles: {
      pt: "03 — Edison Alexander Hiciano | O antes e depois de conhecer o Princípio Divino",
      es: "03 — Edison Alexander Hiciano | El antes y después de conocer el Principio Divino",
      en: "03 — Edison Alexander Hiciano | Before and after knowing the Divine Principle",
    },
  },
  {
    id: "testemunho-fe-04-sandy-ji-bun",
    youtubeId: "bPuPCmL-egY",
    titles: {
      pt: "04 — Sandy Ji Bun | A transformação na relação com a minha família",
      es: "04 — Sandy Ji Bun | La transformación en la relación con mi familia",
      en: "04 — Sandy Ji Bun | The transformation in my relationship with my family",
    },
  },
  {
    id: "testemunho-fe-05-evelin-agostina",
    youtubeId: "8jsBFnhL5OQ",
    titles: {
      pt: "05 — Evelin Agostina | A batalha contra minhas naturezas decaídas",
      es: "05 — Evelin Agostina | La batalla contra mis naturalezas caídas",
      en: "05 — Evelin Agostina | The battle against my fallen natures",
    },
  },
  {
    id: "testemunho-fe-06-michiaki-yamane",
    youtubeId: "L1sMQZz0p6w",
    titles: {
      pt: "06 — Michiaki Yamane | Porque eu vim para a Academia HJ?",
      es: "06 — Michiaki Yamane | ¿Por qué vine a la Academia HJ?",
      en: "06 — Michiaki Yamane | Why did I come to HJ Academy?",
    },
  },
  {
    id: "testemunho-fe-07-giovany-esteban",
    youtubeId: "adp1c5LVxuE",
    titles: {
      pt: "07 — Giovany Esteban | Deus respondeu como devo seguir minha vida",
      es: "07 — Giovany Esteban | Dios respondió cómo debo seguir mi vida",
      en: "07 — Giovany Esteban | God answered how I should follow my life",
    },
  },
  {
    id: "testemunho-fe-08-leslie-rosario",
    youtubeId: "M7vIzyb3qw4",
    titles: {
      pt: "08 — Leslie Rosário | Minha vitória no HJ Rang",
      es: "08 — Leslie Rosário | Mi victoria en el HJ Rang",
      en: "08 — Leslie Rosário | My victory at HJ Rang",
    },
  },
  {
    id: "testemunho-fe-09-felipe-arturo",
    youtubeId: "ZU0Ol6-R2Zk",
    titles: {
      pt: "09 — Felipe Arturo | Mudança de planos",
      es: "09 — Felipe Arturo | Cambio de planes",
      en: "09 — Felipe Arturo | Change of plans",
    },
  },
  {
    id: "testemunho-fe-10-alberto-sebastian",
    youtubeId: "egWqlpjDWU4",
    titles: {
      pt: "10 — Alberto Sebastian | Deus transformou minha vida de fé",
      es: "10 — Alberto Sebastian | Dios transformó mi vida de fe",
      en: "10 — Alberto Sebastian | God transformed my life of faith",
    },
  },
  {
    id: "testemunho-fe-11-aracely-pamela-ticona",
    youtubeId: "ISJe9K8SLIU",
    titles: {
      pt: "11 — Aracely Pamela Ticona | Pedi “Deus por favor não me abandone”",
      es: "11 — Aracely Pamela Ticona | Pedí “Dios, por favor, no me abandones”",
      en: "11 — Aracely Pamela Ticona | I asked, “God, please do not abandon me”",
    },
  },
  {
    id: "testemunho-fe-12-juan-sebastian",
    youtubeId: "1Ff74BFux5w",
    titles: {
      pt: "12 — Juan Sebastian | Experiências no curso da Água Pura",
      es: "12 — Juan Sebastian | Experiencias en el curso de Agua Pura",
      en: "12 — Juan Sebastian | Experiences in the Pure Water course",
    },
  },
  {
    id: "testemunho-fe-13-nestor-angel",
    youtubeId: "3XuSuzR7T7c",
    titles: {
      pt: "13 — Néstor Angel | Meu caminho até a Academia HJ",
      es: "13 — Néstor Angel | Mi camino hasta la Academia HJ",
      en: "13 — Néstor Angel | My path to HJ Academy",
    },
  },
  {
    id: "testemunho-fe-14-wan-song-rocha",
    youtubeId: "jW6wqK_dk2Q",
    titles: {
      pt: "14 — Wan Song Rocha | A busca pelo coração de piedade filial para Deus",
      es: "14 — Wan Song Rocha | La búsqueda del corazón de piedad filial hacia Dios",
      en: "14 — Wan Song Rocha | The search for a heart of filial piety toward God",
    },
  },
  {
    id: "testemunho-fe-15-nicolle-bezerra",
    youtubeId: "wW8rO_OKNNU",
    titles: {
      pt: "15 — Nicolle Bezerra | Encontro de coração com a Verdadeira Mãe",
      es: "15 — Nicolle Bezerra | Encuentro de corazón con la Verdadera Madre",
      en: "15 — Nicolle Bezerra | A heart-to-heart encounter with True Mother",
    },
  },
  {
    id: "testemunho-fe-16-jesus-daniel",
    youtubeId: "oQJHrDMbMpE",
    titles: {
      pt: "16 — Jesus Daniel | Construí determinação em meio às provações",
      es: "16 — Jesus Daniel | Construí determinación en medio de las pruebas",
      en: "16 — Jesus Daniel | I built determination amid trials",
    },
  },
  {
    id: "testemunho-fe-17-melany-fernanda",
    youtubeId: "GPKm8uFm2MI",
    titles: {
      pt: "17 — Melany Fernanda | Decidi entregar toda minha vida à Deus",
      es: "17 — Melany Fernanda | Decidí entregar toda mi vida a Dios",
      en: "17 — Melany Fernanda | I decided to give my whole life to God",
    },
  },
  {
    id: "testemunho-fe-18-evelin-wendy",
    youtubeId: "X8GmFrNpFc0",
    titles: {
      pt: "18 — Evelin Wendy | Fé é seguir em frente mesmo sem entender tudo",
      es: "18 — Evelin Wendy | La fe es seguir adelante incluso sin entenderlo todo",
      en: "18 — Evelin Wendy | Faith is moving forward even without understanding everything",
    },
  },
  {
    id: "testemunho-fe-19-song-sha",
    youtubeId: "RE9_rZu8VF0",
    titles: {
      pt: "19 — Song Sha | Encontrando o caminho de fé através do amor da minha mãe",
      es: "19 — Song Sha | Encontrando el camino de fe a través del amor de mi madre",
      en: "19 — Song Sha | Finding the path of faith through my mother's love",
    },
  },
  {
    id: "testemunho-fe-20-eliel-isai",
    youtubeId: "8PscfiLOj3Q",
    titles: {
      pt: "20 — Eliel Isai | Duvidei de Deus, mas ele me mostrou o caminho",
      es: "20 — Eliel Isai | Dudé de Dios, pero Él me mostró el camino",
      en: "20 — Eliel Isai | I doubted God, but He showed me the way",
    },
  },
  {
    id: "testemunho-fe-21-yuske-jitto",
    youtubeId: "hD9pLB5EqK8",
    titles: {
      pt: "21 — Yuske Jitto | Quando minha vida de fé ganhou significado",
      es: "21 — Yuske Jitto | Cuando mi vida de fe ganó significado",
      en: "21 — Yuske Jitto | When my life of faith gained meaning",
    },
  },
  {
    id: "testemunho-fe-22-hyun-jong-milena",
    youtubeId: "ylF66aLAgy0",
    titles: {
      pt: "22 — Hyun Jong Milena | Como cresci em dois anos de HJ Rang",
      es: "22 — Hyun Jong Milena | Cómo crecí en dos años de HJ Rang",
      en: "22 — Hyun Jong Milena | How I grew in two years of HJ Rang",
    },
  },
  {
    id: "testemunho-fe-23-heayun-yurkin",
    youtubeId: "_DHtXT1toZ4",
    titles: {
      pt: "23 — Heayun Yurkin | Entrei na Academia Hyo Jeong para aprender como servir a Deus",
      es: "23 — Heayun Yurkin | Entré en la Academia Hyo Jeong para aprender a servir a Dios",
      en: "23 — Heayun Yurkin | I entered Hyo Jeong Academy to learn how to serve God",
    },
  },
  {
    id: "testemunho-fe-24-chungnam-asto",
    youtubeId: "PgX2FAFiYZg",
    titles: {
      pt: "24 — Chungnam Asto | Vida de fé antes do HJ Rang",
      es: "24 — Chungnam Asto | Vida de fe antes del HJ Rang",
      en: "24 — Chungnam Asto | Life of faith before HJ Rang",
    },
  },
  {
    id: "testemunho-fe-25-luis-anticona",
    youtubeId: "nEekYXkDloo",
    titles: {
      pt: "25 — Luís Anticona | “Você sabe ouvir o chamado de Deus?”",
      es: "25 — Luís Anticona | “¿Sabes escuchar el llamado de Dios?”",
      en: "25 — Luís Anticona | “Do you know how to hear God’s calling?”",
    },
  },
  {
    id: "testemunho-fe-26-mauro-gabarrin",
    youtubeId: "gvX5aDi7boY",
    titles: {
      pt: "26 — Mauro Gabarrin | Encontrei as minhas naturezas decaídas",
      es: "26 — Mauro Gabarrin | Encontré mis naturalezas caídas",
      en: "26 — Mauro Gabarrin | I found my fallen natures",
    },
  },
  {
    id: "testemunho-fe-27-bianca-modise",
    youtubeId: "8d6dhb-INUI",
    titles: {
      pt: "27 — Bianca Modise | Fé que ultrapassa a dor física",
      es: "27 — Bianca Modise | Fe que supera el dolor físico",
      en: "27 — Bianca Modise | Faith that goes beyond physical pain",
    },
  },
  {
    id: "testemunho-fe-28-maria-clarissa",
    youtubeId: "9NBWtHV7RCA",
    titles: {
      pt: "28 — Maria Clarissa | Curiosidade que me fez conhecer o Princípio Divino",
      es: "28 — Maria Clarissa | Curiosidad que me hizo conocer el Principio Divino",
      en: "28 — Maria Clarissa | Curiosity that led me to know the Divine Principle",
    },
  },
];

function localizeSupportVideos(
  videos: LocalizedSupportVideo[],
  language: UserLanguage,
  subtitle: string,
): SupportVideo[] {
  return videos.map((video) => ({
    id: video.id,
    youtubeId: video.youtubeId,
    title: video.titles[language],
    subtitle,
  }));
}

export function getSupportFaithTestimonialVideos(
  language: UserLanguage,
): SupportVideo[] {
  return localizeSupportVideos(
    SUPPORT_FAITH_TESTIMONIAL_VIDEOS,
    language,
    FAITH_TESTIMONIAL_SUBTITLES[language],
  );
}

export function getSupportVideosByLanguage(
  language: UserLanguage,
): SupportVideo[] {
  return language === "es" ? SUPPORT_VIDEOS_ES : SUPPORT_VIDEOS_PT;
}

export function getSupportSubregion2Videos(
  language: UserLanguage,
): SupportVideo[] {
  return language === "es" ? SUPPORT_VIDEOS_ES_SUBREGION_2 : [];
}

export function getYoutubeThumbnailUrl(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getYoutubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
