import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";
import { isUserRole } from "@/lib/user-roles";

export async function middleware(request: NextRequest) {
  const isProtectedApi = request.nextUrl.pathname.startsWith("/api/biblioteca/");
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

    if (!isUserRole(payload.role) || payload.role !== "pastor") {
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
  matcher: ["/biblioteca/:path*", "/painel/:path*", "/api/biblioteca/:path*"],
};
