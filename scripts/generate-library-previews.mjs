import { mkdir } from "node:fs/promises";
import { readdirSync } from "node:fs";
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
const outputDir = path.join(process.cwd(), "public", "library-previews");

function resolveFilename(filename) {
  const files = readdirSync(pdfDir);
  const wanted = filename.normalize("NFC");
  const match = files.find((file) => file.normalize("NFC") === wanted);
  return path.join(pdfDir, match ?? filename);
}

await mkdir(outputDir, { recursive: true });

for (const entry of LIBRARY_PDFS) {
  const filePath = resolveFilename(entry.filename);
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
