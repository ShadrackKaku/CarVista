import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it, expect } from "vitest";
import { ALL_PERMISSIONS } from "./permissions";

/**
 * Every admin route names the permission it needs.
 *
 * Delegating authority only works if the delegation is exhaustive. One admin
 * page still gated on "is this person an admin" is enough for a content editor
 * to reach escrow — and it would look completely normal in review, because it
 * is what the other nineteen used to look like.
 *
 * So this walks the tree instead of trusting a checklist. It is a shape check,
 * not a proof: it confirms each route consults `can`, not that it picked the
 * right permission. permissions.test.ts covers the decisions; this catches the
 * route that never asked.
 */
const API_ROOT = join(process.cwd(), "src", "app", "api", "admin");
const PAGE_ROOT = join(process.cwd(), "src", "app", "admin");

function filesNamed(dir: string, name: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesNamed(full, name));
    else if (entry === name) out.push(full);
  }
  return out;
}

/** The permission named in a `requirePermission("…")` / `guardPage("…")` call. */
function declaredPermissions(source: string): string[] {
  return [...source.matchAll(/(?:requirePermission|guardPage)\(\s*"([^"]+)"/g)].map((m) => m[1]);
}

const apiRoutes = filesNamed(API_ROOT, "route.ts");
const adminPages = filesNamed(PAGE_ROOT, "page.tsx");

/**
 * Pages that are deliberately open to anyone who can reach the console, with a
 * reason. Adding to this list should take an argument — that is the point of it.
 */
const NO_PERMISSION_NEEDED: Record<string, string> = {
  "page.tsx": "the console landing page — it renders only what the viewer can already reach",
};

describe("admin API routes", () => {
  it("found the routes to check", () => {
    // Guards the suite itself: a moved directory would otherwise leave this
    // passing over an empty list.
    expect(apiRoutes.length).toBeGreaterThan(15);
  });

  it("gates every route on a named permission", () => {
    const ungated = apiRoutes
      .filter((f) => declaredPermissions(readFileSync(f, "utf8")).length === 0)
      .map((f) => relative(process.cwd(), f));

    expect(ungated, `admin API routes with no permission:\n${ungated.join("\n")}`).toEqual([]);
  });

  it("names only permissions that exist", () => {
    const bogus: string[] = [];
    for (const file of apiRoutes) {
      for (const p of declaredPermissions(readFileSync(file, "utf8"))) {
        if (!(ALL_PERMISSIONS as string[]).includes(p)) {
          bogus.push(`${relative(process.cwd(), file)} → ${p}`);
        }
      }
    }
    expect(bogus, `unknown permissions:\n${bogus.join("\n")}`).toEqual([]);
  });

  it("no longer leaves any admin route on the blunt role check", () => {
    // The two shapes this replaces. `user.role !== "ADMIN"` is the worse of the
    // pair: as well as being undelegatable it locked SUPER_ADMIN — the higher
    // role — out of the console entirely.
    const blunt: string[] = [];
    for (const file of [...apiRoutes, ...adminPages]) {
      const src = readFileSync(file, "utf8");
      if (/role\s*!==\s*"ADMIN"/.test(src) || /\brequireAdmin\(\)/.test(src)) {
        blunt.push(relative(process.cwd(), file));
      }
    }
    expect(blunt, `still gated on role rather than permission:\n${blunt.join("\n")}`).toEqual([]);
  });
});

describe("admin pages", () => {
  it("found the pages to check", () => {
    expect(adminPages.length).toBeGreaterThan(15);
  });

  it("gates every page on a named permission", () => {
    const ungated = adminPages
      .filter((f) => declaredPermissions(readFileSync(f, "utf8")).length === 0)
      .map((f) => relative(PAGE_ROOT, f))
      .filter((rel) => !(rel in NO_PERMISSION_NEEDED));

    expect(ungated, `admin pages with no permission:\n${ungated.join("\n")}`).toEqual([]);
  });

  it("names only permissions that exist", () => {
    const bogus: string[] = [];
    for (const file of adminPages) {
      for (const p of declaredPermissions(readFileSync(file, "utf8"))) {
        if (!(ALL_PERMISSIONS as string[]).includes(p)) {
          bogus.push(`${relative(process.cwd(), file)} → ${p}`);
        }
      }
    }
    expect(bogus, `unknown permissions:\n${bogus.join("\n")}`).toEqual([]);
  });

  it("keeps money behind escrow:manage specifically", () => {
    // Named rather than inferred, because these are the routes where a wrong
    // permission costs cedis rather than causing an awkward 403.
    const money = [
      "src/app/api/admin/imports/[id]/escrow/route.ts",
      "src/app/api/admin/imports/[id]/escrow/refund/route.ts",
      "src/app/api/admin/orders/[id]/refund/route.ts",
      "src/app/admin/escrow/page.tsx",
    ];
    for (const rel of money) {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      expect(declaredPermissions(src), rel).toContain("escrow:manage");
    }
  });
});
