import { describe, expect, it } from "vitest";

import { createSessionToken, isAdminSession, verifySessionToken } from "@/lib/academy/auth";

// The administrator flag rides in the session token only when true, so
// tokens minted before the flag existed verify to exactly what they carried.
describe("admin claim in the session token", () => {
  const base = { userId: "u1", login: "a@b.test", fullName: "Ana", role: "tutor" as const, language: "pt" as const };

  it("round-trips admin: true", async () => {
    const token = await createSessionToken({ ...base, admin: true });
    const payload = await verifySessionToken(token);
    expect(payload.admin).toBe(true);
    expect(isAdminSession(payload)).toBe(true);
  });

  it("leaves the key out when absent or false", async () => {
    expect(await verifySessionToken(await createSessionToken(base))).toEqual(base);
    expect(await verifySessionToken(await createSessionToken({ ...base, admin: false }))).toEqual(base);
  });

  it("a student is never an administrator, whatever the token says", async () => {
    const payload = await verifySessionToken(await createSessionToken({ ...base, role: "student", admin: true }));
    expect(isAdminSession(payload)).toBe(false);
  });
});
