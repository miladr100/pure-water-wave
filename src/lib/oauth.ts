import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { Types } from "mongoose";

import { OAuthClient, OAuthCode, OAuthToken } from "@/models/oauth";

// Pure Water Wave as an OAuth 2.1 authorization server for MCP agent hosts,
// ported from Tensai Post / Tensai Plan so all three connect the same way.
//
//   1. POST /api/mcp/contabilidade without a token → 401 + WWW-Authenticate: … resource_metadata
//   2. GET  /.well-known/oauth-protected-resource[/api/mcp/contabilidade] → our authorization server
//   3. GET  /.well-known/oauth-authorization-server → our endpoints
//   4. POST /api/oauth/register (RFC 7591) → a client_id for this host
//   5. browser → /oauth/authorize?…&code_challenge=… → sign in, allow
//   6. POST /api/oauth/token (code + PKCE verifier) → access + refresh token
//   7. POST /api/mcp/contabilidade with Authorization: Bearer pwa_…
// Access tokens live an hour; refresh tokens thirty days and rotate on use;
// codes ten minutes, once.

export const ACCESS_TTL_S = 60 * 60;
export const REFRESH_TTL_S = 30 * 24 * 60 * 60;
export const CODE_TTL_S = 10 * 60;
export const SCOPES = ["read", "write"] as const;

export const ACCESS_PREFIX = "pwa_";
export const REFRESH_PREFIX = "pwr_";
export const CODE_PREFIX = "pwo_";
export const CLIENT_PREFIX = "pwc_";

export const MCP_PATH = "/api/mcp/contabilidade";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomToken = (prefix: string) => prefix + randomBytes(32).toString("base64url");

// ── pure ──────────────────────────────────────────────────────────────────

const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"];
const isLoopbackHost = (hostname: string) => LOOPBACK_HOSTS.includes(hostname.toLowerCase());

/** https anywhere, http only on the loopback, private-use schemes for native hosts; never a fragment. */
export function isAllowedRedirectUri(raw: string): boolean {
  if (typeof raw !== "string" || raw.length > 2048 || raw.includes("#")) {
    return false;
  }
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  const scheme = u.protocol.replace(":", "").toLowerCase();
  if (scheme === "https") {
    return Boolean(u.hostname);
  }
  if (scheme === "http") {
    return isLoopbackHost(u.hostname);
  }
  if (["javascript", "data", "file", "blob", "vbscript", "about"].includes(scheme)) {
    return false;
  }
  return /^[a-z][a-z0-9+.-]*$/.test(scheme);
}

/** Exact match, except a loopback redirect may use any port (RFC 8252 §7.3). */
export function redirectRegistered(client: { redirectUris: string[] }, uri: string): boolean {
  if (client.redirectUris.includes(uri)) {
    return true;
  }
  let given: URL;
  try {
    given = new URL(uri);
  } catch {
    return false;
  }
  if (given.protocol !== "http:" || !isLoopbackHost(given.hostname) || given.hash) {
    return false;
  }
  return client.redirectUris.some((registered) => {
    try {
      const r = new URL(registered);
      return (
        r.protocol === "http:" &&
        isLoopbackHost(r.hostname) &&
        r.hostname.toLowerCase() === given.hostname.toLowerCase() &&
        r.pathname === given.pathname &&
        r.search === given.search
      );
    } catch {
      return false;
    }
  });
}

