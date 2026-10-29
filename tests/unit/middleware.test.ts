import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";

import { createSessionToken } from "@/lib/academy/auth";
import { config, middleware } from "@/middleware";

let studentToken: string;
let tutorToken: string;
let pastorToken: string;
let foreignToken: string;

function sign(secret: string, claims: Record<string, unknown>) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}

beforeAll(async () => {
  const secret = process.env.AUTH_SECRET!;
  studentToken = await createSessionToken({
    userId: "u1",
    login: "ana@example.com",
    fullName: "Ana",
    role: "student",
    language: "pt",
  });
  tutorToken = await createSessionToken({
    userId: "t1",
    login: "tutor@example.com",
    fullName: "Tutor",
    role: "tutor",
    language: "pt",
  });
  pastorToken = await sign(secret, { userId: "p1", role: "pastor" });
  foreignToken = await sign("not-the-secret", { userId: "u1", role: "tutor" });
});

function request(path: string, cookie?: { name: string; value: string }) {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie: `${cookie.name}=${cookie.value}` } : {},
  });
}

const academy = (path: string, token?: string) =>
  middleware(request(path, token ? { name: "pww_academy_session", value: token } : undefined));

function expectNext(response: Response) {
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  expect(response.headers.get("x-middleware-next")).toBe("1");
}

function expectRedirectToLogin(response: Response, next: string) {
  expect(response.status).toBe(307);
  const location = new URL(response.headers.get("location")!);
  expect(location.pathname).toBe("/login");
  expect(location.searchParams.get("next")).toBe(next);
  expect(location.search).toBe(`?next=${encodeURIComponent(next)}`);
}

function expectHiddenPage(response: Response) {
  const rewrite = response.headers.get("x-middleware-rewrite");
  expect(rewrite).not.toBeNull();
  expect(new URL(rewrite!).pathname).toBe("/__nao-encontrado");
  expect(response.headers.get("location")).toBeNull();
}

async function expectJsonError(response: Response, status: number, error: string) {
  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toEqual({ error });
}

describe("academy pages", () => {
  it("sends an anonymous visitor to the login with the page as next", async () => {
    expectRedirectToLogin(await academy("/academia"), "/academia");
    expectRedirectToLogin(await academy("/academia/cursos/intro"), "/academia/cursos/intro");
  });

  it("lets the login, sign-up and password reset pages through without a session", async () => {
    for (const path of ["/api/academia/auth/login", "/api/academia/auth/logout"]) {
      expectNext(await academy(path));
    }
  });

  it("lets a student in", async () => {
    expectNext(await academy("/academia", studentToken));
    expectNext(await academy("/academia/perfil", tutorToken));
  });

  it("treats a token signed with another secret as no session", async () => {
    expectRedirectToLogin(await academy("/academia", foreignToken), "/academia");
    expectRedirectToLogin(await academy("/academia", "garbage"), "/academia");
  });

  it("treats a library session (pastor role) as no academy session", async () => {
    expectRedirectToLogin(await academy("/academia", pastorToken), "/academia");
  });

  it("ignores the library's cookie", async () => {
    const response = await middleware(request("/academia", { name: "pww_session", value: tutorToken }));
    expectRedirectToLogin(response, "/academia");
  });
});

describe("academy API", () => {
  it("answers 401 JSON without a session", async () => {
    await expectJsonError(await academy("/api/academia/me"), 401, "Não autorizado");
    await expectJsonError(await academy("/api/academia/me", foreignToken), 401, "Não autorizado");
  });

  it("lets the auth routes through without a session", async () => {
    expectNext(await academy("/api/academia/auth/login"));
    expectNext(await academy("/api/academia/auth/register"));
  });

  it("lets a student call the API", async () => {
    expectNext(await academy("/api/academia/me", studentToken));
  });
});

describe("admin area", () => {
  it("hides the panel behind a 404 rewrite for anonymous visitors", async () => {
    expectHiddenPage(await academy("/admin"));
    expectHiddenPage(await academy("/admin/alunos"));
  });

  it("hides the admin API behind a 404 JSON for anonymous visitors", async () => {
    await expectJsonError(await academy("/api/admin/overview"), 404, "Não encontrado");
  });

  it("hides the panel and its API from a student", async () => {
    expectHiddenPage(await academy("/admin", studentToken));
    await expectJsonError(await academy("/api/admin/x", studentToken), 404, "Não encontrado");
  });

  it("hides the panel from a forged or foreign token", async () => {
    expectHiddenPage(await academy("/admin", foreignToken));
    expectHiddenPage(await academy("/admin", pastorToken));
    await expectJsonError(await academy("/api/admin/x", pastorToken), 404, "Não encontrado");
  });

  it("opens the panel and its API to a tutor", async () => {
    expectNext(await academy("/admin", tutorToken));
    expectNext(await academy("/admin/alunos", tutorToken));
    expectNext(await academy("/api/admin/x", tutorToken));
  });
});

describe("library branch", () => {
  it("still redirects the library to its own login without pww_session", async () => {
    const response = await middleware(request("/biblioteca"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });

  it("still answers 401 on the library API without pww_session", async () => {
    await expectJsonError(await middleware(request("/api/biblioteca/x")), 401, "Não autorizado");
  });

  it("does not accept an academy session for the library", async () => {
    const response = await middleware(request("/biblioteca", { name: "pww_session", value: tutorToken }));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    const api = await middleware(request("/api/biblioteca/x", { name: "pww_session", value: tutorToken }));
    await expectJsonError(api, 403, "Não autorizado");
  });

  it("lets a pastor into the library", async () => {
    expectNext(await middleware(request("/biblioteca", { name: "pww_session", value: pastorToken })));
  });
});

describe("matcher", () => {
  it("lists the seven protected prefixes", () => {
    expect(config.matcher).toEqual([
      "/biblioteca/:path*",
      "/painel/:path*",
      "/api/biblioteca/:path*",
      "/academia/:path*",
      "/admin/:path*",
      "/api/academia/:path*",
      "/api/admin/:path*",
    ]);
  });
});
