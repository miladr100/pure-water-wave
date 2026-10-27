import { describe, expect, it } from "vitest";

import { isPhotoContentType, normalizePhotoContentType, PHOTO_CONTENT_TYPES, PHOTO_MAX_BYTES } from "@/lib/academy/photo";
import {
  formatBirthday,
  meProfile,
  parseBirthday,
  photoUrlOf,
  PROFILE_FIELDS,
  tutorCard,
  TUTOR_CARD_FIELDS,
  type ProfileDoc,
} from "@/lib/academy/profile";

const PHOTO_AT = new Date("2026-03-04T05:06:07.890Z");

describe("formatBirthday", () => {
  it("renders a stored UTC midnight as yyyy-mm-dd", () => {
    expect(formatBirthday(new Date(Date.UTC(1990, 0, 1)))).toBe("1990-01-01");
    expect(formatBirthday(new Date("2000-12-31T23:59:59Z"))).toBe("2000-12-31");
  });

  it("is null for a missing or invalid date", () => {
    expect(formatBirthday(null)).toBeNull();
    expect(formatBirthday(undefined)).toBeNull();
    expect(formatBirthday(new Date("nope"))).toBeNull();
  });
});

describe("parseBirthday", () => {
  it("accepts a real calendar day as UTC midnight, trimmed", () => {
    expect(parseBirthday("1990-07-15")?.toISOString()).toBe("1990-07-15T00:00:00.000Z");
    expect(parseBirthday(" 2000-02-29 ")?.toISOString()).toBe("2000-02-29T00:00:00.000Z");
    expect(parseBirthday("1900-01-01")?.toISOString()).toBe("1900-01-01T00:00:00.000Z");
  });

  it("rejects other formats", () => {
    expect(parseBirthday("15/07/1990")).toBeNull();
    expect(parseBirthday("1990-7-15")).toBeNull();
    expect(parseBirthday("1990-07-15T00:00:00Z")).toBeNull();
    expect(parseBirthday("")).toBeNull();
    expect(parseBirthday("yesterday")).toBeNull();
  });

  it("rejects days that do not exist instead of rolling them over", () => {
    expect(parseBirthday("2024-02-30")).toBeNull();
    expect(parseBirthday("2023-02-29")).toBeNull();
    expect(parseBirthday("2024-04-31")).toBeNull();
    expect(parseBirthday("2024-13-01")).toBeNull();
    expect(parseBirthday("2024-00-10")).toBeNull();
  });

  it("rejects a day in the future", () => {
    const nextYear = new Date().getUTCFullYear() + 1;
    expect(parseBirthday(`${nextYear}-01-01`)).toBeNull();
  });

  it("rejects years before 1900", () => {
    expect(parseBirthday("1899-12-31")).toBeNull();
    expect(parseBirthday("0999-01-01")).toBeNull();
  });
});

describe("photoUrlOf", () => {
  it("is null while the user has no photo", () => {
    expect(photoUrlOf({ _id: "u1" })).toBeNull();
    expect(photoUrlOf({ _id: "u1", photoUpdatedAt: null })).toBeNull();
  });

  it("points at the photo route with the upload time as cache buster", () => {
    expect(photoUrlOf({ _id: { toString: () => "abc" }, photoUpdatedAt: PHOTO_AT })).toBe(
      `/api/academia/foto/abc?v=${PHOTO_AT.getTime()}`,
    );
  });
});

describe("tutorCard", () => {
  it("builds the public card with an empty country when none is set", () => {
    expect(tutorCard({ _id: "t1", fullName: "Maria Silva", photoUpdatedAt: PHOTO_AT })).toEqual({
      id: "t1",
      fullName: "Maria Silva",
      country: "",
      photoUrl: `/api/academia/foto/t1?v=${PHOTO_AT.getTime()}`,
    });
    expect(tutorCard({ _id: "t2", fullName: "João", country: "Brasil" })).toEqual({
      id: "t2",
      fullName: "João",
      country: "Brasil",
      photoUrl: null,
    });
  });
});