/** PKCE S256: BASE64URL(SHA256(verifier)) must equal the challenge. */
export function pkceMatches(verifier: unknown, challenge: string): boolean {
  if (typeof verifier !== "string" || verifier.length < 43 || verifier.length > 128 || !/^[A-Za-z0-9\-._~]+$/.test(verifier)) {
    return false;
  }
  const digest = createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(digest);
  const b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseScope(raw: unknown): string {
  const words = typeof raw === "string" ? raw.split(/[\s+]+/).filter(Boolean) : [];
  const known = words.filter((w) => (SCOPES as readonly string[]).includes(w));
  return (known.length ? [...new Set(known)] : [...SCOPES]).join(" ");
}

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    revocation_endpoint: `${origin}/api/oauth/revoke`,
    scopes_supported: [...SCOPES],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    revocation_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    code_challenge_methods_supported: ["S256"],
  };
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}${MCP_PATH}`,
    authorization_servers: [origin],
    scopes_supported: [...SCOPES],
    bearer_methods_supported: ["header"],
    resource_name: "Contabilidade — Pure Water Wave",
  };
}

export type OAuthErrorCode =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unsupported_grant_type"
  | "access_denied"
  | "invalid_client_metadata"
  | "invalid_redirect_uri"
  | "server_error";

export class OAuthError extends Error {
  constructor(
    public code: OAuthErrorCode,
    public description: string,
    public status = 400,
  ) {
    super(description);
  }
}

/** Client credentials as a token endpoint may receive them: HTTP Basic, or in the body. */
export function clientCredentialsFrom(req: Request, body: Record<string, string>) {
  const auth = req.headers.get("authorization") || "";
  const m = /^Basic\s+([A-Za-z0-9+/=_-]+)$/i.exec(auth.trim());
  if (m) {
    try {
      const decoded = Buffer.from(m[1], "base64").toString("utf8");
      const i = decoded.indexOf(":");
      if (i > 0) {
        return { clientId: decodeURIComponent(decoded.slice(0, i)), clientSecret: decodeURIComponent(decoded.slice(i + 1)) };
      }
    } catch {
      // fall through to the body
    }
  }
  return { clientId: body.client_id ?? null, clientSecret: body.client_secret ?? null };
}

export function withParams(redirectUri: string, params: Record<string, string | undefined>): string {
  const u = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) {
      u.searchParams.set(k, v);
    }
  }
  return u.toString();
}

// ── clients ───────────────────────────────────────────────────────────────

export type RegistrationInput = Record<string, unknown>;

export function validateRegistration(input: RegistrationInput) {
  const uris = Array.isArray(input.redirect_uris) ? input.redirect_uris : [];
  if (!uris.length || uris.length > 10) {
    throw new OAuthError("invalid_redirect_uri", "redirect_uris must list 1–10 URIs");
  }
  for (const u of uris) {
    if (!isAllowedRedirectUri(String(u))) {
      throw new OAuthError("invalid_redirect_uri", `redirect_uri not allowed: ${String(u).slice(0, 120)}`);
    }
  }
  const method = typeof input.token_endpoint_auth_method === "string" ? input.token_endpoint_auth_method : "none";
  if (!["none", "client_secret_post", "client_secret_basic"].includes(method)) {
    throw new OAuthError("invalid_client_metadata", "token_endpoint_auth_method must be none, client_secret_post or client_secret_basic");
  }
  const grants = Array.isArray(input.grant_types) ? input.grant_types.map(String) : ["authorization_code"];
  for (const g of grants) {
    if (!["authorization_code", "refresh_token"].includes(g)) {
      throw new OAuthError("invalid_client_metadata", `grant_type not supported: ${g}`);
    }
  }
  const responses = Array.isArray(input.response_types) ? input.response_types.map(String) : ["code"];
  for (const r of responses) {
    if (r !== "code") {
      throw new OAuthError("invalid_client_metadata", `response_type not supported: ${r}`);
    }
  }
  const nome = typeof input.client_name === "string" && input.client_name.trim() ? input.client_name.trim().slice(0, 80) : "Agente";
  const clientUri = typeof input.client_uri === "string" && /^https:\/\//.test(input.client_uri) && input.client_uri.length < 500 ? input.client_uri : null;
  return { redirectUris: uris.map(String), method, nome, clientUri };
}

export async function registerClient(input: RegistrationInput) {
  const v = validateRegistration(input);
  const id = randomToken(CLIENT_PREFIX);
  const secret = v.method === "none" ? null : randomBytes(32).toString("base64url");
  const row = await OAuthClient.create({
    _id: id,
    secretHash: secret ? sha256(secret) : null,
    nome: v.nome,
    redirectUris: v.redirectUris,
    tokenEndpointAuthMethod: v.method,
    clientUri: v.clientUri,
  });
  return { row, secret };
}

export async function loadClient(clientId: string | null | undefined) {
  if (!clientId || typeof clientId !== "string" || clientId.length > 200) {
    return null;
  }
  return OAuthClient.findById(clientId).lean();
}

export function assertClientAuth(client: { secretHash?: string | null }, secret: string | null) {
  if (!client.secretHash) {
    return;
  }
  if (!secret) {
    throw new OAuthError("invalid_client", "client authentication required", 401);
  }
  const a = Buffer.from(sha256(secret));
  const b = Buffer.from(client.secretHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new OAuthError("invalid_client", "client authentication failed", 401);
  }
}

// ── codes ─────────────────────────────────────────────────────────────────

export async function createCode(input: { clientId: string; userId: Types.ObjectId; redirectUri: string; codeChallenge: string; scope: string }) {
  const code = randomToken(CODE_PREFIX);
  await OAuthCode.create({ ...input, codeHash: sha256(code), expiresAt: new Date(Date.now() + CODE_TTL_S * 1000) });
  return code;
}

/** A refresh token or code presented twice means a copy exists: the whole (client, user) family is revoked. */
export async function revokeGrantFamily(clientId: string, userId: Types.ObjectId | string) {
  const res = await OAuthToken.updateMany({ clientId, userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
  return res.modifiedCount;
}

export async function consumeCode(code: string, clientId: string, redirectUri: string, verifier: unknown) {
  const hash = sha256(code);
  const row = await OAuthCode.findOneAndUpdate({ codeHash: hash, usedAt: null }, { $set: { usedAt: new Date() } }).lean();
  if (!row) {
    const used = await OAuthCode.findOne({ codeHash: hash }).lean();
    if (used) {
      await revokeGrantFamily(used.clientId, used.userId);
    }
    throw new OAuthError("invalid_grant", "code is unknown, expired or already used");
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw new OAuthError("invalid_grant", "code expired");
  }
  if (row.clientId !== clientId) {
    throw new OAuthError("invalid_grant", "code was issued to another client");
  }
  if (row.redirectUri !== redirectUri) {
    throw new OAuthError("invalid_grant", "redirect_uri does not match the authorization request");
  }
  if (!pkceMatches(verifier, row.codeChallenge)) {
    throw new OAuthError("invalid_grant", "PKCE verification failed");
  }
  return row;
}

// ── tokens ────────────────────────────────────────────────────────────────

export type IssuedTokens = { access_token: string; token_type: "Bearer"; expires_in: number; refresh_token: string; scope: string };

export async function issueTokens(input: { clientId: string; userId: Types.ObjectId | string; scope: string }): Promise<IssuedTokens> {
  const access = randomToken(ACCESS_PREFIX);
  const refresh = randomToken(REFRESH_PREFIX);
  const now = Date.now();
  await OAuthToken.create({
    accessHash: sha256(access),
    refreshHash: sha256(refresh),
    clientId: input.clientId,
    userId: input.userId,
    scope: input.scope,
    accessExpiresAt: new Date(now + ACCESS_TTL_S * 1000),
    refreshExpiresAt: new Date(now + REFRESH_TTL_S * 1000),
  });
  await OAuthClient.updateOne({ _id: input.clientId }, { $set: { usadoEm: new Date() } });
  return { access_token: access, token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: refresh, scope: input.scope };
}

export async function rotateRefresh(refresh: string, clientId: string): Promise<IssuedTokens> {
  const hash = sha256(refresh);
  const row = await OAuthToken.findOneAndUpdate({ refreshHash: hash, revokedAt: null }, { $set: { revokedAt: new Date() } }).lean();
  if (!row) {
    const retired = await OAuthToken.findOne({ refreshHash: hash }).lean();
    if (retired) {
      await revokeGrantFamily(retired.clientId, retired.userId);
    }
    throw new OAuthError("invalid_grant", "refresh token is unknown, revoked or already used");
  }
  if (row.clientId !== clientId) {
    throw new OAuthError("invalid_grant", "refresh token belongs to another client");
  }
  if (row.refreshExpiresAt.getTime() < Date.now()) {
    throw new OAuthError("invalid_grant", "refresh token expired");
  }
  return issueTokens({ clientId: row.clientId, userId: row.userId, scope: row.scope });
}

/** A live access token → its grant row, or null. */
export async function resolveAccessToken(token: string) {
  if (!token.startsWith(ACCESS_PREFIX)) {
    return null;
  }
  const row = await OAuthToken.findOneAndUpdate(
    { accessHash: sha256(token), revokedAt: null, accessExpiresAt: { $gt: new Date() } },
    { $set: { usadoEm: new Date() } },
  ).lean();
  return row ?? null;
}

/** RFC 7009: revoke by either token of the pair. Always succeeds from the caller's view. */
export async function revokeToken(token: string, clientId: string | null) {
  const h = sha256(token);
  const row = await OAuthToken.findOne(token.startsWith(REFRESH_PREFIX) ? { refreshHash: h } : { accessHash: h }).lean();
  if (!row || (clientId && row.clientId !== clientId)) {
    return;
  }
  await OAuthToken.updateOne({ _id: row._id }, { $set: { revokedAt: new Date() } });
}

export type Grant = { id: string; nome: string; desde: string; usadoEm: string | null };

/** «Agentes conectados»: one line per host this person connected. */
export async function listGrants(userId: Types.ObjectId | string): Promise<Grant[]> {
  const rows = await OAuthToken.find({ userId, revokedAt: null, refreshExpiresAt: { $gt: new Date() } }).lean();
  if (!rows.length) {
    return [];
  }
  const clients = await OAuthClient.find({ _id: { $in: [...new Set(rows.map((row) => row.clientId))] } }).lean();
  const nomes = new Map(clients.map((client) => [String(client._id), client.nome]));
  const byClient = new Map<string, { nome: string; desde: Date; usadoEm: Date | null }>();
  for (const row of rows) {
    const atual = byClient.get(row.clientId);
    const created = row.createdAt as Date;
    if (!atual) {
      byClient.set(row.clientId, { nome: nomes.get(row.clientId) ?? "Agente", desde: created, usadoEm: row.usadoEm ?? null });
      continue;
    }
    if (created < atual.desde) {
      atual.desde = created;
    }
    if (row.usadoEm && (!atual.usadoEm || row.usadoEm > atual.usadoEm)) {
      atual.usadoEm = row.usadoEm;
    }
  }
  return [...byClient.entries()].map(([id, grant]) => ({
    id,
    nome: grant.nome,
    desde: grant.desde.toISOString(),
    usadoEm: grant.usadoEm ? grant.usadoEm.toISOString() : null,
  }));
}

export async function revokeClientForUser(userId: Types.ObjectId | string, clientId: string) {
  const res = await OAuthToken.updateMany({ userId, clientId, revokedAt: null }, { $set: { revokedAt: new Date() } });
  return res.modifiedCount;
}
