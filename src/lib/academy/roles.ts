// Same shape as the library's `user-roles.ts`, for the academy's own users.
// A tutor is the academy's administrator: there is no separate staff role.
export const ACADEMY_ROLES = ["student", "tutor"] as const;
export type AcademyRole = (typeof ACADEMY_ROLES)[number];

export const ACADEMY_ROLE_LABELS: Record<AcademyRole, string> = {
  student: "Aluno",
  tutor: "Tutor",
};

export function isAcademyRole(value: unknown): value is AcademyRole {
  return typeof value === "string" && ACADEMY_ROLES.includes(value as AcademyRole);
}
