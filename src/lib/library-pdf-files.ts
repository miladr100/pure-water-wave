import path from "path";

import { getLibraryPdfById } from "@/lib/library-pdfs";

const PDF_STORAGE_DIR = path.join(process.cwd(), "content", "pdfs");

export function getLibraryPdfFilePath(id: string) {
  const pdf = getLibraryPdfById(id);

  if (!pdf) {
    return null;
  }

  const safeFilename = path.basename(pdf.filename);

  if (safeFilename !== pdf.filename) {
    return null;
  }

  return path.join(PDF_STORAGE_DIR, safeFilename);
}
