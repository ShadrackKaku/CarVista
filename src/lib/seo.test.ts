import { describe, it, expect } from "vitest";
import { breadcrumbJsonLd, hasActiveFilters } from "./seo";
import { SITE } from "./constants";

describe("breadcrumbJsonLd", () => {
  it("builds a positioned BreadcrumbList with absolute item URLs", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Vehicles", path: "/vehicles" },
      { name: "2021 Toyota Camry" },
    ]) as {
      "@type": string;
      itemListElement: { position: number; name: string; item?: string }[];
    };

    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0]).toMatchObject({
      position: 1,
      name: "Home",
      item: `${SITE.url}/`,
    });
    expect(ld.itemListElement[1]).toMatchObject({
      position: 2,
      name: "Vehicles",
      item: `${SITE.url}/vehicles`,
    });
  });

  it("omits the item URL for a crumb without a path (the current page)", () => {
    const ld = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Current" }]) as {
      itemListElement: { name: string; item?: string }[];
    };
    expect(ld.itemListElement[1].name).toBe("Current");
    expect(ld.itemListElement[1].item).toBeUndefined();
  });
});

describe("hasActiveFilters", () => {
  it("is false for no/empty params", () => {
    expect(hasActiveFilters(undefined)).toBe(false);
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ brand: "", sort: "" })).toBe(false);
    expect(hasActiveFilters({ brand: undefined })).toBe(false);
    expect(hasActiveFilters({ brand: [] })).toBe(false);
  });

  it("is true when any filter/sort/page param has a value", () => {
    expect(hasActiveFilters({ brand: "toyota" })).toBe(true);
    expect(hasActiveFilters({ sort: "price-asc" })).toBe(true);
    expect(hasActiveFilters({ page: "2" })).toBe(true);
    expect(hasActiveFilters({ tags: ["a", "b"] })).toBe(true);
  });
});
