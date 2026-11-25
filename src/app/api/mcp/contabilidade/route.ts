import { NextResponse } from "next/server";

import { withDb } from "@/lib/academy/http";
import { chamarFerramenta, ErroFerramenta, FERRAMENTAS, MCP_INSTRUCOES } from "@/lib/hj/contabilidade-mcp";
import { loadContext } from "@/lib/hj/data";
import { resolveAccessToken } from "@/lib/oauth";
import { OAUTH_CORS, oauthPreflight, publicOrigin } from "@/lib/oauth-http";
import { AcademyUser } from "@/models/academy-user";

// The Contabilidade's MCP endpoint (Streamable HTTP, stateless, JSON answers).
// An agent host posts JSON-RPC here with the Bearer token it got from our
// OAuth (lib/oauth.ts). Without one it gets a 401 that points at the OAuth
// discovery, which is how claude.ai or ChatGPT start the sign-in.

export const maxDuration = 60;

const VERSOES = ["2025-06-18", "2025-03-26", "2024-11-05"];

type Pedido = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const resposta = (id: Pedido["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const erro = (id: Pedido["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

function naoAutorizado(req: Request) {
  const meta = `${publicOrigin(req)}/.well-known/oauth-protected-resource/api/mcp/contabilidade`;
  return NextResponse.json(erro(null, -32001, "Unauthorized"), {
    status: 401,
    headers: { ...OAUTH_CORS, "WWW-Authenticate": `Bearer resource_metadata="${meta}"` },
  });
}

export const OPTIONS = () => oauthPreflight();

export async function GET() {
  return new NextResponse(null, { status: 405, headers: { ...OAUTH_CORS, Allow: "POST, OPTIONS" } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 200, headers: OAUTH_CORS });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(auth.trim())?.[1] ?? "";
  if (!bearer) {
    return naoAutorizado(req);
  }
  const dbError = await withDb();
  if (dbError) {
    return dbError;
  }
  const grant = await resolveAccessToken(bearer);
  if (!grant) {
    return naoAutorizado(req);
  }
  // the role is read again on every call: an educator who stops being one loses the agent too
  const user = await AcademyUser.findById(grant.userId).select("login fullName role language isAdmin").lean();
  const context = user
    ? await loadContext({ userId: String(user._id), login: user.login, fullName: user.fullName, role: user.role, language: user.language, admin: user.isAdmin === true })
    : null;
  if (!context?.papeis.educador) {
    return NextResponse.json(erro(null, -32003, "Só educadores e administradores usam o conector da contabilidade."), { status: 403, headers: OAUTH_CORS });
  }

  const corpo = (await req.json().catch(() => null)) as Pedido | Pedido[] | null;
  if (!corpo) {
    return NextResponse.json(erro(null, -32700, "Parse error"), { status: 400, headers: OAUTH_CORS });
  }
  const pedidos = Array.isArray(corpo) ? corpo : [corpo];
  const escopos = grant.scope.split(" ");
  const respostas = [];
  for (const pedido of pedidos) {
    const id = pedido.id;
    const notificacao = id === undefined || id === null;
    switch (pedido.method) {
      case "initialize": {
        const pedida = typeof pedido.params?.protocolVersion === "string" ? pedido.params.protocolVersion : VERSOES[0];
        respostas.push(
          resposta(id, {
            protocolVersion: VERSOES.includes(pedida) ? pedida : VERSOES[0],
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: "pww-contabilidade", title: "Contabilidade — Água Pura", version: "1.0.0" },
            instructions: MCP_INSTRUCOES,
          }),
        );
        break;
      }
      case "ping":
        respostas.push(resposta(id, {}));
        break;
      case "tools/list":
        respostas.push(
          resposta(id, {
            tools: FERRAMENTAS.filter((item) => !item.escreve || escopos.includes("write")).map(({ name, description, inputSchema, annotations }) => ({
              name,
              description,
              inputSchema,
              ...(annotations ? { annotations } : {}),
            })),
          }),
        );
        break;
      case "tools/call": {
        const nome = typeof pedido.params?.name === "string" ? pedido.params.name : "";
        const args = (pedido.params?.arguments ?? {}) as Record<string, unknown>;
        try {
          const resultado = await chamarFerramenta(nome, args, { context, escopos });
          respostas.push(resposta(id, { content: [{ type: "text", text: JSON.stringify(resultado, null, 1) }], structuredContent: resultado }));
        } catch (error) {
          if (error instanceof ErroFerramenta) {
            respostas.push(resposta(id, { content: [{ type: "text", text: error.message }], isError: true }));
          } else {
            console.error("mcp contabilidade", nome, error);
            respostas.push(resposta(id, { content: [{ type: "text", text: "Erro do servidor ao executar a ferramenta." }], isError: true }));
          }
        }
        break;
      }
      case "resources/list":
        respostas.push(resposta(id, { resources: [] }));
        break;
      case "prompts/list":
        respostas.push(resposta(id, { prompts: [] }));
        break;
      default:
        if (!notificacao) {
          respostas.push(erro(id, -32601, `Method not found: ${pedido.method ?? ""}`));
        }
    }
  }
  if (!respostas.length) {
    return new NextResponse(null, { status: 202, headers: OAUTH_CORS });
  }
  return NextResponse.json(Array.isArray(corpo) ? respostas : respostas[0], { headers: { ...OAUTH_CORS, "Cache-Control": "no-store" } });
}
