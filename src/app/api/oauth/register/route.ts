import { withDb } from "@/lib/academy/http";
import { registerClient } from "@/lib/oauth";
import { oauthErrorResponse, oauthJson, oauthPreflight } from "@/lib/oauth-http";

// RFC 7591 dynamic client registration: an MCP host introduces itself once and
// gets a client_id. Open by design (that is how claude.ai or ChatGPT connect).
export const OPTIONS = () => oauthPreflight();

export async function POST(req: Request) {
  try {
    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return oauthJson({ error: "invalid_client_metadata", error_description: "JSON body required" }, 400);
    }
    const { row, secret } = await registerClient(body);
    return oauthJson(
      {
        client_id: row._id,
        ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
        client_id_issued_at: Math.floor((row.createdAt as Date).getTime() / 1000),
        client_name: row.nome,
        redirect_uris: row.redirectUris,
        token_endpoint_auth_method: row.tokenEndpointAuthMethod,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
      201,
    );
  } catch (err) {
    return oauthErrorResponse(err);
  }
}
