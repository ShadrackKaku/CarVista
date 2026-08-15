import { describe, it, expect } from "vitest";
import {
  EMPTY_FILTERS,
  PRICE_BANDS,
  YEAR_BANDS,
  activeBand,
  bandToRange,
  matchesFilters,
  type FilterableVehicle,
  type RangeBand,
} from "./vehicle-search";

/**
 * Price and year as bands rather than two empty number boxes.
 *
 * The property that matters is coverage: every band the sidebar offers has to
 * lead somewhere, and no price may fall between two of them. A gap is invisible
 * in the interface and shows up as a car that exists but cannot be found by any
 * filter combination — the worst kind of bug on a marketplace, because the
 * seller is paying for a listing nobody can reach.
 */

function contiguous(bands: readonly RangeBand[]) {
  // Ordered so the assertion reads in the direction the list is displayed.
  const sorted = [...bands].sort((a, b) => (a.min ?? -Infinity) - (b.min ?? -Infinity));
  const gaps: string[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const upper = sorted[i].max;
    const nextLower = sorted[i + 1].min;
    if (upper == null || nextLower == null) continue;
    if (nextLower !== upper + 1) gaps.push(`${sorted[i].label} → ${sorted[i + 1].label}`);
  }
  return gaps;
}

describe.each([
  ["price", PRICE_BANDS],
  ["year", YEAR_BANDS],
] as const)("%s bands", (_name, bands) => {
  it("leave no value uncovered between one band and the next", () => {
    expect(contiguous(bands)).toEqual([]);
  });

  it("are open at both ends, so nothing falls off the top or bottom", () => {
    const sorted = [...bands].sort((a, b) => (a.min ?? -Infinity) - (b.min ?? -Infinity));
    expect(sorted[0].min, "the cheapest/oldest band must have no floor").toBeUndefined();
    expect(
      sorted[sorted.length - 1].max,
      "the dearest/newest band must have no ceiling",
    ).toBeUndefined();
  });

  it("never overlap, so a car appears under exactly one", () => {
    for (const a of bands) {
      for (const b of bands) {
        if (a.id === b.id) continue;
        const overlap =
          (a.min ?? -Infinity) <= (b.max ?? Infinity) && (b.min ?? -Infinity) <= (a.max ?? Infinity);
        expect(overlap, `${a.label} overlaps ${b.label}`).toBe(false);
      }
    }
  });

  it("have unique ids and labels", () => {
    expect(new Set(bands.map((b) => b.id)).size).toBe(bands.length);
    expect(new Set(bands.map((b) => b.label)).size).toBe(bands.length);
  });
});

describe("selecting a band", () => {
  it("round-trips through the same two filter fields the boxes used", () => {
    // Bands write minPrice/maxPrice, so saved searches and shared URLs made
    // before this change keep working, and the matcher never learned about
    // bands at all.
    const band = PRICE_BANDS.find((b) => b.id === "200-300")!;
    const { min, max } = bandToRange(band);
    expect({ min, max }).toEqual({ min: "200001", max: "300000" });
    expect(activeBand(PRICE_BANDS, min, max)?.id).toBe("200-300");
  });

  it("clears both halves when the choice is 'any'", () => {
    expect(bandToRange(null)).toEqual({ min: "", max: "" });
    expect(activeBand(PRICE_BANDS, "", "")).toBeNull();
  });

  it("reports no band for a hand-edited range from an older link", () => {
    // A saved search made with the old Min/Max boxes may hold 137,500. It must
    // still filter correctly; it simply does not light up a band.
    expect(activeBand(PRICE_BANDS, "137500", "")).toBeNull();
  });

  it("leaves an open-ended band's other half empty", () => {
    expect(bandToRange(PRICE_BANDS.find((b) => b.id === "o800")!)).toEqual({
      min: "800001",
      max: "",
    });
  });
});

describe("counting what an option would leave", () => {
  const car = (price: number, year: number): FilterableVehicle => ({
    title: "Toyota Harrier",
    brand: "Toyota",
    model: "Harrier",
    bodyType: "SUV",
    fuelType: "HYBRID",
    transmission: "CVT",
    condition: "FOREIGN_USED",
    region: "Greater Accra",
    price,
    year,
  });

  it("ignores both halves of a range, or every band reports what is already shown", () => {
    // The bug this prevents: counting the 300–500 band while the 200–300 band
    // is still applied returns 0 for every other band, so the sidebar tells the
    // buyer there is nothing else to look at.
    const filters = { ...EMPTY_FILTERS, minPrice: "200001", maxPrice: "300000" };
    const cars = [car(150_000, 2019), car(250_000, 2019), car(400_000, 2019)];

    const withBoth = cars.filter((c) => matchesFilters(c, filters, ["minPrice", "maxPrice"]));
    expect(withBoth).toHaveLength(3);

    // Dropping only one half still applies the other, which is the trap.
    const withOne = cars.filter((c) => matchesFilters(c, filters, "minPrice"));
    expect(withOne.length).toBeLessThan(3);
  });

  it("still honours every unrelated filter while counting", () => {
    const filters = { ...EMPTY_FILTERS, brand: "Toyota", minPrice: "200001", maxPrice: "300000" };
    const cars = [car(150_000, 2019), { ...car(250_000, 2019), brand: "Kia" }];
    const counted = cars.filter((c) => matchesFilters(c, filters, ["minPrice", "maxPrice"]));
    expect(counted.map((c) => c.brand)).toEqual(["Toyota"]);
  });
});

describe("every band actually reaches cars", () => {
  it("covers a realistic Ghanaian price ladder with no orphans", () => {
    const prices = [45_000, 99_999, 100_000, 185_000, 289_000, 466_000, 640_000, 1_250_000];
    for (const price of prices) {
      const matching = PRICE_BANDS.filter(
        (b) => (b.min == null || price >= b.min) && (b.max == null || price <= b.max),
      );
      expect(matching, `GH₵${price} lands in ${matching.length} bands`).toHaveLength(1);
    }
  });

  it("covers a realistic year ladder", () => {
    for (const year of [2008, 2013, 2014, 2016, 2017, 2019, 2020, 2022, 2023, 2026]) {
      const matching = YEAR_BANDS.filter(
        (b) => (b.min == null || year >= b.min) && (b.max == null || year <= b.max),
      );
      expect(matching, `${year} lands in ${matching.length} bands`).toHaveLength(1);
    }
  });
});
