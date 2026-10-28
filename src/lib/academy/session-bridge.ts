import type { NextResponse } from "next/server";

import {
  createSessionToken as createLibraryToken,
  getSessionCookieOptions as libraryCookieOptions,
  SESSION_COOKIE as LIBRARY_COOKIE,
} from "@/lib/auth";
import {
  createSessionToken as createAcademyToken,
  getSessionCookieOptions as academyCookieOptions,
  SESSION_COOKIE as ACADEMY_COOKIE,
  type SessionPayload,
} from "@/lib/academy/auth";
import type { UserLanguage } from "@/lib/user-languages";

// One Login for the whole site. Three kinds of people arrive at it:
//
//   pastors      (SystemUser role "pastor")   → the library, as before
//   HJ Team      (SystemUser role "hjteam", or an AcademyUser "student")
//                                             → the academy, plus the library
//   educators    (AcademyUser role "tutor")   → the panel, plus the library
//
// The library keeps its own cookie and roles untouched, so an academy
// account gets a second, library-shaped cookie (role "hjteam") whenever it
// signs in. Both cookies are cleared together on sign-out.

export async function setAcademyCookies(
  response: NextResponse,
  payload: SessionPayload,
  options: { library?: boolean } = {},
) {
  response.cookies.set(academyCookieOptions(await createAcademyToken(payload)));

  if (options.library !== false) {
    const libraryToken = await createLibraryToken({
      userId: payload.userId,
      login: payload.login,
      fullName: payload.fullName,
      role: "hjteam",
      language: payload.language,
    });
    response.cookies.set(libraryCookieOptions(libraryToken));
  }
}

export async function setLibraryCookie(
  response: NextResponse,
  payload: { userId: string; login: string; fullName: string; role: "pastor" | "hjteam"; language: UserLanguage },
) {
  response.cookies.set(libraryCookieOptions(await createLibraryToken(payload)));
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of [ACADEMY_COOKIE, LIBRARY_COOKIE]) {
    response.cookies.set({
      name,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }
}

export function redirectFor(role: "student" | "tutor" | "pastor" | "hjteam") {
  if (role === "tutor") {
    return "/admin";
  }
  if (role === "pastor") {
    return "/biblioteca";
  }
  return "/academia";
}
