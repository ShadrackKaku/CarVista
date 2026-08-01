import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * The authenticated app must not link back out to the public marketing site.
 *
 * This is the failure the shell architecture exists to prevent: a user clicks a
 * car in the Marketplace module and lands on `/vehicles/<slug>`, which renders
 * with the public header and footer instead of the sidebars. Nothing errors —
 * the shell just silently disappears — so a typecheck and a build both pass
 * while the app comes apart. Only a reader catches it, which is what this is.
 *
 * The rule: inside `/app`, `/dashboard` and `/admin`, a link to a public
 * marketplace or calculator route is a bug. Its in-shell twin exists.
 */
const SRC = join(process.cwd(), "src");

/**
 * Directories whose contents only ever render inside the shell — the three
 * authenticated route trees, plus the component folders they own outright.
 *
 * Components used by *both* the public site and the shell (VehicleCard,
 * FinancingWidget, the detail views) are deliberately absent: they take the
 * base path as a prop instead of hard-coding one, so a literal public href in
 * them is correct.
 */
const AUTHENTICATED_TREES = [
  "app/app",
  "app/dashboard",
  "app/admin",
  "components/calculators",
  "components/dealer",
  "components/search",
  "components/tools",
];

/**
 * Public roots whose content now has an in-shell equivalent. `/import` is
 * absent on purpose — it is still a marketing page with no module behind it.
 */
const PUBLIC_ROOTS = ["/vehicles", "/parts", "/dealers", "/services", "/calculators"];

/** `href="/x"` and ``href={`/x/${id}`}`` — the two forms in this codebase. */
const HREF = /href=(?:"([^"]*)"|\{`([^`]*)`)/g;

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full));
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function offendingLinks(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const bad: string[] = [];
  for (const match of source.matchAll(HREF)) {
    const href = match[1] ?? match[2] ?? "";
    if (PUBLIC_ROOTS.some((root) => href === root || href.startsWith(`${root}/`))) {
      bad.push(href);
    }
  }
  return bad;
}

describe("the authenticated app stays inside the shell", () => {
  const files = AUTHENTICATED_TREES.flatMap((tree) => tsxFiles(join(SRC, tree)));

  it("finds the authenticated files (guards the test itself)", () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it.each(AUTHENTICATED_TREES)("has no links out of the shell in src/%s", (tree) => {
    const offenders = tsxFiles(join(SRC, tree)).flatMap((file) =>
      offendingLinks(file).map((href) => `${file.replace(`${process.cwd()}/`, "")} → ${href}`),
    );
    expect(offenders).toEqual([]);
  });
});
