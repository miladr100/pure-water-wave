import { mkdir } from "node:fs/promises";
import { readdirSync } from "node:fs";
import path from "node:path";

import { pdf } from "pdf-to-img";
import sharp from "sharp";

/**
 * Gera prévias JPEG só dos livros em espanhol (ids *-es).
 * Uso: node scripts/generate-library-previews-es.mjs
 */
const LIBRARY_PDFS_ES = [
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
const outputDir = path.join(process.cwd(), "public", "library-previews");

function resolveFilename(folder, filename) {
  const folderPath = path.join(pdfDir, folder);
  const files = readdirSync(folderPath);
  const wanted = filename.normalize("NFC");
  const match = files.find((file) => file.normalize("NFC") === wanted);
  return path.join(folderPath, match ?? filename);
}

await mkdir(outputDir, { recursive: true });

for (const entry of LIBRARY_PDFS_ES) {
  const filePath = resolveFilename(entry.folder, entry.filename);
  console.log(`Gerando prévia: ${entry.id}`);

  const document = await pdf(filePath, { scale: 1.5 });

  try {
    const firstPage = await document.getPage(1);

    await sharp(firstPage)
      .resize({ width: 440, withoutEnlargement: false })
      .jpeg({ quality: 82 })
      .toFile(path.join(outputDir, `${entry.id}.jpg`));

    console.log(`  OK → ${entry.id}.jpg`);
  } finally {
    await document.destroy();
  }
}

console.log("Prévias ES geradas em public/library-previews/");
