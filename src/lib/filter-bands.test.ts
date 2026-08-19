import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  describeQuery,
  isSelected,
  selectedValues,
  toggleValue,
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

describe("the price band labels", () => {
  it("say the currency once, in the heading, rather than on every row", () => {
    // Six rows each opening with the same three characters is noise the eye
    // steps over on every line, and it is about fifty pixels of a sidebar the
    // cards now use. Put it back on the rows and the widest band no longer fits
    // the column — where the label is `truncate`, so it is cut in silence
    // rather than reported.
    for (const band of PRICE_BANDS) {
      expect(band.label, `${band.label} repeats the currency`).not.toMatch(/GH₵|GHS|₵/);
    }

    const browser = readFileSync(
      join(process.cwd(), "src", "components", "vehicles", "vehicle-browser.tsx"),
      "utf8",
    );
    expect(
      browser,
      "the facet heading is the only place the currency is stated — without it the rows read as bare numbers",
    ).toContain('<Facet label="Price (GH₵)">');
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

describe("choosing more than one of something", () => {
  const car = (over: Partial<FilterableVehicle>): FilterableVehicle => ({
    title: "Toyota Harrier",
    brand: "Toyota",
    model: "Harrier",
    bodyType: "SUV",
    fuelType: "HYBRID",
    transmission: "CVT",
    condition: "FOREIGN_USED",
    region: "Greater Accra",
    price: 289_000,
    year: 2019,
    ...over,
  });

  const fleet = [
    car({ brand: "Toyota", bodyType: "SUV" }),
    car({ brand: "Honda", bodyType: "SUV" }),
    car({ brand: "Kia", bodyType: "SEDAN" }),
    car({ brand: "Toyota", bodyType: "SEDAN" }),
  ];

  it("returns the union within a facet, not the intersection", () => {
    // Ticking two brands must widen the search. Read as an AND it would return
    // nothing at all, because no car is both a Toyota and a Honda — the classic
    // way multi-select filters get shipped broken.
    const filters = { ...EMPTY_FILTERS, brand: "Toyota,Honda" };
    const hits = fleet.filter((c) => matchesFilters(c, filters));
    expect(hits).toHaveLength(3);
    expect(new Set(hits.map((c) => c.brand))).toEqual(new Set(["Toyota", "Honda"]));
  });

  it("still narrows across facets", () => {
    // "Toyota or Honda, AND an SUV" — the only reading that means anything.
    const filters = { ...EMPTY_FILTERS, brand: "Toyota,Honda", bodyType: "SUV" };
    const hits = fleet.filter((c) => matchesFilters(c, filters));
    expect(hits).toHaveLength(2);
  });

  it("treats a single value exactly as it always did", () => {
    // Saved searches and shared links made before multi-select carry
    // `brand=Toyota`, and must keep working untouched.
    const filters = { ...EMPTY_FILTERS, brand: "Toyota" };
    expect(fleet.filter((c) => matchesFilters(c, filters))).toHaveLength(2);
  });

  it("treats an empty facet as no constraint", () => {
    expect(fleet.filter((c) => matchesFilters(c, { ...EMPTY_FILTERS, brand: "" }))).toHaveLength(4);
  });

  it("does not match a car whose value is missing", () => {
    // A listing with no region should fail a region filter rather than pass
    // every one of them.
    const noRegion = car({ region: undefined });
    expect(matchesFilters(noRegion, { ...EMPTY_FILTERS, region: "Ashanti" })).toBe(false);
  });
});

describe("toggling a value", () => {
  it("adds, then removes", () => {
    expect(toggleValue("", "Toyota")).toBe("Toyota");
    expect(toggleValue("Toyota", "Honda")).toBe("Toyota,Honda");
    expect(toggleValue("Toyota,Honda", "Toyota")).toBe("Honda");
    expect(toggleValue("Honda", "Honda")).toBe("");
  });

  it("reports what is selected", () => {
    expect(selectedValues("Toyota,Honda")).toEqual(["Toyota", "Honda"]);
    expect(selectedValues("")).toEqual([]);
    expect(isSelected("Toyota,Honda", "Honda")).toBe(true);
    expect(isSelected("Toyota,Honda", "Kia")).toBe(false);
    // "Kia" must not match inside "Kia,Nissan" by substring.
    expect(isSelected("Toyota", "Toy")).toBe(false);
  });
});

describe("the active-filter badge", () => {
  it("counts each chosen value, not each facet", () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, brand: "Toyota,Honda,Kia" })).toBe(3);
  });

  it("counts a price band as one filter, not the two fields it writes", () => {
    // The old count said "2 filters" for a single band, which made the number
    // on the mobile trigger quietly untrustworthy.
    const band = bandToRange(PRICE_BANDS.find((b) => b.id === "200-300")!);
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, minPrice: band.min, maxPrice: band.max }),
    ).toBe(1);
  });

  it("counts an open-ended band as one", () => {
    const under = bandToRange(PRICE_BANDS.find((b) => b.id === "u100")!);
    expect(activeFilterCount({ ...EMPTY_FILTERS, minPrice: under.min, maxPrice: under.max })).toBe(1);
    const over = bandToRange(PRICE_BANDS.find((b) => b.id === "o800")!);
    expect(activeFilterCount({ ...EMPTY_FILTERS, minPrice: over.min, maxPrice: over.max })).toBe(1);
  });

  it("adds up across facets", () => {
    expect(
      activeFilterCount({
        ...EMPTY_FILTERS,
        q: "camry",
        brand: "Toyota,Honda",
        minPrice: "200001",
        maxPrice: "300000",
      }),
    ).toBe(4);
  });

  it("is zero for an untouched panel", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });
});

describe("describing a saved search", () => {
  it("reads several values back as a person would say them", () => {
    expect(describeQuery("brand=Toyota,Honda")).toBe("Toyota or Honda");
    expect(describeQuery("brand=Toyota,Honda,Kia")).toBe("Toyota, Honda or Kia");
    expect(describeQuery("brand=Toyota")).toBe("Toyota");
  });
});
