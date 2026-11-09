import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getItens, POST as postItem } from "@/app/api/admin/biblioteca/route";
import { DELETE as deleteItem, PATCH as patchItem } from "@/app/api/admin/biblioteca/[id]/route";
import { listPublishedExtras, youtubeIdFrom, type BibliotecaItemRow } from "@/lib/biblioteca/itens";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createAdmin, createEducator, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const create = (body: unknown) => postItem(jsonRequest("/api/admin/biblioteca", { body }));
const edit = (id: string, body: unknown) => patchItem(jsonRequest(`/api/admin/biblioteca/${id}`, { method: "PATCH", body }), params({ id }));
const remove = (id: string) => deleteItem(jsonRequest(`/api/admin/biblioteca/${id}`, { method: "DELETE" }), params({ id }));

describe("youtubeIdFrom", () => {
  it("reads every YouTube link shape and ignores the rest", () => {
    expect(youtubeIdFrom("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("dQw4w9WgXcQ");
    expect(youtubeIdFrom("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeIdFrom("https://youtube.com/shorts/abc123DEF45")).toBe("abc123DEF45");
    expect(youtubeIdFrom("https://www.youtube.com/embed/abc123DEF45?rel=0")).toBe("abc123DEF45");
    expect(youtubeIdFrom("https://drive.google.com/file/d/xyz/view")).toBe("");
    expect(youtubeIdFrom("not a url")).toBe("");
  });
});

describe("Administração › Biblioteca", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("only an administrator manages the library's items", async () => {
    const educador = await createEducator();
    await signInAsPanel(educador);
    expect((await getItens()).status).toBe(404);
    expect((await create({ tipo: "livro", titulo: "Livro", url: "https://example.org/livro.pdf" })).status).toBe(404);
  });

  it("adds a book, a material and a video; the library pages see the published ones per language", async () => {
    const admin = await createAdmin();
    await signInAsPanel(admin);

    const livro = await create({ tipo: "livro", titulo: "  Princípio Divino resumido ", subtitulo: "Edição de bolso", url: "https://drive.google.com/file/d/abc/view", thumbnailUrl: "https://example.org/capa.jpg" });
    expect(livro.status).toBe(201);
    const material = await create({ tipo: "material", titulo: "Ficha nova", url: "https://example.org/ficha.pdf", idioma: "es" });
    expect(material.status).toBe(201);
    const video = await create({ tipo: "video", titulo: "Testemunho em vídeo", url: "https://youtu.be/dQw4w9WgXcQ" });
    expect(video.status).toBe(201);
    const { item } = await readJson<{ item: BibliotecaItemRow }>(video);
    expect(item.youtubeId).toBe("dQw4w9WgXcQ");

    const all = await readJson<{ itens: BibliotecaItemRow[] }>(await getItens());
    expect(all.itens).toHaveLength(3);
    expect(all.itens.find((i) => i.tipo === "livro")?.titulo).toBe("Princípio Divino resumido");

    const pt = await listPublishedExtras("pt");
    expect(pt.livros.map((b) => b.title)).toEqual(["Princípio Divino resumido"]);
    expect(pt.videos[0]).toMatchObject({ title: "Testemunho em vídeo", youtubeId: "dQw4w9WgXcQ" });
    expect(pt.materiais).toEqual([]);
    const es = await listPublishedExtras("es");
    expect(es.materiais.map((m) => m.title)).toEqual(["Ficha nova"]);
    expect(es.materiais[0].fileUrl).toBe("https://example.org/ficha.pdf");
  });

  it("validates type, title and link", async () => {
    const admin = await createAdmin();
    await signInAsPanel(admin);
    expect((await readJson<ErrorBody>(await create({ tipo: "podcast", titulo: "x", url: "https://e.org" }))).code).toBe("INVALID_TYPE");
    expect((await readJson<ErrorBody>(await create({ tipo: "livro", titulo: "x", url: "https://e.org" }))).code).toBe("TITLE_REQUIRED");
    expect((await readJson<ErrorBody>(await create({ tipo: "livro", titulo: "Livro", url: "ftp://e.org/x.pdf" }))).code).toBe("INVALID_URL");
    expect((await readJson<ErrorBody>(await create({ tipo: "livro", titulo: "Livro", url: "https://e.org/x.pdf", idioma: "fr" }))).code).toBe("INVALID_LANGUAGE");
  });

  it("hides, edits and removes an item", async () => {
    const admin = await createAdmin();
    await signInAsPanel(admin);
    const { item } = await readJson<{ item: BibliotecaItemRow }>(await create({ tipo: "livro", titulo: "Livro", url: "https://e.org/x.pdf" }));

    await edit(item.id, { publicado: false });
    expect((await listPublishedExtras("pt")).livros).toEqual([]);

    const edited = await readJson<{ itens: BibliotecaItemRow[] }>(await edit(item.id, { titulo: "Livro renomeado", publicado: true }));
    expect(edited.itens[0]).toMatchObject({ titulo: "Livro renomeado", publicado: true });
    expect((await readJson<ErrorBody>(await edit(item.id, {}))).code).toBe("EMPTY");

    expect((await remove(item.id)).status).toBe(200);
    expect((await remove(item.id)).status).toBe(404);
    expect((await readJson<{ itens: BibliotecaItemRow[] }>(await getItens())).itens).toEqual([]);
  });
});
