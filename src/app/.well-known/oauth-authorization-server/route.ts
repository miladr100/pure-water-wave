import { authorizationServerMetadata } from "@/lib/oauth";
import { oauthJson, oauthPreflight, publicOrigin } from "@/lib/oauth-http";

export const OPTIONS = () => oauthPreflight();
export const GET = (req: Request) => oauthJson(authorizationServerMetadata(publicOrigin(req)));
