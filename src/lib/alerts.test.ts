import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { filtersToVehicleWhere } from "./alerts";
import { EMPTY_FILTERS } from "./vehicle-search";

describe("filtersToVehicleWhere", () => {
  it("produces an empty clause for empty filters", () => {
    expect(filtersToVehicleWhere({ ...EMPTY_FILTERS })).toEqual({});
  });

  it("maps categorical filters", () => {
    const where = filtersToVehicleWhere({
      ...EMPTY_FILTERS,
      q: "camry",
      brand: "Toyota",
      bodyType: "SEDAN",
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      condition: "FOREIGN_USED",
      region: "Greater Accra",
    });
    expect(where.title).toEqual({ contains: "camry", mode: "insensitive" });
    expect(where.brand).toEqual({ name: "Toyota" });
    expect(where.bodyType).toBe("SEDAN");
    expect(where.fuelType).toBe("PETROL");
    expect(where.transmission).toBe("AUTOMATIC");
    expect(where.condition).toBe("FOREIGN_USED");
    expect(where.region).toBe("Greater Accra");
  });

  it("maps a price range to a Decimal filter", () => {
    const where = filtersToVehicleWhere({ ...EMPTY_FILTERS, minPrice: "50000", maxPrice: "200000" });
    const price = where.price as Prisma.DecimalFilter;
    expect(Number(price.gte)).toBe(50000);
    expect(Number(price.lte)).toBe(200000);
  });

  it("maps a year range to numeric bounds and omits open ends", () => {
    const where = filtersToVehicleWhere({ ...EMPTY_FILTERS, minYear: "2015" });
    const year = where.year as Prisma.IntFilter;
    expect(year.gte).toBe(2015);
    expect(year.lte).toBeUndefined();
    expect(where.price).toBeUndefined();
  });
});
