import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as listCourses } from "@/app/api/academia/cursos/route";
import { GET as getPhoto } from "@/app/api/academia/foto/[userId]/route";
import { DELETE as deletePhoto, POST as uploadPhoto } from "@/app/api/academia/me/foto/route";
import { GET as getMe, PATCH as patchMe } from "@/app/api/academia/me/route";
import { GET as listTutors } from "@/app/api/academia/tutores/route";
import { SESSION_COOKIE } from "@/lib/academy/session-cookie";
import type { CourseCard, MeProfile, MeResponse, TutorCard } from "@/lib/academy/types";
import { AcademyUser } from "@/models/academy-user";

import { createSampleCourse, createUser, jsonRequest, params, rawRequest, readJson, setCookieHeader, signInAs } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders, setSessionCookie } from "../helpers/next-headers";

type ValidationBody = { error: string; code?: string; fields?: Record<string, string> };

const patch = (body: Record<string, unknown>) => patchMe(jsonRequest("/api/academia/me", { method: "PATCH", body }));
const upload = (body: BodyInit | null, contentType = "image/jpeg") =>
  uploadPhoto(rawRequest("/api/academia/me/foto", { headers: { "content-type": contentType }, body }));
const photo = (userId: string, headers: Record<string, string> = {}) =>
  getPhoto(rawRequest(`/api/academia/foto/${userId}`, { method: "GET", headers }), params({ userId }));

async function profile() {
  const response = await getMe();
  expect(response.status).toBe(200);
  return (await readJson<MeResponse>(response)).profile;
}

describe("GET /api/academia/me", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("describes a fresh account with every optional field empty", async () => {
    const user = await createUser({ fullName: "Ana Teste", email: "ana@example.test", country: "Brasil" });
    await signInAs(user);

    const me = await profile();
    expect(me).toEqual({
      id: user._id.toString(),
      fullName: "Ana Teste",
      email: "ana@example.test",
      role: "student",
      language: "pt",
      country: "Brasil",
      city: "",
      phone: "",
      birthday: null,
      photoUrl: null,
      theme: "system",
      showOtherLanguage: false,
      tutor: null,
      createdAt: user.createdAt.toISOString(),
    } satisfies MeProfile);
  });
});

describe("PATCH /api/academia/me", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses an anonymous caller", async () => {
    expect((await patch({ city: "Lisboa" })).status).toBe(401);
  });

  it("stores every valid field", async () => {
    const user = await createUser();
    await signInAs(user);

    const response = await patch({
      fullName: "  Beatriz Silva ",
      country: "Portugal",
      city: " Porto ",
      phone: "+351 912 345 678",
      birthday: "1990-07-01",
      language: "es",
      theme: "dark",
      showOtherLanguage: true,
    });
    expect(response.status).toBe(200);

    const body = await readJson<{ profile: MeProfile }>(response);
    expect(body.profile).toMatchObject({
      fullName: "Beatriz Silva",
      country: "Portugal",
      city: "Porto",
      phone: "+351 912 345 678",
      birthday: "1990-07-01",
      language: "es",
      theme: "dark",
      showOtherLanguage: true,
    });

    const stored = await AcademyUser.findById(user._id).lean();
    expect(stored?.birthday?.toISOString()).toBe("1990-07-01T00:00:00.000Z");
    expect(stored?.theme).toBe("dark");
  });

  it("names every invalid field at once and stores nothing", async () => {
    const user = await createUser({ fullName: "Antes" });
    await signInAs(user);

    const response = await patch({
      fullName: "A",
      phone: "abc",
      birthday: "2999-01-01",
      country: "Narnia",
      theme: "sepia",
      language: "fr",
      assignedTutorId: "000000000000000000000000",
    });
    expect(response.status).toBe(400);

    const body = await readJson<ValidationBody>(response);
    expect(body.code).toBe("validation");
    expect(body.fields).toEqual({
      fullName: "invalid",
      phone: "invalid",
      birthday: "invalid",
      country: "invalid",
      theme: "invalid",
      language: "invalid",
      assignedTutorId: "tutor_not_found",
    });
    expect((await AcademyUser.findById(user._id).lean())?.fullName).toBe("Antes");
  });

  it("keeps the current country when the form sends it empty and clears a birthday on null", async () => {
    const user = await createUser({ country: "Peru", birthday: new Date("1980-01-01T00:00:00Z") });
    await signInAs(user);

    const body = await readJson<{ profile: MeProfile }>(await patch({ country: "", birthday: null }));
    expect(body.profile.country).toBe("Peru");
    expect(body.profile.birthday).toBeNull();
  });

  it("assigns and detaches a tutor, ignoring an attempt to pick oneself", async () => {
    const tutor = await createUser({ fullName: "Tutora", role: "tutor", country: "Chile" });
    const user = await createUser();
    await signInAs(user);

    const assigned = await readJson<{ profile: MeProfile }>(await patch({ assignedTutorId: tutor._id.toString() }));
    expect(assigned.profile.tutor).toEqual({ id: tutor._id.toString(), fullName: "Tutora", country: "Chile", photoUrl: null });

    const self = await patch({ assignedTutorId: user._id.toString() });
    expect(self.status).toBe(200);
    expect((await readJson<{ profile: MeProfile }>(self)).profile.tutor?.id).toBe(tutor._id.toString());

    const detached = await readJson<{ profile: MeProfile }>(await patch({ assignedTutorId: null }));
    expect(detached.profile.tutor).toBeNull();
    expect((await AcademyUser.findById(user._id).lean())?.assignedTutorId).toBeNull();
  });

  it("reissues the session cookie when the name or language changes, not otherwise", async () => {
    const user = await createUser({ fullName: "Antes" });
    await signInAs(user);

    const city = await patch({ city: "Lisboa" });
    expect(setCookieHeader(city)).toBe("");

    const name = await patch({ fullName: "Depois" });
    expect(setCookieHeader(name)).toContain(`${SESSION_COOKIE}=`);
  });

  it("flips the catalogue to show other languages", async () => {
    // A pt course must exist, otherwise the catalogue falls back to every
    // language on its own.
    await createSampleCourse({ slug: "em-portugues", language: "pt" });
    await createSampleCourse({ slug: "em-espanhol", language: "es" });
    const user = await createUser({ language: "pt" });
    await signInAs(user);

    const hidden = await readJson<{ courses: CourseCard[] }>(await listCourses());
    expect(hidden.courses.map((course) => course.slug)).toEqual(["em-portugues"]);

    await patch({ showOtherLanguage: true });
    const shown = await readJson<{ courses: CourseCard[] }>(await listCourses());
    expect(shown.courses.map((course) => course.slug)).toEqual(["em-portugues", "em-espanhol"]);
  });
});

