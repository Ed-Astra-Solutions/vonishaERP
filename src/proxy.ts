import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/config";

// Next 16 renamed `middleware` -> `proxy`. Optimistic auth guard based on the
// presence of the token cookie (real validation happens client-side via
// /getinfo). Unauthenticated users are sent to /signin; authenticated users are
// bounced off the public auth pages to /dashboard.
const PUBLIC_PREFIXES = ["/signin", "/forgot-password", "/reset-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!hasToken && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // Password links stay reachable while signed in, so an invite opened on a phone
  // that already has a session still works.
  const isPasswordLink = pathname.startsWith("/reset-password");
  if (hasToken && !isPasswordLink && (isPublic || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals, API routes, and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:png|jpg|jpeg|svg|ico)).*)"],
};
