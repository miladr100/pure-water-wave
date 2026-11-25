import { NextResponse } from "next/server";

import { OAuthError } from "./oauth";

// Shared HTTP bits for the OAuth endpoints: CORS (hosts fetch discovery from
// browsers too), the RFC 6749 error shape, form/JSON bodies, and our origin.

export const OAUTH_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, MCP-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

export const oauthJson = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...OAUTH_CORS, "Cache-Control": "no-store", Pragma: "no-cache", ...extra } });

export const oauthPreflight = () => new NextResponse(null, { status: 204, headers: OAUTH_CORS });

export function oauthErrorResponse(err: unknown) {
  if (err instanceof OAuthError) {
    const extra: Record<string, string> = err.code === "invalid_client" ? { "WWW-Authenticate": 'Basic realm="pure-water-wave"' } : {};
    return oauthJson({ error: err.code, error_description: err.description }, err.status, extra);
  }
  console.error("oauth endpoint", err);
  return oauthJson({ error: "server_error", error_description: "Something went wrong on our side." }, 500);
}

/** Token and revocation endpoints take form bodies; some hosts send JSON. */
export async function readFormOrJson(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") || "";
  const out: Record<string, string> = {};
  if (ct.includes("application/json")) {
    const j = (await req.json().catch(() => null)) as unknown;
    if (j && typeof j === "object") {
      for (const [k, v] of Object.entries(j)) {
        if (typeof v === "string") {
          out[k] = v;
        }
      }
    }
    return out;
  }
  const text = await req.text().catch(() => "");
  for (const [k, v] of new URLSearchParams(text)) {
    out[k] = v;
  }
  return out;
}

/** The origin hosts see: the request's own (the demo, a preview or the real site). */
export function publicOrigin(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${proto}://${forwardedHost}`;
  }
  return new URL(req.url).origin;
}
