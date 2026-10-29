import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE as ACADEMY_SESSION_COOKIE } from "@/lib/academy/session-cookie";
import { isAcademyRole } from "@/lib/academy/roles";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { isSystemUserRole } from "@/lib/user-roles";

// Two gates, one file: the library (pastors) and the academy (students and
// tutors) each have their own cookie and their own roles, so a pastor's
// session never opens the academy and vice versa.

// The site's Login (/login) posts here, so this API must work without a
// session; the account routes under it check the session themselves.
const ACADEMY_PUBLIC = ["/api/academia/auth"];

// The academy once had its own sign-in pages; old links land on the site's.
const MOVED_TO_SITE: Record<string, string> = {
  "/academia/login": "/login",
  "/academia/cadastro": "/login",
  "/academia/esqueci-senha": "/esqueci-senha",
};

async function academyMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (MOVED_TO_SITE[pathname]) {
    return NextResponse.redirect(new URL(MOVED_TO_SITE[pathname], request.url), 308);
  }

  const isApi = pathname.startsWith("/api/");
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin/");
  const token = request.cookies.get(ACADEMY_SESSION_COOKIE)?.value;

  if (ACADEMY_PUBLIC.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // The panel does not exist for anyone who is not a tutor: no redirect to a
  // login, no 403, just the site's 404, so the URL reveals nothing. The
  // rewrite targets a path no route matches, which renders not-found.tsx
  // with a real 404 status.
  const hide = () => {
    if (isApi) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    return NextResponse.rewrite(new URL("/__nao-encontrado", request.url));
  };

  const deny = (status: 401 | 403) => {
    if (isAdminArea) {
      return hide();
    }

    if (isApi) {
      return NextResponse.json({ error: "Não autorizado" }, { status });
    }

    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  };

  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) {
    return deny(401);
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    if (!isAcademyRole(payload.role)) {
      return deny(401);
    }

    if (isAdminArea && payload.role !== "tutor") {
      return deny(403);
    }

    return NextResponse.next();
  } catch {
    return deny(401);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/academia") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/academia/") ||
    pathname.startsWith("/api/admin/")
  ) {
    return academyMiddleware(request);
  }

  const isProtectedApi = pathname.startsWith("/api/biblioteca/");
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    if (!isSystemUserRole(payload.role)) {
      if (isProtectedApi) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
      }

      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/biblioteca/:path*",
    "/painel/:path*",
    "/api/biblioteca/:path*",
    "/academia/:path*",
    "/admin/:path*",
    "/api/academia/:path*",
    "/api/admin/:path*",
  ],
};
