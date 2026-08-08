import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { FILTER_DOCK_PATHS, usesFilterDock, moduleForPath } from "./modules";

/**
 * The shell renders the filter column; the page fills it. Both decide from
 * `FILTER_DOCK_PATHS`, and they have to agree.
 *
 * When they don't, nothing throws. A browse page missing from the list renders
 * its filters through `FilterLayout`'s *inline* branch instead — a sticky
 * sidebar inside the content column — so the shell shows the rail, no dock, and
 * a filter panel indented inside the results. That is the three-column layout
 * this whole change removed, quietly restored on one route. A typecheck, a lint
 * and a build all pass. Only a reader notices, which is what this is.
 */
const SRC = join(process.cwd(), "src");

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** `src/app/app/marketplace/vehicles/page.tsx` → `/app/marketplace/vehicles`. */
function routeOf(file: string): string {
  const rel = file.slice(join(SRC, "app").length).replace(/\\/g, "/");
  const route = rel
    .replace(/\/page\.tsx$/, "")
    .replace(/\/\([^/]+\)/g, "") // route groups are not URL segments
    .replace(/^$/, "/");
  return route || "/";
}

/** Components whose render tree puts filters into the dock. */
const filterLayoutComponents = (() => {
  const names = new Map<string, string>(); // export name → file
  for (const file of walk(join(SRC, "components"))) {
    const source = readFileSync(file, "utf8");
    if (!source.includes("<FilterLayout")) continue;
    for (const m of source.matchAll(/export function (\w+)/g)) names.set(m[1], file);
  }
  return names;
})();

const shellPages = walk(join(SRC, "app", "app")).filter((f) => f.endsWith("page.tsx"));

describe("the filter dock registry", () => {
  it("finds the components it is meant to be checking", () => {
    // A rename that empties this map would turn every assertion below into a
    // vacuous pass — the classic way a guard like this rots into decoration.
    expect(filterLayoutComponents.size).toBeGreaterThanOrEqual(5);
    expect(shellPages.length).toBeGreaterThan(10);
  });

  it("registers every shell page that hands filters to the dock", () => {
    const unregistered: string[] = [];

    for (const file of shellPages) {
      const source = readFileSync(file, "utf8");
      const usesOne = [...filterLayoutComponents.keys()].some((name) =>
        new RegExp(`\\b${name}\\b`).test(source),
      );
      if (!usesOne) continue;

      const route = routeOf(file);
      if (!usesFilterDock(route)) unregistered.push(route);
    }

    expect(
      unregistered,
      "these shell routes render a filter panel but are not in FILTER_DOCK_PATHS, " +
        "so their filters fall back to an inline sidebar and the shell grows a third column",
    ).toEqual([]);
  });

  it("points every registered path at a page that actually exists", () => {
    for (const path of FILTER_DOCK_PATHS) {
      const page = join(SRC, "app", path, "page.tsx");
      expect(existsSync(page), `${path} is registered but ${page} does not exist`).toBe(true);
    }
  });

  it("only docks routes that live inside the shell", () => {
    // The public twins at `/vehicles`, `/parts` and friends have no shell to
    // dock into. Registering one would hide its filters completely: the page
    // would portal them at a target that is never rendered.
    for (const path of FILTER_DOCK_PATHS) {
      expect(moduleForPath(path), `${path} belongs to no module`).not.toBeNull();
    }
  });

  it("matches exactly, so a detail page never inherits its index's filters", () => {
    expect(usesFilterDock("/app/marketplace/vehicles")).toBe(true);
    expect(usesFilterDock("/app/marketplace/vehicles/toyota-corolla-2019")).toBe(false);
    expect(usesFilterDock("/app/marketplace/suppliers/accra-parts")).toBe(false);
    expect(usesFilterDock("/app/marketplace")).toBe(false);
    expect(usesFilterDock("/dashboard")).toBe(false);
  });

  it("lists no duplicates", () => {
    expect(new Set(FILTER_DOCK_PATHS).size).toBe(FILTER_DOCK_PATHS.length);
  });
});
