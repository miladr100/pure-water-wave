import { NextResponse } from "next/server";

import { serverError } from "@/lib/academy/http";
import { itemRow, listAllItems, type BibliotecaItemBody } from "@/lib/biblioteca/itens";
import { BibliotecaItem } from "@/models/biblioteca-item";

import { adminContext } from "../hj/_lib/shared";
import { validateItem } from "./_lib/validate";

// Library content managed from the administration. Only administrators
// add, change or remove items; the library pages read the published ones.
export async function GET() {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    return NextResponse.json({ itens: await listAllItems() });
  } catch (error) {
    return serverError("Erro ao listar itens da biblioteca", error, "Não foi possível carregar a biblioteca");
  }
}

export async function POST(request: Request) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as Partial<BibliotecaItemBody>;
    const validated = validateItem(body, true);
    if (!validated.ok) {
      return validated.response;
    }
    const created = await BibliotecaItem.create({ ...validated.value, criadoPorId: result.context.user._id });
    return NextResponse.json(
      { item: itemRow(created.toObject() as Parameters<typeof itemRow>[0]), itens: await listAllItems() },
      { status: 201 },
    );
  } catch (error) {
    return serverError("Erro ao criar item da biblioteca", error, "Não foi possível salvar o item");
  }
}
