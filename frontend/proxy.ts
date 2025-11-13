import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("connect.sid");
  const isAuthenticated = !!authCookie;

  const protectedRoutes = [
    "/user-dashboard",
    "/report",
    "/report-history",
    "/rewards",
    "/admin",
  ];

  const authRoutes = ["/login", "/signup"];

  // If authenticated, block access to login/signup
  if (isAuthenticated && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/user-dashboard", request.url));
  }

  // If not authenticated, block access to protected routes
  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user-dashboard/:path*",
    "/report/:path*",
    "/report-history/:path*",
    "/rewards/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/admin", // ensure this matches root /admin too
  ],
};
