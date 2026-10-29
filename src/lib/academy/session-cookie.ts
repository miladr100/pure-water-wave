// Distinct from the library's `pww_session` so both apps can share a domain
// (and an AUTH_SECRET) without one reading the other's session.
export const SESSION_COOKIE = "pww_academy_session";
