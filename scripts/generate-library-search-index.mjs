import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

/**
 * Gera índice de texto por página em content/search-index/.
 * Uso local (após adicionar/alterar PDFs): npm run generate:library-search-index
 *
 * Mantenha a lista sincronizada com src/lib/library-pdfs.ts
 */
const require = createRequire(import.meta.url);
const { getDocument } = require("pdfjs-dist/legacy/build/pdf.mjs");

const LIBRARY_PDFS = [
  {
    id: "principio-divino-pt",
    filename: "Principio Divino 7ª Edição 2014.pdf",
  },
  {
    id: "principio-divino-ko",
    filename: "Princípio Divino Coreano.pdf",
  },
  {
    id: "principio-divino-es",
    filename: "Libro Principio Divino 3 Colores Espanhol.pdf",
  },
  {
    id: "novas-essencias-unificacao",
    filename: "Novas Essencias do Pensamento de Unificacao atual.pdf",
  },
  {
    id: "epopeia-povo-han",
    filename: "A Epopeia da História do Povo Han Escolhido da Coreia.pdf",
  },
  {
    id: "vontade-de-deus-e-o-mundo",
    filename: "A vontade de Deus e o Mundo.pdf",
  },
  {
    id: "biblia-sagrada-pt",
    filename: "Bíblia Sagrada Português.pdf",
  },
];

const pdfDir = path.join(process.cwd(), "content", "pdfs");
const outputDir = path.join(process.cwd(), "content", "search-index");

await mkdir(outputDir, { recursive: true });

for (const entry of LIBRARY_PDFS) {
  const filePath = path.join(pdfDir, entry.filename);
  console.log(`Indexando: ${entry.id}`);

  const buffer = await readFile(filePath);
  const document = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  }).promise;

  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      pages.push({ pageNumber, text });
    }

    await writeFile(
      path.join(outputDir, `${entry.id}.json`),
      JSON.stringify({ pages }),
    );
  } finally {
    await document.destroy();
  }
}

console.log("Índices gerados em content/search-index/");
