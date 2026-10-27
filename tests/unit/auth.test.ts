import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSessionToken,
  getSession,
  getSessionCookieOptions,
  isAcademySession,
  isTutorSession,
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/academy/auth";

import { resetNextHeaders, setSessionCookie } from "../helpers/next-headers";

vi.mock("next/headers", () => import("../helpers/next-headers"));

const student: SessionPayload = {
  userId: "u1",
  login: "ana@example.com",
  fullName: "Ana Souza",
  role: "student",
  language: "es",
};

const tutor: SessionPayload = { ...student, userId: "t1", login: "tutor@example.com", role: "tutor" };

function signWith(secret: string, claims: Record<string, unknown>) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));
}

beforeEach(() => {
  resetNextHeaders();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session tokens", () => {
  it("round-trips the payload through sign and verify", async () => {
    const token = await createSessionToken(student);
    expect(token.split(".")).toHaveLength(3);
    await expect(verifySessionToken(token)).resolves.toEqual(student);
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken(student);
    const [header, payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...student, role: "tutor" })).toString("base64url");
    await expect(verifySessionToken(`${header}.${forged}.${signature}`)).rejects.toThrow();
    await expect(verifySessionToken(`${header}.${payload}.AAAA`)).rejects.toThrow();
    await expect(verifySessionToken("garbage")).rejects.toThrow();
  });

  it("rejects a token signed with another secret", async () => {
    const foreign = await signWith("another-secret", student);
    await expect(verifySessionToken(foreign)).rejects.toThrow();
  });

  it("rejects a token whose role is not an academy role", async () => {
    const pastor = await signWith(process.env.AUTH_SECRET!, { ...student, role: "pastor" });
    await expect(verifySessionToken(pastor)).rejects.toThrow("Sessão inválida");
  });

  it("rejects a token missing the identity claims", async () => {
    const secret = process.env.AUTH_SECRET!;
    await expect(verifySessionToken(await signWith(secret, { ...student, userId: 1 }))).rejects.toThrow();
    await expect(verifySessionToken(await signWith(secret, { ...student, login: undefined }))).rejects.toThrow();
    await expect(verifySessionToken(await signWith(secret, { ...student, fullName: null }))).rejects.toThrow();
  });

  it("falls back to Portuguese for an unknown language", async () => {
    const token = await signWith(process.env.AUTH_SECRET!, { ...student, language: "fr" });
    expect((await verifySessionToken(token)).language).toBe("pt");
    const missing = await signWith(process.env.AUTH_SECRET!, { ...student, language: undefined });
    expect((await verifySessionToken(missing)).language).toBe("pt");
  });

  it("refuses to sign without AUTH_SECRET", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    await expect(createSessionToken(student)).rejects.toThrow("AUTH_SECRET");
  });
});

describe("session predicates", () => {
  it("tells tutors from students and both from no session", () => {
    expect(isTutorSession(tutor)).toBe(true);
    expect(isTutorSession(student)).toBe(false);
    expect(isTutorSession(null)).toBe(false);
    expect(isAcademySession(tutor)).toBe(true);
    expect(isAcademySession(student)).toBe(true);
    expect(isAcademySession(null)).toBe(false);
    expect(isAcademySession({ ...student, role: "pastor" as SessionPayload["role"] })).toBe(false);
  });
});

describe("getSessionCookieOptions", () => {
  it("sets an http-only, lax, site-wide cookie for seven days", () => {
    const options = getSessionCookieOptions("tok");
    expect(options).toMatchObject({
      name: SESSION_COOKIE,
      value: "tok",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  });

  it("marks the cookie secure only in production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getSessionCookieOptions("tok").secure).toBe(false);
    vi.stubEnv("NODE_ENV", "test");
    expect(getSessionCookieOptions("tok").secure).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    expect(getSessionCookieOptions("tok").secure).toBe(true);
  });
});

describe("getSession", () => {
  it("is null without a cookie", async () => {
    await expect(getSession()).resolves.toBeNull();
  });

  it("is null with a bad token instead of throwing", async () => {
    setSessionCookie("not-a-jwt");
    await expect(getSession()).resolves.toBeNull();
    setSessionCookie(await signWith("another-secret", student));
    await expect(getSession()).resolves.toBeNull();
  });

  it("returns the payload for a good token", async () => {
    setSessionCookie(await createSessionToken(tutor));
    await expect(getSession()).resolves.toEqual(tutor);
  });
});
