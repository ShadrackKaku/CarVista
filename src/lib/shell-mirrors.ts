/**
 * The map from a public URL to its in-shell twin.
 *
 * The marketplace exists twice on purpose: once on the public site, where it is
 * indexable and explains the product, and once inside the authenticated shell,
 * where it is the product. Both render the same components (see
 * `VehicleDetail`, `PartDetail`, and friends) — only the chrome differs.
 *
 * A signed-in user should never see the public copy. Auditing every link cannot
 * guarantee that: bookmarks, shared links, search results and the browser's own
 * history all arrive without passing through a link we control. So the mapping
 * lives here and the middleware applies it to every request, which is the one
 * place all of those funnel through.
 *
 * Kept free of Next imports so the middleware (Edge runtime) and the unit tests
 * can both use it.
 */

/** Longest patterns first — `/vehicles/new` must win over `/vehicles/:slug`. */
const EXACT: Record<string, string> = {
  "/vehicles/new": "/app/marketplace/listings/new",
  "/import": "/app/imports",
  "/import/track": "/app/imports/track",
  "/import/duty-check": "/app/imports/duty-check",
  "/import/escrow/verify": "/app/imports/escrow/verify",
  "/search": "/app/search",
  "/cart": "/app/marketplace/cart",
  "/checkout": "/app/marketplace/checkout",
  "/checkout/verify": "/app/marketplace/checkout/verify",
};

/** `/vehicles/<slug>/edit` → the listing editor, not a listing detail page. */
const VEHICLE_EDIT = /^\/vehicles\/([^/]+)\/edit$/;

/** Everything else maps by prefix. */
const PREFIXES: [publicPrefix: string, shellPrefix: string][] = [
  ["/vehicles", "/app/marketplace/vehicles"],
  ["/parts", "/app/marketplace/parts"],
  ["/dealers", "/app/marketplace/dealers"],
  ["/services", "/app/marketplace/services"],
  ["/calculators", "/app/calculators"],
];

/** Every public prefix the mirror covers — the middleware matcher's source. */
export const SHELL_MIRROR_PREFIXES: string[] = [
  ...PREFIXES.map(([pub]) => pub),
  "/cart",
  "/checkout",
  // `/import` keeps a public marketing page of its own; only a signed-in
  // visitor is moved on to the module.
  "/import",
  "/search",
];

/**
 * The in-shell path for a public one, or null when the path has no twin.
 *
 * Returns null for anything already under `/app` so the redirect can never
 * chain, and for the marketing pages (`/`, `/about`, `/blog`, …) which stay
 * public for everyone — they explain the product rather than being it.
 */
export function shellTwinFor(pathname: string): string | null {
  if (pathname.startsWith("/app/")) return null;

  const exact = EXACT[pathname];
  if (exact) return exact;

  const edit = VEHICLE_EDIT.exec(pathname);
  if (edit) return `/app/marketplace/listings/${edit[1]}/edit`;

  for (const [pub, shell] of PREFIXES) {
    if (pathname === pub) return shell;
    if (pathname.startsWith(`${pub}/`)) return shell + pathname.slice(pub.length);
  }
  return null;
}
