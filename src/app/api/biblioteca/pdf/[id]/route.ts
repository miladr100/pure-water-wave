import { createReadStream } from "fs";
import { access, stat } from "fs/promises";
import { Readable } from "stream";

import { type NextRequest, NextResponse } from "next/server";

import { getLibraryPdfFilePath } from "@/lib/library-pdf-files";
import { getLibraryPdfById } from "@/lib/library-pdfs";
import { requirePastorSession } from "@/lib/require-pastor-session";
import { resolveLibraryPdfId } from "@/lib/resolve-library-pdf-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function pdfResponseHeaders(fileSize: number, extra?: Record<string, string>) {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    ...extra,
    ...(fileSize > 0 ? { "Content-Length": String(fileSize) } : {}),
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePastorSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = await resolveLibraryPdfId(request, context.params);

    if (!id) {
      return NextResponse.json({ error: "Material inválido" }, { status: 400 });
    }

    const pdf = getLibraryPdfById(id);

    if (!pdf) {
      return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
    }

    const filePath = getLibraryPdfFilePath(id);

    if (!filePath) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    if (!(await fileExists(filePath))) {
      console.error("PDF da biblioteca ausente no disco:", filePath);
      return NextResponse.json(
        { error: "Arquivo do material não encontrado" },
        { status: 404 },
      );
    }

    const fileStat = await stat(filePath);
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const match = /^bytes=(\d+)-(\d*)$/i.exec(rangeHeader);

      if (match) {
        const start = Number.parseInt(match[1], 10);
        const end = match[2]
          ? Number.parseInt(match[2], 10)
          : fileStat.size - 1;

        if (
          Number.isNaN(start) ||
          Number.isNaN(end) ||
          start < 0 ||
          end >= fileStat.size ||
          start > end
        ) {
          return new NextResponse(null, {
            status: 416,
            headers: {
              "Content-Range": `bytes */${fileStat.size}`,
            },
          });
        }

        const chunkSize = end - start + 1;
        const stream = createReadStream(filePath, { start, end });

        return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
          status: 206,
          headers: pdfResponseHeaders(chunkSize, {
            "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
            "Content-Length": String(chunkSize),
          }),
        });
      }
    }

    const stream = createReadStream(filePath);

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: pdfResponseHeaders(fileStat.size),
    });
  } catch (error) {
    console.error("Erro ao servir PDF da biblioteca:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o material" },
      { status: 500 },
    );
  }
}
