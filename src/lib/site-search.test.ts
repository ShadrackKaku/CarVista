import { describe, expect, it } from "vitest";
import {
  groupResults,
  searchSite,
  tokenize,
  type SiteSearchData,
} from "@/lib/site-search";
import type {
  SampleBlogPost,
  SampleDealer,
  SamplePart,
  SampleService,
  SampleVehicle,
} from "@/lib/sample-data";

const vehicle = (over: Partial<SampleVehicle> = {}): SampleVehicle => ({
  id: "v1",
  slug: "2018-toyota-camry",
  title: "2018 Toyota Camry",
  brand: "Toyota",
  model: "Camry",
  year: 2018,
  price: 180000,
  mileage: 50000,
  fuelType: "Petrol",
  transmission: "Automatic",
  engineSize: 2.5,
  bodyType: "Sedan",
  color: "Silver",
  condition: "Foreign Used",
  importStatus: "CLEARED",
  city: "Accra",
  location: "Accra, Greater Accra",
  featured: false,
  verified: true,
  images: ["https://img/camry.jpg"],
  dealer: { name: "Prime Motors", slug: "prime-motors", verified: true },
  features: ["Reverse camera", "Leather seats"],
  description: "<p>Clean <strong>Toyota</strong> Camry, well maintained.</p>",
  ...over,
});

const part = (over: Partial<SamplePart> = {}): SamplePart => ({
  id: "p1",
  slug: "toyota-brake-pads",
  name: "Toyota Brake Pads",
  category: "Brakes",
  categorySlug: "brakes",
  brand: "Toyota",
  price: 450,
  condition: "New",
  stock: 12,
  rating: 4.5,
  reviewCount: 8,
  compatibleMakes: ["Toyota", "Lexus"],
  image: "https://img/pads.jpg",
  store: { name: "AutoParts GH", slug: "autoparts-gh", verified: true },
  featured: false,
  ...over,
});

const service = (over: Partial<SampleService> = {}): SampleService => ({
  id: "s1",
  slug: "accra-auto-care",
  name: "Accra Auto Care",
  type: "MECHANIC",
  typeLabel: "Mechanic",
  city: "Accra",
  region: "Greater Accra",
  verified: true,
  rating: 4.7,
  reviewCount: 20,
  image: "https://img/svc.jpg",
  services: ["Engine repair", "Diagnostics"],
  priceRange: "GHS 100 - 500",
  ...over,
});

const dealer = (over: Partial<SampleDealer> = {}): SampleDealer => ({
  id: "d1",
  slug: "prime-motors",
  name: "Prime Motors",
  city: "Kumasi",
  region: "Ashanti",
  verified: true,
  rating: 4.8,
  reviewCount: 30,
  vehicleCount: 42,
  yearsInBusiness: 10,
  logo: "https://img/logo.jpg",
  cover: "https://img/cover.jpg",
  description: "Trusted dealer of foreign-used cars.",
  ...over,
});

const blog = (over: Partial<SampleBlogPost> = {}): SampleBlogPost => ({
  id: "b1",
  slug: "importing-cars-to-ghana",
  title: "A Guide to Importing Cars to Ghana",
  excerpt: "Everything you need to know about duty and clearing.",
  category: "Guides",
  cover: "https://img/blog.jpg",
  author: "CarVista Team",
  date: "2026-01-01",
  readTime: 6,
  ...over,
});

const data = (over: Partial<SiteSearchData> = {}): SiteSearchData => ({
  vehicles: [vehicle()],
  parts: [part()],
  services: [service()],
  dealers: [dealer()],
  blog: [blog()],
  ...over,
});

describe("tokenize", () => {
  it("lowercases and splits on non-alphanumerics", () => {
    expect(tokenize("Toyota  Camry-2018")).toEqual(["toyota", "camry", "2018"]);
  });
  it("returns [] for a blank query", () => {
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("searchSite", () => {
  it("returns nothing for an empty query", () => {
    expect(searchSite("", data())).toEqual([]);
  });

  it("matches across every content type", () => {
    // 'toyota' appears in the car, the part (brand), and could match others.
    const results = searchSite("toyota", data());
    const types = new Set(results.map((r) => r.type));
    expect(types.has("vehicle")).toBe(true);
    expect(types.has("part")).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("requires ALL terms to be present (AND semantics)", () => {
    // The car matches 'toyota camry'; the part (Brake Pads) does not.
    const results = searchSite("toyota camry", data());
    expect(results.every((r) => r.type === "vehicle")).toBe(true);
    expect(results[0].href).toBe("/app/marketplace/vehicles/2018-toyota-camry");
  });

  it("points each result at its in-shell detail page", () => {
    // Search itself only exists inside the shell now, so a result that linked
    // to the public copy would drop the user straight back out of it.
    expect(searchSite("brake", data())[0].href).toBe("/app/marketplace/parts/toyota-brake-pads");
    expect(searchSite("mechanic", data())[0].href).toBe(
      "/app/marketplace/services/accra-auto-care",
    );
    expect(searchSite("kumasi", data())[0].href).toBe("/app/marketplace/dealers/prime-motors");
    // The blog is the exception: reading an article is not authenticated work,
    // so it stays on the public site where it is indexable.
    expect(searchSite("importing", data())[0].href).toBe("/blog/importing-cars-to-ghana");
  });

  it("ranks a title match above a body-only match", () => {
    const titleHit = vehicle({ id: "v-title", slug: "honda-civic", title: "Honda Civic" });
    const bodyHit = vehicle({
      id: "v-body",
      slug: "kia-rio",
      title: "Kia Rio",
      brand: "Kia",
      model: "Rio",
      description: "A great alternative to the Honda Civic.",
    });
    const results = searchSite("honda", data({ vehicles: [bodyHit, titleHit], parts: [] }));
    expect(results[0].id).toBe("v-title");
  });

  it("ignores HTML tags in descriptions when matching", () => {
    // 'strong' is only present as an HTML tag in the description — must not match.
    expect(searchSite("strong", data())).toEqual([]);
  });
});

describe("groupResults", () => {
  it("buckets results by type", () => {
    const grouped = groupResults(searchSite("toyota", data()));
    expect(grouped.vehicle.length).toBeGreaterThanOrEqual(1);
    expect(grouped.part.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(grouped.service)).toBe(true);
  });
});
