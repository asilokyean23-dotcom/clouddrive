import { NextRequest, NextResponse } from "next/server";

/** Kept as a literal so middleware stays free of server/database imports. */
const SESSION_COOKIE = "cd_session";

/**
 * Simple first line of defence: every page and every API route requires a
 * session cookie. The API routes then resolve the signed-in user to decide
 * which drive (and therefore which files) the request may touch.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // The sign-in / sign-up pages and API must stay reachable.
  if (pathname === "/login") {
    if (hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // The deployment health check must stay reachable without a session.
  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (!hasSession) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};