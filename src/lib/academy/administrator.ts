import type { SessionPayload } from "@/lib/academy/auth";
import { connectDB } from "@/lib/mongodb";
import { AcademyUser } from "@/models/academy-user";

// Whether the person behind a session is a site administrator *now*: the
// database, not the cookie, decides, so a role granted or taken away in
// Pessoas applies on the next request instead of on the next login.
//
// Pages call this before any other query, so it opens the connection itself;
// on a cold serverless function the query would otherwise sit in Mongoose's
// buffer and time out (the first 500s on /admin/biblioteca in the demo).
export async function isAdministrator(session: SessionPayload | null) {
  if (!session || session.role !== "tutor") {
    return false;
  }
  if (!process.env.MONGODB_URI) {
    return false;
  }
  await connectDB();
  const user = (await AcademyUser.findById(session.userId).select("role isAdmin").lean()) as
    | { role: string; isAdmin?: boolean }
    | null;
  return user?.role === "tutor" && user.isAdmin === true;
}
