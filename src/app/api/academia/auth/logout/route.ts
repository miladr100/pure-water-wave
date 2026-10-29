import { NextResponse } from "next/server";

import { clearSessionCookies } from "@/lib/academy/session-bridge";

// Signing out of the academy also signs out of the library: both cookies
// were minted by the same Login.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
