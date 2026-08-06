import { readdirSync } from "fs";
import path from "path";

import { getLibraryPdfById } from "@/lib/library-pdfs";

const PDF_STORAGE_DIR = path.join(process.cwd(), "content", "pdfs");

function normalizeFilename(value: string) {
  return value.normalize("NFC");
}

function resolvePdfFilenameOnDisk(folder: string, filename: string) {
  const safeFolder = path.basename(folder);
  const safeFilename = path.basename(filename);

  if (safeFolder !== folder || safeFilename !== filename) {
    return null;
  }

  const folderPath = path.join(PDF_STORAGE_DIR, safeFolder);
  const directPath = path.join(folderPath, safeFilename);

  try {
    readdirSync(folderPath);
  } catch {
    return directPath;
  }

  const files = readdirSync(folderPath);
  const normalizedWanted = normalizeFilename(safeFilename);
  const match = files.find(
    (file) => normalizeFilename(file) === normalizedWanted,
  );

  return path.join(folderPath, match ?? safeFilename);
}

export function getLibraryPdfFilePath(id: string) {
  const pdf = getLibraryPdfById(id);

  if (!pdf) {
    return null;
  }

  return resolvePdfFilenameOnDisk(pdf.folder, pdf.filename);
}
