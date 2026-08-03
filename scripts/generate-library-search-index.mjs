import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readdirSync } from "node:fs";
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
    filename: "Principio Divino 7ª Edição 2014_PT.pdf",
  },
  {
    id: "guia-estudo-principio-divino-pt",
    filename: "Guia de Estudo do Princípio Divino (Q&A)_PT.pdf",
  },
  {
    id: "novas-essencias-unificacao-pt",
    filename: "Novas Essencias do Pensamento de Unificacao_PT.pdf",
  },
  {
    id: "epopeia-povo-han-pt",
    filename: "A Epopeia da História do Povo Han Escolhido da Coreia_PT.pdf",
  },
  {
    id: "vontade-de-deus-e-o-mundo-pt",
    filename: "A Vontade de Deus e o Mundo_PT.pdf",
  },
  {
    id: "filha-unigenita-pt",
    filename:
      "A Filha Unigênita - a Verdadeira Mãe - nas Palavras dos Verdadeiros Pais_PT.pdf",
  },
  {
    id: "valor-verdadeiros-pais-pt",
    filename: "O Valor dos Verdadeiros Pais na Providência do Céu_PT.pdf",
  },
  {
    id: "biblia-sagrada-pt",
    filename: "Bíblia Sagrada_PT.pdf",
  },
];

const pdfDir = path.join(process.cwd(), "content", "pdfs");
const outputDir = path.join(process.cwd(), "content", "search-index");

function resolveFilename(filename) {
  const files = readdirSync(pdfDir);
  const wanted = filename.normalize("NFC");
  const match = files.find((file) => file.normalize("NFC") === wanted);
  return path.join(pdfDir, match ?? filename);
}

await mkdir(outputDir, { recursive: true });

for (const entry of LIBRARY_PDFS) {
  const filePath = resolveFilename(entry.filename);
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
