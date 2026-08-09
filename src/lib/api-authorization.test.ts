import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Every API route that changes something must establish who is asking.
 *
 * §18 of the platform spec: hiding a button is not a permission. The controls
 * are already in place — but nothing stops the *next* route from shipping
 * without one, and an unguarded handler looks exactly like a guarded one until
 * somebody curls it. This walks the tree instead.
 *
 * It is a shape check, not a proof: it verifies each handler consults the
 * session, not that it draws the right conclusion. The per-feature tests cover
 * the conclusions. What this catches is the route that forgot to ask at all.
 */
const API_ROOT = join(process.cwd(), "src", "app", "api");

/** Anything that resolves the caller. */
const IDENTIFIES_CALLER = /requireAdmin|requirePermission|getCurrentUser|getServerSession/;

const MUTATING = ["POST", "PATCH", "PUT", "DELETE"];

/**
 * Endpoints that are unauthenticated by design, each for a stated reason.
 * Adding to this list should take an argument; that is the point of it.
 */
const DELIBERATELY_PUBLIC: Record<string, string> = {
  "auth/register": "creating the account that authentication will later use",
  "auth/forgot-password": "you cannot be signed in if you have lost your password",
  "auth/reset-password": "authorised by the emailed token, not by a session",
  "auth/verify-email": "authorised by the emailed token",
  "auth/[...nextauth]": "NextAuth's own handler",
  contact: "a public contact form",
  newsletter: "a public signup form",
  "webhooks/paystack": "authorised by Paystack's HMAC signature",
  "cron/alerts": "authorised by CRON_SECRET",
  "dev/seed": "development-only seeding",
  "payments/paystack/verify": "authorised by the Paystack reference",
  "payments/escrow/verify": "authorised by the Paystack reference",
  "vehicles/[id]/view": "an anonymous view beacon on a public listing",
  "calculators/landed-cost": "a public estimate over public rate data",
  "import-requests/track": "authorised by the tracking reference",
  "icums/makes": "public reference data",
  "icums/models": "public reference data",
  "auth/accept-invite":
    "authorised by the single-use invite token, which is the only thing the recipient has",
};

function routeFiles(dir = API_ROOT): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...routeFiles(full));
    else if (entry === "route.ts") out.push(full);
  }
  return out;
}

interface Route {
  id: string;
  methods: string[];
  identifiesCaller: boolean;
  usesAdminGuard: boolean;
  usesPermissionGuard: boolean;
  checksAdminRole: boolean;
}

const ROUTES: Route[] = routeFiles().map((file) => {
  const source = readFileSync(file, "utf8");
  return {
    id: file
      .replace(`${API_ROOT}/`, "")
      .replace(/\/route\.ts$/, "")
      .split("/")
      .join("/"),
    methods: [...source.matchAll(/export async function (GET|POST|PATCH|PUT|DELETE)/g)].map(
      (m) => m[1],
    ),
    identifiesCaller: IDENTIFIES_CALLER.test(source),
    usesAdminGuard: source.includes("requireAdmin"),
    usesPermissionGuard: source.includes("requirePermission("),
    checksAdminRole: /["']ADMIN["']/.test(source),
  };
});

describe("API authorization", () => {
  it("finds the routes (guards the test itself)", () => {
    expect(ROUTES.length).toBeGreaterThan(40);
    expect(ROUTES.some((r) => r.id === "vehicles")).toBe(true);
  });

  it("guards every /api/admin route", () => {
    // Administrative authority is expressed as named permissions now, so the
    // expected shape is `requirePermission("…")`. `requireAdmin()` remains
    // valid for anything a staff member must never reach whatever they hold.
    // What is no longer acceptable is an inline `role !== "ADMIN"` comparison:
    // it cannot be delegated, and it locked SUPER_ADMIN out of its own console.
    const unguarded = ROUTES.filter(
      (r) => r.id.startsWith("admin/") && !r.usesPermissionGuard && !r.usesAdminGuard,
    ).map((r) => r.id);
    expect(unguarded, `admin routes with no guard:\n${unguarded.join("\n")}`).toEqual([]);
  });

  it("identifies the caller on every mutating route", () => {
    const anonymous = ROUTES.filter(
      (r) =>
        r.methods.some((m) => MUTATING.includes(m)) &&
        !r.identifiesCaller &&
        !(r.id in DELIBERATELY_PUBLIC),
    ).map((r) => r.id);
    expect(anonymous).toEqual([]);
  });

  it("keeps the public-by-design list honest — no stale entries", () => {
    // An exemption that no longer names a real route is a comment pretending
    // to be a control, and it would silently absolve a future route of the
    // same name.
    const ids = new Set(ROUTES.map((r) => r.id));
    const stale = Object.keys(DELIBERATELY_PUBLIC).filter((id) => !ids.has(id));
    expect(stale).toEqual([]);
  });
});
