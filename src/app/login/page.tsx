import { redirect } from "next/navigation";

// One Login for the whole site (academy, panel and library): the form lives
// in the academy and sends each account where it belongs.
export default function LoginPage() {
  redirect("/academia/login");
}
