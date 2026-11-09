import type { SessionPayload } from "@/lib/academy/auth";
import { AcademyUser } from "@/models/academy-user";

// Whether the person behind a session is a site administrator *now*: the
// database, not the cookie, decides, so a role granted or taken away in
// Pessoas applies on the next request instead of on the next login.
export async function isAdministrator(session: SessionPayload | null) {
  if (!session || session.role !== "tutor") {
    return false;
  }
  const user = (await AcademyUser.findById(session.userId).select("role isAdmin").lean()) as
    | { role: string; isAdmin?: boolean }
    | null;
  return user?.role === "tutor" && user.isAdmin === true;
}
