import { jsonError, serverError } from "@/lib/academy/http";
import { listGrants, revokeClientForUser } from "@/lib/oauth";

import { educatorContext } from "../../_lib/context";
import { ok } from "../_lib";

// The agents this educator connected to the Contabilidade (MCP).
export async function GET() {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    return ok({ agentes: await listGrants(result.context.user._id) });
  } catch (error) {
    return serverError("Erro ao listar agentes", error, "Não foi possível carregar os agentes");
  }
}

// DELETE ?id=<client> — disconnects that agent: its tokens stop working now.
export async function DELETE(request: Request) {
  try {
    const result = await educatorContext();
    if (!result.ok) {
      return result.response;
    }
    const id = new URL(request.url).searchParams.get("id") ?? "";
    const revogados = await revokeClientForUser(result.context.user._id, id);
    if (!revogados) {
      return jsonError("Agente não encontrado", 404);
    }
    return ok({ agentes: await listGrants(result.context.user._id) });
  } catch (error) {
    return serverError("Erro ao desconectar agente", error, "Não foi possível desconectar");
  }
}
