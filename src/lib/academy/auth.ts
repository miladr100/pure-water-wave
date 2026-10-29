import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/academy/session-cookie";
import { isUserLanguage, type UserLanguage } from "@/lib/user-languages";
import { isAcademyRole, type AcademyRole } from "@/lib/academy/roles";

export { SESSION_COOKIE } from "@/lib/academy/session-cookie";

export type SessionPayload = {
  userId: string;
  login: string;
  fullName: string;
  role: AcademyRole;
  language: UserLanguage;
};

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não está definido no .env");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());
  const userId = payload.userId;
  const login = payload.login;
  const fullName = payload.fullName;
  const role = payload.role;
  const language = isUserLanguage(payload.language) ? payload.language : "pt";

  if (
    typeof userId !== "string" ||
    typeof login !== "string" ||
    typeof fullName !== "string" ||
    !isAcademyRole(role)
  ) {
    throw new Error("Sessão inválida");
  }

  return { userId, login, fullName, role, language } satisfies SessionPayload;
}

export function isAcademySession(session: SessionPayload | null) {
  return session != null && isAcademyRole(session.role);
}

export function isTutorSession(session: SessionPayload | null) {
  return session?.role === "tutor";
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}
