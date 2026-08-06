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
    folder: "PT",
    filename: "Principio Divino 7ª Edição 2014_PT.pdf",
  },
  {
    id: "guia-estudo-principio-divino-pt",
    folder: "PT",
    filename: "Guia de Estudo do Princípio Divino (Q&A)_PT.pdf",
  },
  {
    id: "novas-essencias-unificacao-pt",
    folder: "PT",
    filename: "Novas Essencias do Pensamento de Unificacao_PT.pdf",
  },
  {
    id: "epopeia-povo-han-pt",
    folder: "PT",
    filename: "A Epopeia da História do Povo Han Escolhido da Coreia_PT.pdf",
  },
  {
    id: "vontade-de-deus-e-o-mundo-pt",
    folder: "PT",
    filename: "A Vontade de Deus e o Mundo_PT.pdf",
  },
  {
    id: "filha-unigenita-pt",
    folder: "PT",
    filename:
      "A Filha Unigênita - a Verdadeira Mãe - nas Palavras dos Verdadeiros Pais_PT.pdf",
  },
  {
    id: "valor-verdadeiros-pais-pt",
    folder: "PT",
    filename: "O Valor dos Verdadeiros Pais na Providência do Céu_PT.pdf",
  },
  {
    id: "biblia-sagrada-pt",
    folder: "PT",
    filename: "Bíblia Sagrada_PT.pdf",
  },
  {
    id: "principio-divino-es",
    folder: "ES",
    filename: "Principio Divino_ES.pdf",
  },
  {
    id: "guia-estudo-principio-divino-es",
    folder: "ES",
    filename: "Guía de Estudio del Principio Divino (Q&A)_ES.pdf",
  },
  {
    id: "epopeia-povo-han-es",
    folder: "ES",
    filename: "La epopeya de la historia del pueblo Han elegido de Corea_ES.pdf",
  },
  {
    id: "vontade-de-deus-e-o-mundo-es",
    folder: "ES",
    filename: "La Voluntad de Dios y el Mundo_ES.pdf",
  },
  {
    id: "filha-unigenita-es",
    folder: "ES",
    filename:
      "La Hija Unigénita - la Madre Verdadera - en las Palabras de los Padres Verdaderos_ES.pdf",
  },
  {
    id: "valor-verdadeiros-pais-es",
    folder: "ES",
    filename:
      "El Valor de los Padres Verdaderos en la Providencia del Cielo_ES.pdf",
  },
  {
    id: "biblia-sagrada-es",
    folder: "ES",
    filename: "La Santa Biblia_ES.pdf",
  },
];

const pdfDir = path.join(process.cwd(), "content", "pdfs");
const outputDir = path.join(process.cwd(), "content", "search-index");

function resolveFilename(folder, filename) {
  const folderPath = path.join(pdfDir, folder);
  const files = readdirSync(folderPath);
  const wanted = filename.normalize("NFC");
  const match = files.find((file) => file.normalize("NFC") === wanted);
  return path.join(folderPath, match ?? filename);
}

await mkdir(outputDir, { recursive: true });

for (const entry of LIBRARY_PDFS) {
  const filePath = resolveFilename(entry.folder, entry.filename);
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
