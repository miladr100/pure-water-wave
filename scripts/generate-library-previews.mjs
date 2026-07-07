import { mkdir } from "node:fs/promises";
import path from "node:path";

import { pdf } from "pdf-to-img";
import sharp from "sharp";

/**
 * Gera imagens JPEG da primeira página em public/library-previews/.
 * Uso local (após adicionar/alterar PDFs): npm run generate:library-previews
 *
 * Mantenha a lista sincronizada com src/lib/library-pdfs.ts
 */
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
const outputDir = path.join(process.cwd(), "public", "library-previews");

await mkdir(outputDir, { recursive: true });

for (const entry of LIBRARY_PDFS) {
  const filePath = path.join(pdfDir, entry.filename);
  console.log(`Gerando prévia: ${entry.id}`);

  const document = await pdf(filePath, { scale: 1.5 });

  try {
    const firstPage = await document.getPage(1);

    await sharp(firstPage)
      .resize({ width: 440, withoutEnlargement: false })
      .jpeg({ quality: 82 })
      .toFile(path.join(outputDir, `${entry.id}.jpg`));
  } finally {
    await document.destroy();
  }
}

console.log("Prévias geradas em public/library-previews/");
