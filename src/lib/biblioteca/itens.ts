import type { Types } from "mongoose";

import type { SupportDownload, SupportVideo } from "@/lib/support-materials";
import type { UserLanguage } from "@/lib/user-languages";
import { BibliotecaItem, type BibliotecaTipo } from "@/models/biblioteca-item";

// Library items kept in the database (added from Administração ›
// Biblioteca), and how they join the content that ships with the code.

export type BibliotecaItemRow = {
  id: string;
  tipo: BibliotecaTipo;
  titulo: string;
  subtitulo: string;
  idioma: UserLanguage;
  url: string;
  youtubeId: string;
  thumbnailUrl: string;
  publicado: boolean;
  ordem: number;
  criadoEm: string;
};

export type BibliotecaItemBody = {
  tipo: BibliotecaTipo;
  titulo: string;
  subtitulo?: string;
  idioma?: UserLanguage;
  url: string;
  thumbnailUrl?: string;
  publicado?: boolean;
  ordem?: number;
};

// A book added by link: opened in a new tab (the in-site reader only
// knows the PDFs that ship with the code).
export type LibraryExtraBook = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  thumbnailUrl: string;
};

export type LibraryExtras = {
  livros: LibraryExtraBook[];
  materiais: SupportDownload[];
  videos: SupportVideo[];
};

type ItemDoc = {
  _id: Types.ObjectId;
  tipo: BibliotecaTipo;
  titulo: string;
  subtitulo?: string;
  idioma: UserLanguage;
  url: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  publicado: boolean;
  ordem?: number;
  createdAt?: Date;
};

// youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, /embed/ID,
// /live/ID — or nothing when the link is not YouTube.
export function youtubeIdFrom(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] ?? "";
    }
    if (host === "youtube.com" || host === "music.youtube.com") {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      const match = parsed.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?]+)/);
      return match?.[1] ?? "";
    }
  } catch {
    // not a URL at all
  }
  return "";
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function itemRow(doc: ItemDoc): BibliotecaItemRow {
  return {
    id: doc._id.toString(),
    tipo: doc.tipo,
    titulo: doc.titulo,
    subtitulo: doc.subtitulo ?? "",
    idioma: doc.idioma,
    url: doc.url,
    youtubeId: doc.youtubeId ?? "",
    thumbnailUrl: doc.thumbnailUrl ?? "",
    publicado: doc.publicado,
    ordem: doc.ordem ?? 0,
    criadoEm: (doc.createdAt ?? new Date()).toISOString(),
  };
}

export async function listAllItems() {
  const docs = (await BibliotecaItem.find().sort({ tipo: 1, ordem: 1, createdAt: -1 }).lean()) as ItemDoc[];
  return docs.map(itemRow);
}

// What the library pages add to their own lists for one language. Any
// failure (no database configured, connection down) yields nothing extra:
// the shipped content must never depend on the database.
export async function listPublishedExtras(language: UserLanguage): Promise<LibraryExtras> {
  const empty: LibraryExtras = { livros: [], materiais: [], videos: [] };
  if (!process.env.MONGODB_URI) {
    return empty;
  }
  try {
    const { connectDB } = await import("@/lib/mongodb");
    await connectDB();
    const docs = (await BibliotecaItem.find({ publicado: true, idioma: language })
      .sort({ ordem: 1, createdAt: -1 })
      .lean()) as ItemDoc[];
    const extras: LibraryExtras = { livros: [], materiais: [], videos: [] };
    for (const doc of docs) {
      const row = itemRow(doc);
      if (row.tipo === "livro") {
        extras.livros.push({ id: `db-${row.id}`, title: row.titulo, subtitle: row.subtitulo, url: row.url, thumbnailUrl: row.thumbnailUrl });
      } else if (row.tipo === "material") {
        extras.materiais.push({
          id: `db-${row.id}`,
          title: row.titulo,
          subtitle: row.subtitulo,
          thumbnailUrl: row.thumbnailUrl,
          fileUrl: row.url,
          fileLabel: "Abrir",
        });
      } else {
        extras.videos.push({
          id: `db-${row.id}`,
          title: row.titulo,
          subtitle: row.subtitulo,
          ...(row.youtubeId ? { youtubeId: row.youtubeId } : { url: row.url }),
        });
      }
    }
    return extras;
  } catch (error) {
    console.error("Erro ao carregar itens da biblioteca:", error);
    return empty;
  }
}
