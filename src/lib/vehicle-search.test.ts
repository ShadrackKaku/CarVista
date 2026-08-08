import { describe, it, expect } from "vitest";
import {
  EMPTY_FILTERS,
  filtersToQuery,
  queryToFilters,
  activeFilterCount,
  describeQuery,
  matchesFilters,
  type FilterableVehicle,
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

describe("matchesFilters", () => {
  const car = (over: Partial<FilterableVehicle> = {}): FilterableVehicle => ({
    title: "2019 Toyota Corolla",
    brand: "Toyota",
    model: "Corolla",
    bodyType: "SEDAN",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    condition: "GHANA_USED",
    region: "Greater Accra",
    price: 200_000,
    year: 2019,
    ...over,
  });

  it("keeps a vehicle that satisfies every active filter", () => {
    expect(matchesFilters(car(), { ...EMPTY_FILTERS, brand: "Toyota", minYear: "2015" })).toBe(true);
  });

  it("drops one that fails any of them", () => {
    expect(matchesFilters(car(), { ...EMPTY_FILTERS, brand: "Honda" })).toBe(false);
    expect(matchesFilters(car(), { ...EMPTY_FILTERS, maxPrice: "150000" })).toBe(false);
    expect(matchesFilters(car(), { ...EMPTY_FILTERS, minYear: "2020" })).toBe(false);
  });

  it("ignores exactly the one facet it is told to", () => {
    // This is what makes an option's count mean "how many if I pick this".
    const filters = { ...EMPTY_FILTERS, condition: "NEW", brand: "Toyota" };
    expect(matchesFilters(car(), filters)).toBe(false);
    expect(matchesFilters(car(), filters, "condition")).toBe(true);
    // Ignoring condition must not quietly relax anything else.
    expect(matchesFilters(car({ brand: "Kia" }), filters, "condition")).toBe(false);
  });

  it("fails a region filter for a listing that states no region", () => {
    // Not "matches every region" — a car with no location cannot be claimed as
    // being in the one you asked for.
    expect(matchesFilters(car({ region: undefined }), { ...EMPTY_FILTERS, region: "Ashanti" })).toBe(
      false,
    );
    expect(matchesFilters(car({ region: undefined }), EMPTY_FILTERS)).toBe(true);
  });

  it("matches the keyword across title, brand and model", () => {
    for (const q of ["corolla", "TOYOTA", "2019"]) {
      expect(matchesFilters(car(), { ...EMPTY_FILTERS, q })).toBe(true);
    }
    expect(matchesFilters(car(), { ...EMPTY_FILTERS, q: "hilux" })).toBe(false);
  });
});
