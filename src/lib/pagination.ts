/**
 * Paging for the listing grids.
 *
 * Every browse surface renders the same shape — a three-across grid of cards —
 * and every one of them used to render *all* of its results. That is fine at
 * the seeded fifty-four vehicles and ruinous at five hundred: the page grows
 * without bound, the browser lays out every card whether or not anyone scrolls
 * to it, and there is no way to say "the third page of this search".
 *
 * Eighteen is six rows of three, or nine rows of two on a tablet, and divides
 * evenly at both widths so the last row is never a lonely orphan.
 */
export const PAGE_SIZE = 18;

export interface PageOf<T> {
  /** Just this page's slice. */
  items: T[];
  /** 1-based, clamped into range — never NaN, never past the end. */
  page: number;
  /** At least 1, so "page 1 of 1" reads correctly on an empty result. */
  pageCount: number;
  total: number;
  /** 1-based position of the first and last item, for "showing 19–36 of 54". */
  from: number;
  to: number;
}

/**
 * Slice `items` for `page`.
 *
 * The page is clamped rather than trusted. It arrives from component state that
 * outlives a filter change — narrow a search from four pages to one while
 * sitting on page 4 and an unclamped slice returns nothing, which reads as "no
 * results" when the truth is "no such page". Clamping shows the last real page
 * instead.
 */
export function paginate<T>(items: T[], page: number, pageSize: number = PAGE_SIZE): PageOf<T> {
  const total = items.length;
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = clampPage(page, pageCount);
  const start = (current - 1) * size;
  const slice = items.slice(start, start + size);

  return {
    items: slice,
    page: current,
    pageCount,
    total,
    // An empty result has no first item, so `from` is 0 rather than 1.
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
}

/** Force a page into `1..pageCount`, treating junk as page 1. */
export function clampPage(page: number, pageCount: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(1, Math.floor(page)), Math.max(1, pageCount));
}

/**
 * The page numbers to render, with `"gap"` where a run is elided.
 *
 * Always includes the first and last page so the ends of the result set stay
 * one click away, plus `window` pages either side of the current one.
 *
 * A gap standing in for a single page is replaced by that page: "1 … 3 4 5" is
 * strictly worse than "1 2 3 4 5" — same width, one fewer dead end.
 */
export function pageNumbers(
  page: number,
  pageCount: number,
  window: number = 1,
): Array<number | "gap"> {
  if (pageCount < 1) return [];
  const current = clampPage(page, pageCount);

  const wanted = new Set<number>([1, pageCount]);
  for (let p = current - window; p <= current + window; p++) {
    if (p >= 1 && p <= pageCount) wanted.add(p);
  }

  const out: Array<number | "gap"> = [];
  let previous = 0;
  for (const n of [...wanted].sort((a, b) => a - b)) {
    if (previous) {
      if (n - previous === 2) out.push(previous + 1);
      else if (n - previous > 2) out.push("gap");
    }
    out.push(n);
    previous = n;
  }
  return out;
}
