import { getSession, isPastorSession } from "@/lib/auth";

export async function requirePastorSession() {
  const session = await getSession();

  if (!session || !isPastorSession(session)) {
    return null;
  }

  return session;
}
