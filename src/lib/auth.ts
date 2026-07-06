import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/session-cookie";
import { isUserRole, type UserRole } from "@/lib/user-roles";

export { SESSION_COOKIE } from "@/lib/session-cookie";

export type SessionPayload = {
  userId: string;
  login: string;
  fullName: string;
  role: UserRole;
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

  if (
    typeof userId !== "string" ||
    typeof login !== "string" ||
    typeof fullName !== "string" ||
    !isUserRole(role)
  ) {
    throw new Error("Sessão inválida");
  }

  return { userId, login, fullName, role } satisfies SessionPayload;
}

export function isPastorSession(session: SessionPayload | null) {
  return session?.role === "pastor";
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
