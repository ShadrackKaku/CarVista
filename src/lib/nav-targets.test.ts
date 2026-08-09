import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { MODULES } from "./modules";

/**
 * Every navigable link in the shell must land on a page that exists.
 *
 * `/dashboard/importer/profile` shipped in the sidebar for a week with no page
 * behind it. Nothing caught it: typecheck is happy with a string, lint has no
 * opinion, and the build never renders a route nobody asked for. The only way
 * to find it was to click it.
 *
 * Items marked `soon` are excluded — they render as disabled spans rather than
 * links, so they are a deliberate placeholder rather than a broken promise.
 */
const APP_DIR = join(process.cwd(), "src", "app");

/**
 * Does a route resolve to a page in the App Router tree?
 *
 * Route groups — `(app)`, `(marketing)` — are transparent in the URL, and a
 * `[slug]` segment matches anything, so both have to be walked rather than
 * matched literally against the path.
 */
function pageExists(route: string): boolean {
  const parts = route.split("?")[0].split("/").filter(Boolean);
  let dirs = [APP_DIR];

  for (const part of parts) {
    const next: string[] = [];
    for (const dir of dirs) {
      if (!existsSync(dir)) continue;
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (!statSync(full).isDirectory()) continue;
        if (entry === part) next.push(full);
        else if (/^\(.+\)$/.test(entry)) {
          // A route group adds no URL segment, so try to match inside it.
          const inside = join(full, part);
          if (existsSync(inside)) next.push(inside);
        } else if (/^\[.+\]$/.test(entry)) next.push(full);
      }
    }
    dirs = next;
    if (dirs.length === 0) return false;
  }

  return dirs.some((d) => existsSync(join(d, "page.tsx")) || existsSync(join(d, "page.ts")));
}

const navItems = MODULES.flatMap((m) =>
  m.items.map((item) => ({ module: m.id, ...item })),
);

describe("module navigation targets", () => {
  it("has links to check", () => {
    // Guards the test itself: a refactor that renamed `items` would otherwise
    // leave this suite passing over an empty list.
    expect(navItems.length).toBeGreaterThan(20);
  });

  it("points every enabled link at a real page", () => {
    const broken = navItems
      .filter((i) => !i.soon && i.href.startsWith("/"))
      .filter((i) => !pageExists(i.href))
      .map((i) => `${i.module}: ${i.label} → ${i.href}`);

    expect(broken, `dead nav links:\n${broken.join("\n")}`).toEqual([]);
  });

  it("points every module base path at a real page", () => {
    const broken = MODULES.filter((m) => !pageExists(m.basePath)).map(
      (m) => `${m.id} → ${m.basePath}`,
    );
    expect(broken, `modules with no landing page:\n${broken.join("\n")}`).toEqual([]);
  });

  it("resolves route groups and dynamic segments", () => {
    // Pins the walker itself. If these stop resolving, the test above would go
    // green by finding nothing rather than by everything being fine.
    expect(pageExists("/app/imports/stock")).toBe(true);
    expect(pageExists("/app/imports/stock/2019-toyota-harrier")).toBe(true);
    expect(pageExists("/dashboard/importer/profile")).toBe(true);
    expect(pageExists("/app/definitely/not/a/route")).toBe(false);
  });
});
