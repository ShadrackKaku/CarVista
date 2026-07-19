import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Role gating for the protected areas. The role comes from the JWT, which is
 * populated strictly from the database (see auth.ts) — a client can't set it —
 * so these checks can't be bypassed by a forged/updated token.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Admin area is admins-only.
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Dealer area.
    if (pathname.startsWith("/dashboard/dealer") && role !== "DEALER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Seller area.
    if (
      pathname.startsWith("/dashboard/seller") &&
      role !== "PARTS_SELLER" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/checkout/:path*"],
};
