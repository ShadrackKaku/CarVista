import { describe, it, expect } from "vitest";
import { categoryNameFromSlug } from "./parts";
import { partListingSchema } from "./validations";

describe("categoryNameFromSlug", () => {
  it("maps a known category slug to its display name", () => {
    expect(categoryNameFromSlug("brake-parts")).toBe("Brake Parts");
    expect(categoryNameFromSlug("tyres-wheels")).toBe("Tyres & Wheels");
  });

  it("title-cases an unknown slug as a fallback", () => {
    expect(categoryNameFromSlug("custom-widgets")).toBe("Custom Widgets");
  });
});

describe("partListingSchema", () => {
  const base = {
    name: "Toyota Corolla Front Brake Pads",
    categorySlug: "brake-parts",
    condition: "NEW",
    price: 450,
    stock: 10,
  };

  it("accepts a valid listing and coerces numeric strings", () => {
    const parsed = partListingSchema.safeParse({ ...base, price: "450", stock: "10" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.price).toBe(450);
      expect(parsed.data.stock).toBe(10);
    }
  });

  it("rejects a name shorter than 3 characters", () => {
    expect(partListingSchema.safeParse({ ...base, name: "AB" }).success).toBe(false);
  });

  it("rejects a discount price that is not lower than the price", () => {
    expect(partListingSchema.safeParse({ ...base, discountPrice: 450 }).success).toBe(false);
    expect(partListingSchema.safeParse({ ...base, discountPrice: 400 }).success).toBe(true);
  });

  it("rejects a non-positive price and negative stock", () => {
    expect(partListingSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
    expect(partListingSchema.safeParse({ ...base, stock: -1 }).success).toBe(false);
  });

  it("rejects a year range where 'to' precedes 'from'", () => {
    expect(partListingSchema.safeParse({ ...base, yearFrom: 2020, yearTo: 2015 }).success).toBe(
      false,
    );
    expect(partListingSchema.safeParse({ ...base, yearFrom: 2015, yearTo: 2020 }).success).toBe(
      true,
    );
  });

  it("rejects an invalid condition", () => {
    expect(partListingSchema.safeParse({ ...base, condition: "SALVAGE" }).success).toBe(false);
  });
});
