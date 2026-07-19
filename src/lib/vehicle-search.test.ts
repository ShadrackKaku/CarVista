import { describe, it, expect } from "vitest";
import {
  EMPTY_FILTERS,
  filtersToQuery,
  queryToFilters,
  activeFilterCount,
  describeQuery,
  type VehicleFilters,
} from "@/lib/vehicle-search";

describe("filtersToQuery / queryToFilters", () => {
  it("round-trips a set of filters + sort", () => {
    const filters: VehicleFilters = {
      ...EMPTY_FILTERS,
      brand: "Toyota",
      bodyType: "SUV",
      maxPrice: "200000",
      minYear: "2015",
    };
    const q = filtersToQuery(filters, "price-asc");
    const parsed = queryToFilters(new URLSearchParams(q));
    expect(parsed.filters.brand).toBe("Toyota");
    expect(parsed.filters.bodyType).toBe("SUV");
    expect(parsed.filters.maxPrice).toBe("200000");
    expect(parsed.filters.minYear).toBe("2015");
    expect(parsed.sort).toBe("price-asc");
  });

  it("omits empty filters and the default sort from the query string", () => {
    expect(filtersToQuery(EMPTY_FILTERS, "relevance")).toBe("");
    expect(filtersToQuery({ ...EMPTY_FILTERS, brand: "Kia" }, "relevance")).toBe("brand=Kia");
  });

  it("falls back to relevance for an unknown sort", () => {
    const parsed = queryToFilters(new URLSearchParams("sort=bogus"));
    expect(parsed.sort).toBe("relevance");
  });

  it("reads Next.js-style searchParams objects (incl. array values)", () => {
    const parsed = queryToFilters({ brand: "Honda", q: ["Civic", "ignored"] });
    expect(parsed.filters.brand).toBe("Honda");
    expect(parsed.filters.q).toBe("Civic");
  });
});

describe("activeFilterCount", () => {
  it("counts only non-empty filters", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...EMPTY_FILTERS, brand: "Toyota", region: "Greater Accra" })).toBe(2);
    expect(activeFilterCount({ ...EMPTY_FILTERS, brand: "   " })).toBe(0);
  });
});

describe("describeQuery", () => {
  it("summarizes a saved search into a readable label", () => {
    expect(describeQuery("brand=Toyota&bodyType=SUV&maxPrice=200000")).toBe(
      "Toyota · SUV · ≤ GHS 200000",
    );
    expect(describeQuery("")).toBe("All vehicles");
  });
});
