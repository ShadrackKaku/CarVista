import { readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, it, expect } from "vitest";
import { navigationFor, isNavItemActive, homeHrefFor } from "./navigation";
import { TOOLS } from "./tools";

const APP_DIR = join(process.cwd(), "src", "app");

/**
 * Every static route the app actually serves, derived from the file tree.
 *
 * Route groups — `(main)`, `(auth)` — do not appear in the URL, and dynamic
 * segments are normalised to `*` so a nav href pointing at a real dynamic
 * route still matches.
 */
function staticRoutes(dir = APP_DIR, prefix = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) {
      if (entry === "page.tsx") routes.push(prefix === "" ? "/" : prefix);
      continue;
    }
    if (entry === "api") continue;
    const segment = entry.startsWith("(") && entry.endsWith(")") ? "" : `/${entry}`;
    routes.push(...staticRoutes(full, prefix + segment));
  }
  return routes;
}

const ROUTES = new Set(staticRoutes().map((r) => r.split(sep).join("/")));

const sectionIds = (role: Parameters<typeof navigationFor>[0]) =>
  navigationFor(role).map((s) => s.id);

const hrefsFor = (role: Parameters<typeof navigationFor>[0]) =>
  navigationFor(role).flatMap((s) => s.items.map((i) => i.href));

describe("navigationFor", () => {
  it("shows a signed-out visitor nothing — this tree is the app, not the website", () => {
    // Every href now lives under /app (or a console), all of which sit behind
    // the auth guard. A signed-out visitor navigates the public marketing site
    // through its own header, so the app tree must be empty for them rather
    // than advertising links that only bounce off the login redirect.
    expect(sectionIds(null)).toEqual([]);
  });

  it("keeps every signed-in nav target inside the authenticated app", () => {
    const publicPrefixes = ["/vehicles", "/parts", "/dealers", "/services", "/calculators"];
    for (const href of hrefsFor("CUSTOMER")) {
      expect(publicPrefixes.some((p) => href === p || href.startsWith(`${p}/`))).toBe(false);
    }
  });

  it("gives a customer their garage but no business or admin section", () => {
    const ids = sectionIds("CUSTOMER");
    expect(ids).toContain("garage");
    expect(ids).not.toContain("business");
    expect(ids).not.toContain("admin");
  });

  it("gives a dealer the dealer console and nothing from the seller console", () => {
    const hrefs = hrefsFor("DEALER");
    expect(sectionIds("DEALER")).toContain("business");
    expect(hrefs).toContain("/dashboard/dealer/leads");
    expect(hrefs).not.toContain("/dashboard/seller/products");
  });

  it("gives a parts seller the seller console and nothing from the dealer console", () => {
    const hrefs = hrefsFor("PARTS_SELLER");
    expect(hrefs).toContain("/dashboard/seller/products");
    expect(hrefs).not.toContain("/dashboard/dealer/leads");
  });

  it("lets any signed-in account reach its own listings", () => {
    // Selling a car is not a dealer privilege — POST /api/vehicles has always
    // accepted any signed-in seller, and the page behind this link is keyed on
    // sellerId. Dealer-only tooling stays in the Business section.
    for (const role of ["CUSTOMER", "DEALER", "PARTS_SELLER"] as const) {
      expect(hrefsFor(role)).toContain("/app/marketplace/listings");
    }
  });

  it("keeps the admin section to admins", () => {
    expect(sectionIds("ADMIN")).toContain("admin");
    for (const role of ["CUSTOMER", "DEALER", "PARTS_SELLER", "SERVICE_PROVIDER"] as const) {
      expect(hrefsFor(role)).not.toContain("/admin/users");
    }
  });

  it("drops a section entirely when the role can see none of its items", () => {
    // SERVICE_PROVIDER matches the business section's roles on neither item.
    expect(sectionIds("SERVICE_PROVIDER")).not.toContain("business");
  });

  it("mirrors the tool registry into the Tools section", () => {
    const tools = navigationFor("CUSTOMER").find((s) => s.id === "tools")!;
    for (const tool of TOOLS) {
      expect(tools.items.some((item) => item.href === tool.href)).toBe(true);
    }
    // Unbuilt tools are present but flagged, so they render inert.
    const soon = tools.items.filter((item) => item.soon).map((item) => item.href);
    expect(soon).toEqual(TOOLS.filter((t) => t.status === "SOON").map((t) => t.href));
  });
});

describe("every navigable href resolves to a real route", () => {
  // A sidebar or rail entry that 404s is invisible in a typecheck and in a
  // build — only a click finds it. This pins them to the file tree instead.
  const roles = [null, "CUSTOMER", "DEALER", "PARTS_SELLER", "SERVICE_PROVIDER", "ADMIN"] as const;

  it("finds the app directory (guards the test itself)", () => {
    expect(ROUTES.size).toBeGreaterThan(20);
    expect(ROUTES.has("/vehicles")).toBe(true);
  });

  it.each(roles)("has no dead links for role %s", (role) => {
    const dead = navigationFor(role)
      .flatMap((section) => section.items)
      .filter((item) => !item.soon && !ROUTES.has(item.href))
      .map((item) => item.href);
    expect(dead).toEqual([]);
  });

  it("has no dead links in the tool registry", () => {
    const dead = TOOLS.filter((t) => t.status === "LIVE" && !ROUTES.has(t.href)).map((t) => t.href);
    expect(dead).toEqual([]);
  });
});

describe("isNavItemActive", () => {
  const overview = { label: "Overview", href: "/dashboard", icon: {} as never, exact: true };
  const saved = { label: "Saved", href: "/dashboard/saved", icon: {} as never };

  it("matches an exact item only on its own path", () => {
    expect(isNavItemActive("/dashboard", overview)).toBe(true);
    expect(isNavItemActive("/dashboard/saved", overview)).toBe(false);
  });

  it("matches a non-exact item on its own path and its children", () => {
    expect(isNavItemActive("/dashboard/saved", saved)).toBe(true);
    expect(isNavItemActive("/dashboard/saved/123", saved)).toBe(true);
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(isNavItemActive("/dashboard/saved-searches", saved)).toBe(false);
  });
});

describe("homeHrefFor", () => {
  it("sends each role to the console they actually work in", () => {
    expect(homeHrefFor("ADMIN")).toBe("/admin");
    expect(homeHrefFor("DEALER")).toBe("/dashboard/dealer");
    expect(homeHrefFor("PARTS_SELLER")).toBe("/dashboard/seller");
    expect(homeHrefFor("CUSTOMER")).toBe("/dashboard");
    expect(homeHrefFor(null)).toBe("/");
  });
});
