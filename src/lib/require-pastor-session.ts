import { getSession, isSystemUserSession } from "@/lib/auth";

export async function requirePastorSession() {
  const session = await getSession();

  if (!session || !isSystemUserSession(session)) {
    return null;
  }

  return session;
}
