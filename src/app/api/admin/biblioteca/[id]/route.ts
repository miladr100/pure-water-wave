import { NextResponse } from "next/server";

import { isObjectId, jsonError, serverError } from "@/lib/academy/http";
import { listAllItems, type BibliotecaItemBody } from "@/lib/biblioteca/itens";
import { BibliotecaItem } from "@/models/biblioteca-item";

import { adminContext } from "../../hj/_lib/shared";
import { validateItem } from "../_lib/validate";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const { id } = await params;
    if (!isObjectId(id) || !(await BibliotecaItem.exists({ _id: id }))) {
      return jsonError("Não encontrado", 404);
    }
    const body = (await request.json().catch(() => ({}))) as Partial<BibliotecaItemBody>;
    const validated = validateItem(body, false);
    if (!validated.ok) {
      return validated.response;
    }
    await BibliotecaItem.updateOne({ _id: id }, { $set: validated.value });
    return NextResponse.json({ itens: await listAllItems() });
  } catch (error) {
    return serverError("Erro ao salvar item da biblioteca", error, "Não foi possível salvar o item");
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const { id } = await params;
    if (!isObjectId(id)) {
      return jsonError("Não encontrado", 404);
    }
    const deleted = await BibliotecaItem.deleteOne({ _id: id });
    if (deleted.deletedCount === 0) {
      return jsonError("Não encontrado", 404);
    }
    return NextResponse.json({ ok: true, itens: await listAllItems() });
  } catch (error) {
    return serverError("Erro ao apagar item da biblioteca", error, "Não foi possível apagar o item");
  }
}
