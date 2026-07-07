import type { NextRequest } from "next/server";

const PDF_ROUTE_PREFIX = "/api/biblioteca/pdf/";

export async function resolveLibraryPdfId(
  request: NextRequest,
  params: Promise<{ id: string }>,
) {
  const resolvedParams = await params;
  const paramId = resolvedParams.id?.trim();

  if (paramId) {
    return decodeURIComponent(paramId);
  }

  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith(PDF_ROUTE_PREFIX)) {
    return null;
  }

  const idFromPath = pathname
    .slice(PDF_ROUTE_PREFIX.length)
    .split("/")[0]
    ?.trim();

  return idFromPath ? decodeURIComponent(idFromPath) : null;
}
