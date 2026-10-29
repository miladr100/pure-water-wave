import { NextResponse } from "next/server";

import { clearSessionCookies } from "@/lib/academy/session-bridge";

// The library and the academy share one Login, so signing out of either
// clears both sessions.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
