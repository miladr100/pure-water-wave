import { getSession, isAcademySession, isTutorSession } from "@/lib/academy/auth";

export async function requireAcademySession() {
  const session = await getSession();

  if (!session || !isAcademySession(session)) {
    return null;
  }

  return session;
}

export async function requireTutorSession() {
  const session = await getSession();

  if (!session || !isTutorSession(session)) {
    return null;
  }

  return session;
}
