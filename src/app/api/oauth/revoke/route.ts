import { withDb } from "@/lib/academy/http";
import { clientCredentialsFrom, revokeToken } from "@/lib/oauth";
import { oauthErrorResponse, oauthPreflight, readFormOrJson, OAUTH_CORS } from "@/lib/oauth-http";

// RFC 7009: always 200, whatever the token was.
export const OPTIONS = () => oauthPreflight();

export async function POST(req: Request) {
  try {
    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }
    const body = await readFormOrJson(req);
    const { clientId } = clientCredentialsFrom(req, body);
    if (body.token) {
      await revokeToken(body.token, clientId);
    }
    return new Response(null, { status: 200, headers: OAUTH_CORS });
  } catch (err) {
    return oauthErrorResponse(err);
  }
}
