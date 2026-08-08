import { describe, it, expect } from "vitest";
import { PAGE_SIZE, clampPage, pageNumbers, paginate } from "./pagination";

const items = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("paginate", () => {
  it("cuts a full result set into pages of eighteen", () => {
    const all = items(54);
    const first = paginate(all, 1);
    expect(first.items).toEqual(items(18));
    expect(first).toMatchObject({ page: 1, pageCount: 3, total: 54, from: 1, to: 18 });

    const last = paginate(all, 3);
    expect(last.items[0]).toBe(37);
    expect(last).toMatchObject({ page: 3, from: 37, to: 54 });
  });

  it("leaves a short last page short rather than padding it", () => {
    const page = paginate(items(20), 2);
    expect(page.items).toEqual([19, 20]);
    expect(page).toMatchObject({ pageCount: 2, from: 19, to: 20 });
  });

  it("reports one empty page for an empty result", () => {
    // pageCount 0 would render "page 1 of 0", and `from: 1` would claim a first
    // item that isn't there.
    expect(paginate([], 1)).toEqual({
      items: [],
      page: 1,
      pageCount: 1,
      total: 0,
      from: 0,
      to: 0,
    });
  });

  it("clamps a page that no longer exists instead of showing nothing", () => {
    // The real sequence this guards: sit on page 4, tighten a filter down to
    // eleven results, and an unclamped slice returns [] — indistinguishable
    // from "nothing matches", which is a lie.
    const page = paginate(items(11), 4);
    expect(page.page).toBe(1);
    expect(page.items).toHaveLength(11);
  });

  it("survives junk page numbers", () => {
    for (const junk of [0, -3, NaN, Infinity, 1.7]) {
      const page = paginate(items(30), junk);
      expect(page.page).toBeGreaterThanOrEqual(1);
      expect(page.page).toBeLessThanOrEqual(2);
      expect(page.items.length).toBeGreaterThan(0);
    }
  });

  it("covers every item exactly once across all its pages", () => {
    const all = items(47);
    const { pageCount } = paginate(all, 1);
    const seen = Array.from({ length: pageCount }, (_, i) => paginate(all, i + 1).items).flat();
    expect(seen).toEqual(all);
  });

  it("defaults to eighteen a page", () => {
    expect(PAGE_SIZE).toBe(18);
    expect(paginate(items(40), 1).items).toHaveLength(18);
  });
});

describe("clampPage", () => {
  it("holds the page inside the range", () => {
    expect(clampPage(5, 3)).toBe(3);
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(2, 3)).toBe(2);
    expect(clampPage(1, 0)).toBe(1);
  });
});

describe("pageNumbers", () => {
  it("lists them all while they fit", () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
    expect(pageNumbers(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("elides the middle of a long run but keeps both ends reachable", () => {
    expect(pageNumbers(1, 20)).toEqual([1, 2, "gap", 20]);
    expect(pageNumbers(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
    expect(pageNumbers(20, 20)).toEqual([1, "gap", 19, 20]);
  });

  it("spells out a single skipped page rather than hiding it behind a gap", () => {
    // "1 … 3 4 5" costs the same width as "1 2 3 4 5" and buys a dead end.
    expect(pageNumbers(4, 5)).toEqual([1, 2, 3, 4, 5]);
    // Only page 5 sits between 4 and 6, so it is spelled out …
    expect(pageNumbers(3, 6)).toEqual([1, 2, 3, 4, 5, 6]);
    // … but 5 and 6 together are worth eliding.
    expect(pageNumbers(3, 7)).toEqual([1, 2, 3, 4, "gap", 7]);
  });

  it("never repeats a page and always ascends", () => {
    for (let count = 1; count <= 12; count++) {
      for (let page = 1; page <= count; page++) {
        const nums = pageNumbers(page, count).filter((n): n is number => n !== "gap");
        expect(new Set(nums).size).toBe(nums.length);
        expect([...nums].sort((a, b) => a - b)).toEqual(nums);
        expect(nums).toContain(page);
      }
    }
  });

  it("returns nothing to render when there are no pages", () => {
    expect(pageNumbers(1, 0)).toEqual([]);
  });
});
