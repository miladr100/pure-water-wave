import { Schema, model, models, type InferSchemaType } from "mongoose";

import { USER_LANGUAGES } from "@/lib/user-languages";

// Library content added from the administration, alongside the books,
// materials and videos that ship with the site's code. Each item is a
// link: a PDF or document to open, or a video to watch. Collection is
// prefixed `biblioteca_` like the rest of the site's own data.
export const BIBLIOTECA_TIPOS = ["livro", "material", "video"] as const;
export type BibliotecaTipo = (typeof BIBLIOTECA_TIPOS)[number];

const bibliotecaItemSchema = new Schema(
  {
    tipo: { type: String, enum: BIBLIOTECA_TIPOS, required: true },
    titulo: { type: String, required: true, trim: true },
    subtitulo: { type: String, default: "" },
    idioma: { type: String, enum: USER_LANGUAGES, default: "pt" },
    // The PDF/document link, or the video page
    url: { type: String, required: true },
    // Derived from `url` for YouTube videos, so cards can show the thumbnail
    youtubeId: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    publicado: { type: Boolean, default: true },
    ordem: { type: Number, default: 0 },
    criadoPorId: { type: Schema.Types.ObjectId, ref: "AcademyUser", default: null },
  },
  { timestamps: true, collection: "biblioteca_itens" },
);

bibliotecaItemSchema.index({ tipo: 1, idioma: 1, publicado: 1, ordem: 1 });

export type BibliotecaItemDocument = InferSchemaType<typeof bibliotecaItemSchema>;

if (models.BibliotecaItem) {
  delete models.BibliotecaItem;
}

export const BibliotecaItem = model("BibliotecaItem", bibliotecaItemSchema, "biblioteca_itens");
