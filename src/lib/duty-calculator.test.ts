import { describe, it, expect } from "vitest";
import {
  calculateDuty,
  resolveImportDutyRate,
  resolveOverAgePenalty,
  DEFAULT_RATES,
} from "./duty-calculator";

const thisYear = new Date().getFullYear();
const findItem = (r: ReturnType<typeof calculateDuty>, key: string) =>
  r.lineItems.find((li) => li.key === key);

describe("resolveImportDutyRate", () => {
  it("gives electric vehicles the 10% concession (fuel takes precedence over body)", () => {
    expect(resolveImportDutyRate({ fuelType: "ELECTRIC", bodyType: "SEDAN", engineSizeCc: 0 })).toMatchObject({
      rate: 10,
      category: "EV",
    });
    // Even an electric pickup is classed as EV, not commercial.
    expect(
      resolveImportDutyRate({ fuelType: "ELECTRIC", bodyType: "PICKUP", engineSizeCc: 0 }).rate,
    ).toBe(10);
  });

  it("classes goods and passenger-transport vehicles at concessionary rates", () => {
    for (const bodyType of ["PICKUP", "TRUCK", "VAN"] as const) {
      expect(resolveImportDutyRate({ fuelType: "DIESEL", bodyType, engineSizeCc: 2500 }).rate).toBe(10);
    }
    for (const bodyType of ["BUS", "MINIVAN"] as const) {
      expect(resolveImportDutyRate({ fuelType: "DIESEL", bodyType, engineSizeCc: 2500 }).rate).toBe(5);
    }
  });

  it("applies the standard 20% to saloons/SUVs across engine bands", () => {
    expect(resolveImportDutyRate({ fuelType: "PETROL", bodyType: "SEDAN", engineSizeCc: 1500 }).category).toBe("SALOON_SMALL");
    expect(resolveImportDutyRate({ fuelType: "PETROL", bodyType: "SUV", engineSizeCc: 2500 }).category).toBe("SALOON_MID");
    expect(resolveImportDutyRate({ fuelType: "PETROL", bodyType: "SUV", engineSizeCc: 3500 }).category).toBe("SALOON_LARGE");
    expect(resolveImportDutyRate({ fuelType: "PETROL", bodyType: "SEDAN", engineSizeCc: 1500 }).rate).toBe(20);
  });
});

describe("resolveOverAgePenalty", () => {
  it("has no penalty at or below 10 years", () => {
    expect(resolveOverAgePenalty(0)).toBe(0);
    expect(resolveOverAgePenalty(10)).toBe(0);
  });
  it("steps up across the age bands", () => {
    expect(resolveOverAgePenalty(11)).toBe(5);
    expect(resolveOverAgePenalty(12)).toBe(5);
    expect(resolveOverAgePenalty(13)).toBe(20);
    expect(resolveOverAgePenalty(15)).toBe(20);
    expect(resolveOverAgePenalty(16)).toBe(50);
    expect(resolveOverAgePenalty(30)).toBe(50);
  });
});

describe("calculateDuty", () => {
  it("computes CIF, the VAT base and totals for a standard saloon", () => {
    const r = calculateDuty({
      cifValue: 10000,
      currency: "USD",
      exchangeRate: 15,
      manufactureYear: thisYear - 3, // no over-age penalty
      engineSizeCc: 1800,
      fuelType: "PETROL",
      bodyType: "SEDAN",
    });

    expect(r.cifGhs).toBe(150000);
    expect(r.exchangeRate).toBe(15);
    expect(r.overAge).toBe(false);
    // Import duty at 20% of CIF.
    expect(findItem(r, "importDuty")!.amount).toBeCloseTo(30000, 2);
    // VAT base = CIF + duty + NHIL + GETFund + COVID = 189000; VAT @15% = 28350.
    expect(findItem(r, "vat")!.amount).toBeCloseTo(28350, 2);
    expect(r.taxesSubtotal).toBeCloseTo(70200, 2);
    // Default logistics: 0 + 3500 + 2500 + 800 + 500.
    expect(r.logisticsSubtotal).toBeCloseTo(7300, 2);
    expect(r.totalLandedCost).toBeCloseTo(227500, 2);
    expect(r.totalLandedCost).toBeCloseTo(r.cifGhs + r.taxesSubtotal + r.logisticsSubtotal, 2);
  });

  it("forces an exchange rate of 1 when the CIF is already in GHS", () => {
    const r = calculateDuty({
      cifValue: 200000,
      currency: "GHS",
      manufactureYear: thisYear - 1,
      engineSizeCc: 1600,
      fuelType: "PETROL",
      bodyType: "SEDAN",
    });
    expect(r.exchangeRate).toBe(1);
    expect(r.cifGhs).toBe(200000);
  });

  it("defaults the USD exchange rate to 15.5 when omitted", () => {
    const r = calculateDuty({
      cifValue: 1000,
      currency: "USD",
      manufactureYear: thisYear,
      engineSizeCc: 1500,
      fuelType: "PETROL",
      bodyType: "SEDAN",
    });
    expect(r.exchangeRate).toBe(15.5);
    expect(r.cifGhs).toBeCloseTo(15500, 2);
  });

  it("clamps a negative CIF to zero", () => {
    const r = calculateDuty({
      cifValue: -5000,
      currency: "GHS",
      manufactureYear: thisYear,
      engineSizeCc: 1500,
      fuelType: "PETROL",
      bodyType: "SEDAN",
    });
    expect(r.cifGhs).toBe(0);
    expect(r.taxesSubtotal).toBe(0);
  });

  it("honours an admin import-duty override", () => {
    const r = calculateDuty({
      cifValue: 100000,
      currency: "GHS",
      manufactureYear: thisYear,
      engineSizeCc: 2500,
      fuelType: "PETROL",
      bodyType: "SEDAN",
      rates: { importDutyRate: 10 },
    });
    // 10% override, not the resolved 20%.
    expect(findItem(r, "importDuty")!.amount).toBeCloseTo(10000, 2);
    expect(r.ratesUsed.importDutyRate).toBe(10);
  });

  it("adds an over-age penalty for vehicles older than 15 years", () => {
    const r = calculateDuty({
      cifValue: 100000,
      currency: "GHS",
      manufactureYear: thisYear - 16,
      engineSizeCc: 2000,
      fuelType: "PETROL",
      bodyType: "SEDAN",
    });
    expect(r.overAge).toBe(true);
    expect(r.vehicleAgeYears).toBe(16);
    expect(findItem(r, "overage")!.amount).toBeCloseTo(50000, 2); // 50% of 100000
  });

  it("uses the documented default rate set", () => {
    expect(DEFAULT_RATES.vatRate).toBe(15);
    expect(DEFAULT_RATES.importDutyRate).toBe(20);
  });
});
