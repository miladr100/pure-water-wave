import { withDb } from "@/lib/academy/http";
import { assertClientAuth, clientCredentialsFrom, consumeCode, issueTokens, loadClient, MCP_PATH, OAuthError, rotateRefresh } from "@/lib/oauth";
import { oauthErrorResponse, oauthJson, oauthPreflight, publicOrigin, readFormOrJson } from "@/lib/oauth-http";

// Token endpoint: authorization_code (+ PKCE verifier, mandatory) and refresh_token (rotates).
export const OPTIONS = () => oauthPreflight();

export async function POST(req: Request) {
  try {
    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }
    const body = await readFormOrJson(req);
    const { clientId, clientSecret } = clientCredentialsFrom(req, body);
    const client = await loadClient(clientId);
    if (!client) {
      throw new OAuthError("invalid_client", "unknown client_id", 401);
    }
    assertClientAuth(client, clientSecret);
    if (body.grant_type === "authorization_code") {
      if (!body.code) throw new OAuthError("invalid_request", "code is required");
      if (!body.redirect_uri) throw new OAuthError("invalid_request", "redirect_uri is required");
      if (!body.code_verifier) throw new OAuthError("invalid_request", "code_verifier is required (PKCE)");
      const code = await consumeCode(body.code, String(client._id), body.redirect_uri, body.code_verifier);
      if (body.resource && !body.resource.startsWith(publicOrigin(req) + MCP_PATH)) {
        throw new OAuthError("invalid_request", "resource does not match this server's MCP endpoint");
      }
      return oauthJson(await issueTokens({ clientId: String(client._id), userId: code.userId, scope: code.scope }));
    }
    if (body.grant_type === "refresh_token") {
      if (!body.refresh_token) throw new OAuthError("invalid_request", "refresh_token is required");
      return oauthJson(await rotateRefresh(body.refresh_token, String(client._id)));
    }
    throw new OAuthError("unsupported_grant_type", "use authorization_code or refresh_token");
  } catch (err) {
    return oauthErrorResponse(err);
  }
}
