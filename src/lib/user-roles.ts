export const SYSTEM_USER_ROLES = ["pastor", "hjteam"] as const;
export type SystemUserRole = (typeof SYSTEM_USER_ROLES)[number];

/** @deprecated Use SystemUserRole */
export type UserRole = SystemUserRole;

/** @deprecated Use SYSTEM_USER_ROLES */
export const USER_ROLES = SYSTEM_USER_ROLES;

export const SYSTEM_USER_ROLE_LABELS: Record<SystemUserRole, string> = {
  pastor: "Pastor",
  hjteam: "HJ Team",
};

export function isSystemUserRole(value: unknown): value is SystemUserRole {
  return (
    typeof value === "string" &&
    SYSTEM_USER_ROLES.includes(value as SystemUserRole)
  );
}

/** @deprecated Use isSystemUserRole */
export function isUserRole(value: unknown): value is SystemUserRole {
  return isSystemUserRole(value);
}
