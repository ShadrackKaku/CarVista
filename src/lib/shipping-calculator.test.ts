import { describe, it, expect } from "vitest";
import {
  estimateShipping,
  SHIPPING_LANES,
  SHIPPING_METHOD_LABELS,
} from "./shipping-calculator";

describe("estimateShipping", () => {
  it("prices a standard sedan on a known lane", () => {
    const r = estimateShipping({
      originCountry: "Germany",
      method: "RORO",
      vehicleClass: "SEDAN",
      exchangeRate: 15,
    });
    expect(r.lane?.originCountry).toBe("Germany");
    expect(r.costUsd).toBe(950); // base RORO for Germany, sedan multiplier 1
    expect(r.costGhs).toBe(14250); // 950 * 15
    expect(r.transitDaysMin).toBe(18);
    expect(r.transitDaysMax).toBe(30);
  });

  it("applies vehicle-class multipliers and rounds", () => {
    // Germany CONTAINER_20 base 2100; SUV multiplier 1.25 → 2625.
    expect(
      estimateShipping({ originCountry: "Germany", method: "CONTAINER_20", vehicleClass: "SUV" }).costUsd,
    ).toBe(2625);
    // Japan RORO base 1300; PICKUP 1.4 → 1820.
    expect(
      estimateShipping({ originCountry: "Japan", method: "RORO", vehicleClass: "PICKUP" }).costUsd,
    ).toBe(1820);
    // UK RORO base 900; BUS 1.8 → 1620.
    expect(
      estimateShipping({ originCountry: "United Kingdom", method: "RORO", vehicleClass: "BUS" }).costUsd,
    ).toBe(1620);
  });

  it("falls back to the first lane for an unknown origin country", () => {
    const r = estimateShipping({
      originCountry: "Atlantis",
      method: "RORO",
      vehicleClass: "SEDAN",
    });
    expect(r.lane).toBe(SHIPPING_LANES[0]);
    expect(r.costUsd).toBe(SHIPPING_LANES[0].base.RORO);
  });

  it("defaults the exchange rate to 15.5 when omitted", () => {
    const r = estimateShipping({
      originCountry: "United Kingdom",
      method: "RORO",
      vehicleClass: "SEDAN",
    });
    // base 900 * 1 = 900 USD; 900 * 15.5 = 13950.
    expect(r.costUsd).toBe(900);
    expect(r.costGhs).toBe(13950);
  });

  it("labels each shipping method", () => {
    expect(SHIPPING_METHOD_LABELS.RORO).toMatch(/RoRo/);
    expect(SHIPPING_METHOD_LABELS.CONTAINER_40).toMatch(/40ft/);
  });
});
