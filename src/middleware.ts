import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { shellTwinFor, SHELL_MIRROR_PREFIXES } from "@/lib/shell-mirrors";

/**
 * Two jobs.
 *
 * **Role gating** for the protected areas. The role comes from the JWT, which is
 * populated strictly from the database (see auth.ts) — a client can't set it —
 * so these checks can't be bypassed by a forged or edited token.
 *
 * **Mirroring** the public marketplace into the shell. Every public listing URL
 * has an in-shell twin, and a signed-in user who lands on the public one is
 * taken to the twin. That closes the whole class of "this page opened outside
 * the shell" for good: it catches stale bookmarks, search-engine results, links
 * shared between users, and any internal link that was missed — none of which a
 * per-link audit can reach. Signed-out visitors and crawlers are never
 * redirected, so the public pages stay exactly as indexable as they were.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role;

    if (token) {
      const twin = shellTwinFor(pathname);
      if (twin) {
        const url = req.nextUrl.clone();
        url.pathname = twin;
        return NextResponse.redirect(url);
      }
    }

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
      authorized: ({ token, req }) => {
        // The public mirrors must stay reachable signed-out — that is the whole
        // point of the marketing site. The body above redirects signed-in users
        // onward; demanding a token here would put the public catalogue behind
        // the login wall.
        const { pathname } = req.nextUrl;
        if (
          SHELL_MIRROR_PREFIXES.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          )
        ) {
          return true;
        }
        return !!token;
      },
    },
    pages: { signIn: "/login" },
  },
);

export const config = {
  // withAuth appends the requested URL as `callbackUrl` on the login redirect,
  // so an unauthenticated visit to a deep link comes back to that exact page
  // after signing in rather than dumping them on the dashboard.
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    // Public mirrors — matched so a signed-in visitor can be moved into the
    // shell. `authorized` above keeps them open to everyone else.
    "/vehicles/:path*",
    "/parts/:path*",
    "/dealers/:path*",
    "/services/:path*",
    "/calculators/:path*",
    "/cart",
    "/checkout/:path*",
  ],
};
