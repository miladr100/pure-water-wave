import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getMe } from "@/app/api/academia/me/route";
import { POST as login } from "@/app/api/academia/auth/login/route";
import { adoptSessionCookie, createUser, jsonRequest, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

describe("smoke: login then /me", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("rejects /me without a session and serves it after login", async () => {
    await createUser({ email: "a@example.test", password: "senha123", fullName: "Ana Teste" });

    const anonymous = await getMe();
    expect(anonymous.status).toBe(401);

    const response = await login(
      jsonRequest("/api/academia/auth/login", { body: { login: "a@example.test", password: "senha123" } }),
    );
    expect(response.status).toBe(200);
    adoptSessionCookie(response);

    const me = await getMe();
    expect(me.status).toBe(200);
    const body = await readJson<{ profile: { fullName: string; role: string } }>(me);
    expect(body.profile.fullName).toBe("Ana Teste");
    expect(body.profile.role).toBe("student");
  });
});
