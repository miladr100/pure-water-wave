import { afterEach, describe, expect, it, vi } from "vitest";

import { COUNTRIES, COUNTRIES_MAIN, COUNTRIES_REST, isCountry } from "@/lib/academy/countries";
import { isValidTutorSecret } from "@/lib/academy/register-secret";
import { ACADEMY_ROLE_LABELS, ACADEMY_ROLES, isAcademyRole } from "@/lib/academy/roles";
import { SESSION_COOKIE as ACADEMY_SESSION_COOKIE } from "@/lib/academy/session-cookie";
import { SESSION_COOKIE as LIBRARY_SESSION_COOKIE } from "@/lib/session-cookie";

describe("countries", () => {
  it("lists the movement's countries first, then the rest, with no duplicates", () => {
    expect(COUNTRIES.slice(0, COUNTRIES_MAIN.length)).toEqual([...COUNTRIES_MAIN]);
    expect(COUNTRIES.slice(COUNTRIES_MAIN.length)).toEqual([...COUNTRIES_REST]);
    expect(new Set(COUNTRIES).size).toBe(COUNTRIES.length);
    expect(COUNTRIES[0]).toBe("Brasil");
    expect(COUNTRIES[COUNTRIES.length - 1]).toBe("Outro");
  });

  it("matches a country by exact string only", () => {
    expect(isCountry("Brasil")).toBe(true);
    expect(isCountry("Outro")).toBe(true);
    expect(isCountry("brasil")).toBe(false);
    expect(isCountry("Brasil ")).toBe(false);
    expect(isCountry("Brazil")).toBe(false);
    expect(isCountry(null)).toBe(false);
    expect(isCountry(1)).toBe(false);
  });
});

describe("roles", () => {
  it("knows only student and tutor, each with a label", () => {
    expect(ACADEMY_ROLES).toEqual(["student", "tutor"]);
    expect(Object.keys(ACADEMY_ROLE_LABELS).sort()).toEqual(["student", "tutor"]);
    expect(ACADEMY_ROLE_LABELS.student).toBe("Aluno");
    expect(ACADEMY_ROLE_LABELS.tutor).toBe("Educador(a)");
  });

  it("rejects the library's roles and anything that is not a string", () => {
    expect(isAcademyRole("student")).toBe(true);
    expect(isAcademyRole("tutor")).toBe(true);
    expect(isAcademyRole("pastor")).toBe(false);
    expect(isAcademyRole("hjteam")).toBe(false);
    expect(isAcademyRole("Tutor")).toBe(false);
    expect(isAcademyRole(undefined)).toBe(false);
    expect(isAcademyRole({})).toBe(false);
  });
});

describe("isValidTutorSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("never accepts a secret while TUTOR_REGISTER_SECRET is unset or blank", () => {
    expect(isValidTutorSecret("anything")).toBe(false);
    expect(isValidTutorSecret("")).toBe(false);
    vi.stubEnv("TUTOR_REGISTER_SECRET", "   ");
    expect(isValidTutorSecret("")).toBe(false);
    expect(isValidTutorSecret("   ")).toBe(false);
  });

  it("matches the configured secret ignoring case and surrounding whitespace", () => {
    vi.stubEnv("TUTOR_REGISTER_SECRET", "  Agua-Pura ");
    expect(isValidTutorSecret("agua-pura")).toBe(true);
    expect(isValidTutorSecret("  AGUA-PURA\n")).toBe(true);
    expect(isValidTutorSecret("agua pura")).toBe(false);
    expect(isValidTutorSecret("")).toBe(false);
  });
});

describe("session cookies", () => {
  it("gives the academy its own cookie, distinct from the library's", () => {
    expect(ACADEMY_SESSION_COOKIE).toBe("pww_academy_session");
    expect(LIBRARY_SESSION_COOKIE).toBe("pww_session");
    expect(ACADEMY_SESSION_COOKIE).not.toBe(LIBRARY_SESSION_COOKIE);
  });
});
