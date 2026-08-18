import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * The column count of a browse page lives in exactly one place.
 *
 * Six pages used to write it out by hand, which is how two of them ended up at
 * four across while the rest stayed at three, and how every loading skeleton
 * came to promise a shape its page did not render.
 *
 * The check that actually earns its place is the second one: `sizes` is not
 * decoration. It is the only thing telling the browser how much picture to
 * download, and it is written in viewport fractions while the grid is written in
 * columns — so going from three cards to four silently leaves every card
 * fetching a third more image than it can draw. Nothing warns. The page just
 * gets heavier, worst on the phones this market actually browses on.
 */
const SRC = join(process.cwd(), "src");
const CARD = readFileSync(join(SRC, "components", "ui", "listing-card.tsx"), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

/** The class string `ListingGrid` lays itself out with. */
const gridClasses = (() => {
  const body = CARD.slice(CARD.indexOf("export function ListingGrid"));
  const match = body.match(/cn\("([^"]+)"/);
  return match?.[1] ?? "";
})();

/** The `sizes` every card gets unless it says otherwise. */
const defaultSizes = (() => {
  const match = CARD.match(/sizes = "([^"]+)"/);
  return match?.[1] ?? "";
})();

const LISTING_CARDS = [
  "VehicleCard",
  "PartCard",
  "DealerCard",
  "ServiceCard",
  "SupplierCard",
  "StockCard",
];

/**
 * Pages that render listing cards outside the shared grid, on purpose.
 *
 * The home page's sections are four-up strips, not results: each one slices
 * exactly four records and means to show them on one line at every width from
 * `lg` up. Putting them through `ListingGrid` would wrap that row 3 + 1.
 */
const DELIBERATE_EXCEPTIONS = ["app/(main)/page.tsx", "app/dashboard/page.tsx"];

describe("the listing grid", () => {
  it("is the one place a browse page's columns are decided", () => {
    expect(gridClasses, "ListingGrid's class string was not found — the parse below is vacuous")
      .toContain("grid-cols");

    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const source = readFileSync(file, "utf8");
      const rel = file.slice(SRC.length + 1).replace(/\\/g, "/");
      if (DELIBERATE_EXCEPTIONS.includes(rel)) continue;

      for (const name of LISTING_CARDS) {
        const at = source.indexOf(`<${name}`);
        if (at < 0) continue;
        // Whichever opened last before the card is the one it sits in. A detail
        // page is full of other grids — a spec table, a thumbnail strip — and
        // none of them lay out cards, so the file as a whole says nothing.
        const before = source.slice(0, at);
        const shared = before.lastIndexOf("<ListingGrid");
        const ownGrid = [...before.matchAll(/className="[^"]*\bgrid\b[^"]*grid-cols-[^"]*"/g)].pop();
        if (ownGrid && ownGrid.index! > shared) offenders.push(`${rel} (${name})`);
      }
    }

    expect(
      offenders,
      "these render listing cards into a grid of their own instead of <ListingGrid>",
    ).toEqual([]);
  });

  it("asks for as much picture as the widest card can draw, and no more", () => {
    // Every column count the grid declares, smallest first: 1, 2, 3, 4.
    const columns = [...gridClasses.matchAll(/grid-cols-(\d+)/g)]
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b);
    expect(columns.length, "no column steps parsed out of ListingGrid").toBeGreaterThan(1);

    // Every viewport fraction `sizes` declares, largest first: 100, 50, 33, 25.
    const fractions = [...defaultSizes.matchAll(/(\d+)vw/g)]
      .map((m) => Number(m[1]))
      .sort((a, b) => b - a);

    expect(
      fractions,
      `sizes="${defaultSizes}" does not match a ${columns.join("/")}-column grid`,
    ).toEqual(columns.map((n) => Math.round(100 / n)));
  });

  it("keeps the skeleton in the same shape as the cards it stands in for", () => {
    const skeleton = readFileSync(
      join(SRC, "components", "skeletons", "card-grid-skeleton.tsx"),
      "utf8",
    );
    // It lays out through the grid rather than restating it, so a placeholder
    // can no longer settle into one shape and jump to another.
    expect(skeleton).toContain("<ListingGrid");
    expect(skeleton).not.toMatch(/grid-cols-/);
    // And the block matches the card's own corner.
    expect(skeleton).toContain("rounded-xl");
  });
});
