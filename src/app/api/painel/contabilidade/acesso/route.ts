import { jsonError, serverError } from "@/lib/academy/http";
import { HjContabConfig } from "@/models/hj-contab-config";
import { AcademyUser } from "@/models/academy-user";

import { adminContext } from "../../_lib/context";
import { ok } from "../_lib";

// PUT {educadorId, ve} — the administrator lets an educator see every book.
export async function PUT(request: Request) {
  try {
    const result = await adminContext();
    if (!result.ok) {
      return result.response;
    }
    const body = (await request.json().catch(() => ({}))) as { educadorId?: unknown; ve?: unknown };
    const id = typeof body.educadorId === "string" ? body.educadorId : "";
    const educador = /^[a-f0-9]{24}$/i.test(id) ? await AcademyUser.findOne({ _id: id, role: "tutor" }).select("_id").lean() : null;
    if (!educador) {
      return jsonError("Educador não encontrado", 404);
    }
    await HjContabConfig.updateOne(
      { _id: "contabilidade" },
      body.ve === true ? { $addToSet: { veTodas: educador._id } } : { $pull: { veTodas: educador._id } },
      { upsert: true },
    );
    const doc = await HjContabConfig.findById("contabilidade").lean();
    return ok({ veTodas: (doc?.veTodas ?? []).map(String) });
  } catch (error) {
    return serverError("Erro ao salvar acesso", error, "Não foi possível salvar");
  }
}
