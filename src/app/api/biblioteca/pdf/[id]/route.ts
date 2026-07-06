import { readFile } from "fs/promises";

import { NextResponse } from "next/server";

import { getLibraryPdfById } from "@/lib/library-pdfs";
import { getLibraryPdfFilePath } from "@/lib/library-pdf-files";
import { requirePastorSession } from "@/lib/require-pastor-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requirePastorSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const pdf = getLibraryPdfById(id);

    if (!pdf) {
      return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
    }

    const filePath = getLibraryPdfFilePath(id);

    if (!filePath) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Erro ao servir PDF da biblioteca:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o material" },
      { status: 500 },
    );
  }
}
