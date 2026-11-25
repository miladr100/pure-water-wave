import { NextResponse } from "next/server";

import { jsonError, withDb } from "@/lib/academy/http";
import { requireAcademySession } from "@/lib/academy/require-session";
import { loadContext } from "@/lib/hj/data";
import { createCode, loadClient, parseScope, redirectRegistered, withParams } from "@/lib/oauth";

// The consent page's decision lands here (a same-origin fetch with the session
// cookie). It re-checks the client, the redirect and that the person may
// connect an agent (educators and administrators, Victor 25/11/2026), and
// mints a single-use code. The page performs the navigation.
const campo = (value: unknown) => (typeof value === "string" ? value.slice(0, 2048) : "");

export async function POST(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return jsonError("Pedido de outro site", 403);
  }
  const session = await requireAcademySession();
  if (!session) {
    return jsonError("A sessão expirou. Entre de novo.", 401);
  }
  const dbError = await withDb();
  if (dbError) {
    return dbError;
  }
  const context = await loadContext(session);
  if (!context?.papeis.educador) {
    return jsonError("Só educadores e administradores conectam um agente à contabilidade.", 403, { code: "NOT_EDUCATOR" });
  }
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const client = await loadClient(campo(body.client_id));
  const redirectUri = campo(body.redirect_uri);
  if (!client || !redirectRegistered(client, redirectUri)) {
    return jsonError("Este agente não é conhecido. Comece de novo no agente.", 400);
  }
  const state = campo(body.state) || undefined;
  if (body.decision !== "allow") {
    return NextResponse.json({ redirect: withParams(redirectUri, { error: "access_denied", error_description: "The user declined.", state }) });
  }
  const challenge = campo(body.code_challenge);
  if (campo(body.code_challenge_method) !== "S256" || !/^[A-Za-z0-9\-_]{43}$/.test(challenge)) {
    return NextResponse.json({
      redirect: withParams(redirectUri, { error: "invalid_request", error_description: "PKCE S256 code_challenge required", state }),
    });
  }
  const code = await createCode({
    clientId: String(client._id),
    userId: context.user._id,
    redirectUri,
    codeChallenge: challenge,
    scope: parseScope(campo(body.scope)),
  });
  return NextResponse.json({ redirect: withParams(redirectUri, { code, state }) });
}
