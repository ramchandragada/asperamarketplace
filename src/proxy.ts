import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/platform/http/request-id";

const SESSION_COOKIE = "aspera_session";

export function proxy(request: NextRequest) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(login);
      redirect.headers.set(REQUEST_ID_HEADER, requestId);
      return redirect;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  requestHeaders.set("x-aspera-pathname", pathname);
  const surface =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin")
      ? "admin"
      : pathname.startsWith("/seller") || pathname.startsWith("/api/seller")
        ? "seller"
        : "shopper";
  requestHeaders.set("x-aspera-surface", surface);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  if (surface === "admin") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
