import { NextResponse } from "next/server";

import { searchAllLibraryPdfs } from "@/lib/pdf-library-search";
import { requirePastorSession } from "@/lib/require-pastor-session";

export async function GET(request: Request) {
  try {
    const session = await requirePastorSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    if (!query) {
      return NextResponse.json(
        { error: "Informe um termo para buscar" },
        { status: 400 },
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: "O termo deve ter pelo menos 2 caracteres" },
        { status: 400 },
      );
    }

    const results = await searchAllLibraryPdfs(query);

    return NextResponse.json({ query, results });
  } catch (error) {
    console.error("Erro na busca da biblioteca:", error);
    return NextResponse.json(
      { error: "Não foi possível realizar a busca" },
      { status: 500 },
    );
  }
}