describe("profile photo", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);

  it("refuses an anonymous upload", async () => {
    expect((await upload(JPEG)).status).toBe(401);
  });

  it("rejects a non-image type, an empty body and a body over 4 MB", async () => {
    await signInAs(await createUser());

    const text = await upload(Buffer.from("hello"), "text/plain");
    expect(text.status).toBe(415);
    expect((await readJson<ValidationBody>(text)).code).toBe("unsupported_type");

    const empty = await upload(Buffer.alloc(0));
    expect(empty.status).toBe(400);
    expect((await readJson<ValidationBody>(empty)).code).toBe("empty");

    const huge = await upload(Buffer.alloc(4 * 1024 * 1024 + 1, 1));
    expect(huge.status).toBe(413);
    expect((await readJson<ValidationBody>(huge)).code).toBe("too_large");
  });

  it("stores the photo, serves it with cache headers and removes it on request", async () => {
    const user = await createUser();
    await signInAs(user);
    const userId = user._id.toString();

    const missing = await photo(userId);
    expect(missing.status).toBe(404);

    const uploaded = await upload(JPEG, "image/jpeg; charset=binary");
    expect(uploaded.status).toBe(200);
    const { photoUrl } = await readJson<{ photoUrl: string }>(uploaded);
    expect(photoUrl).toMatch(new RegExp(`^/api/academia/foto/${userId}\\?v=\\d+$`));
    expect((await profile()).photoUrl).toBe(photoUrl);

    const served = await photo(userId);
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/jpeg");
    expect(served.headers.get("cache-control")).toBe("private, max-age=31536000, immutable");
    expect(served.headers.get("content-length")).toBe(String(JPEG.byteLength));
    const etag = served.headers.get("etag") ?? "";
    expect(etag).toMatch(/^"\d+"$/);
    expect(Buffer.from(await served.arrayBuffer()).equals(JPEG)).toBe(true);

    const cached = await photo(userId, { "if-none-match": etag });
    expect(cached.status).toBe(304);

    const removed = await deletePhoto();
    expect(removed.status).toBe(200);
    expect((await photo(userId)).status).toBe(404);
    expect((await profile()).photoUrl).toBeNull();
  });

  it("serves a photo only to a signed-in academy user", async () => {
    const owner = await createUser();
    await signInAs(owner);
    await upload(JPEG);
    const userId = owner._id.toString();

    setSessionCookie(null);
    expect((await photo(userId)).status).toBe(401);

    await signInAs(await createUser({ role: "tutor" }));
    expect((await photo(userId)).status).toBe(200);
    expect((await photo("not-an-id")).status).toBe(404);
    expect((await photo("000000000000000000000000")).status).toBe(404);
  });
});

describe("GET /api/academia/tutores", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("lists tutors only, the student's own country first, then by name", async () => {
    await createUser({ fullName: "Outro Aluno", country: "Peru" });
    const chile = await createUser({ fullName: "Ana", role: "tutor", country: "Chile" });
    const peruB = await createUser({ fullName: "Bruno", role: "tutor", country: "Peru" });
    const peruA = await createUser({ fullName: "Álvaro", role: "tutor", country: "Peru" });
    await signInAs(await createUser({ country: "Peru" }));

    const response = await listTutors();
    expect(response.status).toBe(200);

    const body = await readJson<{ tutors: TutorCard[] }>(response);
    expect(body.tutors.map((tutor) => tutor.id)).toEqual([peruA._id.toString(), peruB._id.toString(), chile._id.toString()]);
    expect(body.tutors[0]).toEqual({ id: peruA._id.toString(), fullName: "Álvaro", country: "Peru", photoUrl: null });
  });

  it("refuses an anonymous caller", async () => {
    expect((await listTutors()).status).toBe(401);
  });
});
