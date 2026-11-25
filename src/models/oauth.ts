import { Schema, model, models } from "mongoose";

// OAuth 2.1 for the Contabilidade's agent connector (MCP): an agent host
// (Claude, ChatGPT…) registers itself, the person signs in and allows it, and
// the host gets tokens. Ported from Tensai Post (lib/oauth.ts) to Mongo. Only
// hashes of codes and tokens are stored.

const oauthClientSchema = new Schema(
  {
    _id: { type: String },
    secretHash: { type: String, default: null },
    nome: { type: String, required: true },
    redirectUris: { type: [String], required: true },
    tokenEndpointAuthMethod: { type: String, default: "none" },
    clientUri: { type: String, default: null },
    usadoEm: { type: Date, default: null },
  },
  { timestamps: true, collection: "oauth_clients" },
);

const oauthCodeSchema = new Schema(
  {
    codeHash: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true },
    redirectUri: { type: String, required: true },
    codeChallenge: { type: String, required: true },
    scope: { type: String, default: "read write" },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "oauth_codes" },
);

const oauthTokenSchema = new Schema(
  {
    accessHash: { type: String, required: true, unique: true },
    refreshHash: { type: String, required: true, unique: true },
    clientId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "AcademyUser", required: true, index: true },
    scope: { type: String, default: "read write" },
    accessExpiresAt: { type: Date, required: true },
    refreshExpiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    usadoEm: { type: Date, default: null },
  },
  { timestamps: true, collection: "oauth_tokens" },
);

for (const name of ["OAuthClient", "OAuthCode", "OAuthToken"]) {
  if (models[name]) {
    delete models[name];
  }
}

export const OAuthClient = model("OAuthClient", oauthClientSchema, "oauth_clients");
export const OAuthCode = model("OAuthCode", oauthCodeSchema, "oauth_codes");
export const OAuthToken = model("OAuthToken", oauthTokenSchema, "oauth_tokens");
