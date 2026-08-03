import { readdirSync } from "fs";
import path from "path";

import { getLibraryPdfById } from "@/lib/library-pdfs";

const PDF_STORAGE_DIR = path.join(process.cwd(), "content", "pdfs");

function normalizeFilename(value: string) {
  return value.normalize("NFC");
}

function resolvePdfFilenameOnDisk(filename: string) {
  const safeFilename = path.basename(filename);

  if (safeFilename !== filename) {
    return null;
  }

  const directPath = path.join(PDF_STORAGE_DIR, safeFilename);

  try {
    readdirSync(PDF_STORAGE_DIR);
  } catch {
    return directPath;
  }

  const files = readdirSync(PDF_STORAGE_DIR);
  const normalizedWanted = normalizeFilename(safeFilename);
  const match = files.find(
    (file) => normalizeFilename(file) === normalizedWanted,
  );

  return path.join(PDF_STORAGE_DIR, match ?? safeFilename);
}

export function getLibraryPdfFilePath(id: string) {
  const pdf = getLibraryPdfById(id);

  if (!pdf) {
    return null;
  }

  return resolvePdfFilenameOnDisk(pdf.filename);
}
