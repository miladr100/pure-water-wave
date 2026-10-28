import { redirect } from "next/navigation";

// The profile is a dialog over any screen now (see AppHeader); this route
// stays so old links keep working.
export default function ProfilePage() {
  redirect("/academia?perfil=1");
}
