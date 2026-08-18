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

/** The narrowest track the grid will make, and the space between two, in px. */
const track = (() => {
  const min = CARD.match(/const MIN_CARD = "([\d.]+)rem"/);
  const gap = CARD.match(/const GRID_GAP = "([\d.]+)rem"/);
  return { min: Number(min?.[1]) * 16, gap: Number(gap?.[1]) * 16 };
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
    expect(
      gridClasses,
      "ListingGrid's class string was not found — the parse below is vacuous",
    ).toContain("grid");

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

  it("counts its own columns instead of being told at breakpoints", () => {
    // A viewport breakpoint measures the window; what decides how many cards
    // fit is the width of the results column, and the same grid does not have
    // that twice — the public page gives up 272px to a sidebar, the shell 344px
    // to a rail and a dock. Any `grid-cols-N` here is that mistake returning.
    expect(gridClasses).not.toMatch(/grid-cols-\d/);

    // The template itself, rather than any mention of it in prose above.
    const template = CARD.match(/gridTemplateColumns: `([^`]+)`/)?.[1] ?? "";
    expect(template, "no gridTemplateColumns found on ListingGrid").toContain("repeat(");
    expect(template).toContain("auto-fill");
    // `auto-fit` collapses empty tracks, so three results would draw enormous
    // and four would draw normal. Results must not resize with their count.
    expect(template).not.toContain("auto-fit");
    expect(track.min, "MIN_CARD did not parse").toBeGreaterThan(100);
  });

  it("asks for as much picture as the widest card can draw, and no more", () => {
    // With `auto-fill` a track is at its widest just before one more column
    // fits: n tracks sharing what n+1 would have needed.
    const widestAt = (n: number) => ((n + 1) * (track.min + track.gap)) / n - track.gap;

    // What `sizes` promises above the last viewport condition it names.
    const cap = Number(defaultSizes.match(/(\d+)px\s*$/)?.[1]);
    expect(cap, `sizes="${defaultSizes}" must end in a fixed px bound`).toBeGreaterThan(0);

    // Above 1024px every surface is at three columns or more — the public
    // page's results column is 688px there, which already takes three.
    expect(
      cap,
      `sizes caps cards at ${cap}px but a three-column row can make them ` +
        `${Math.ceil(widestAt(3))}px, so the picture would be asked for too small`,
    ).toBeGreaterThanOrEqual(Math.ceil(widestAt(3)));

    // And not wastefully above it — this is the number every phone pays for.
    expect(cap).toBeLessThan(widestAt(3) + track.min);
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
