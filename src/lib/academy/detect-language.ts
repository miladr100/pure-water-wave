import { headers } from "next/headers";

import { isUserLanguage, type UserLanguage } from "@/lib/user-languages";

// Before sign-in there is no account language, so the public pages follow
// the browser; after sign-in the session wins (see the area layouts).
export async function detectLanguage(): Promise<UserLanguage> {
  const accept = (await headers()).get("accept-language") ?? "";

  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isUserLanguage(code)) {
      return code;
    }
  }

  return "pt";
}