describe("meProfile", () => {
  const full: ProfileDoc = {
    _id: { toString: () => "u1" },
    fullName: "Ana Souza",
    email: "ana@example.com",
    role: "student",
    language: "es",
    country: "Argentina",
    city: "Córdoba",
    phone: "+54 11",
    birthday: new Date(Date.UTC(1995, 4, 20)),
    theme: "dark",
    showOtherLanguage: true,
    photoUpdatedAt: PHOTO_AT,
    assignedTutorId: { _id: "t1", fullName: "Maria Silva", country: "Brasil", photoUpdatedAt: null },
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
  };

  it("serialises a populated document field by field", () => {
    expect(meProfile(full)).toEqual({
      id: "u1",
      fullName: "Ana Souza",
      email: "ana@example.com",
      role: "student",
      language: "es",
      country: "Argentina",
      city: "Córdoba",
      phone: "+54 11",
      birthday: "1995-05-20",
      photoUrl: `/api/academia/foto/u1?v=${PHOTO_AT.getTime()}`,
      theme: "dark",
      showOtherLanguage: true,
      tutor: { id: "t1", fullName: "Maria Silva", country: "Brasil", photoUrl: null },
      createdAt: "2026-01-02T03:04:05.000Z",
    });
  });

  it("fills defaults for a bare document", () => {
    const profile = meProfile({ _id: "u2", fullName: "Bare", email: "b@example.com", role: "tutor" });
    expect(profile).toEqual({
      id: "u2",
      fullName: "Bare",
      email: "b@example.com",
      role: "tutor",
      language: "pt",
      country: "",
      city: "",
      phone: "",
      birthday: null,
      photoUrl: null,
      theme: "system",
      showOtherLanguage: false,
      tutor: null,
      createdAt: new Date(0).toISOString(),
    });
  });

  it("falls back to the system theme for an unknown stored value", () => {
    expect(meProfile({ ...full, theme: "sepia" }).theme).toBe("system");
    expect(meProfile({ ...full, theme: null }).theme).toBe("system");
  });

  it("reads an unpopulated tutor id as no tutor", () => {
    expect(meProfile({ ...full, assignedTutorId: "t1" }).tutor).toBeNull();
    expect(meProfile({ ...full, assignedTutorId: { toString: () => "t1" } }).tutor).toBeNull();
    expect(meProfile({ ...full, assignedTutorId: null }).tutor).toBeNull();
  });

  it("selects every field the profile reads", () => {
    const selected = PROFILE_FIELDS.split(" ");
    for (const field of [
      "fullName",
      "email",
      "role",
      "language",
      "country",
      "city",
      "phone",
      "birthday",
      "theme",
      "showOtherLanguage",
      "photoUpdatedAt",
      "assignedTutorId",
      "createdAt",
    ]) {
      expect(selected).toContain(field);
    }
    expect(TUTOR_CARD_FIELDS.split(" ")).toEqual(["fullName", "country", "photoUpdatedAt"]);
  });
});

describe("photo", () => {
  it("allows 4 MB", () => {
    expect(PHOTO_MAX_BYTES).toBe(4 * 1024 * 1024);
  });

  it("accepts jpeg, png and webp, ignoring parameters and case", () => {
    expect(PHOTO_CONTENT_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(isPhotoContentType("image/jpeg")).toBe(true);
    expect(isPhotoContentType("image/png")).toBe(true);
    expect(isPhotoContentType("image/webp")).toBe(true);
    expect(isPhotoContentType("IMAGE/PNG; charset=binary")).toBe(true);
    expect(isPhotoContentType(" image/jpeg ")).toBe(true);
  });

  it("rejects other types and non-strings", () => {
    expect(isPhotoContentType("image/gif")).toBe(false);
    expect(isPhotoContentType("image/svg+xml")).toBe(false);
    expect(isPhotoContentType("text/html")).toBe(false);
    expect(isPhotoContentType("")).toBe(false);
    expect(isPhotoContentType(null)).toBe(false);
    expect(isPhotoContentType(undefined)).toBe(false);
  });

  it("normalises a content type to its bare lower-case form", () => {
    expect(normalizePhotoContentType("IMAGE/WebP; q=1")).toBe("image/webp");
  });
});
