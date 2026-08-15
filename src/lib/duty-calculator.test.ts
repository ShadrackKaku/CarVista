import { describe, it, expect } from "vitest";
import {
  calculateDuty,
  resolveImportDutyRate,
  resolveOverAgePenalty,
  DEFAULT_RATES,
  DEFAULT_FLAT_CHARGES,
  DEFAULT_FREIGHT_INSURANCE_RATE,
  type DutyInput,
} from "./duty-calculator";

const thisYear = new Date().getFullYear();
const findItem = (r: ReturnType<typeof calculateDuty>, key: string) =>
  r.lineItems.find((li) => li.key === key);

const FLAT_TOTAL =
  DEFAULT_FLAT_CHARGES.shippersNetworkFee +
  DEFAULT_FLAT_CHARGES.disinfectionFee +
  DEFAULT_FLAT_CHARGES.idfProcessingFee;

/** A no-logistics, GHS-denominated call so totals are pure duty arithmetic. */
function bare(overrides: Partial<DutyInput> & { cifValue: number }) {
  return calculateDuty({
    currency: "GHS",
    manufactureYear: thisYear - 3,
    engineSizeCc: 2500,
    fuelType: "PETROL",
    bodyType: "SEDAN",
    shippingCost: 0,
    portCharges: 0,
    clearingCharges: 0,
    deliveryCost: 0,
    processingFee: 0,
    ...overrides,
  });
}

describe("resolveImportDutyRate", () => {
  it("gives electric vehicles the 10% concession (fuel takes precedence over body)", () => {
    expect(
      resolveImportDutyRate({ fuelType: "ELECTRIC", bodyType: "SEDAN", engineSizeCc: 0 }),
    ).toMatchObject({ rate: 10, category: "EV" });
    // Even an electric pickup is classed as EV, not a goods vehicle.
    expect(
      resolveImportDutyRate({ fuelType: "ELECTRIC", bodyType: "PICKUP", engineSizeCc: 0 }).rate,
    ).toBe(10);
  });

  it("classes goods and passenger-transport vehicles at concessionary rates", () => {
    for (const bodyType of ["PICKUP", "TRUCK", "VAN"] as const) {
      const r = resolveImportDutyRate({ fuelType: "DIESEL", bodyType, engineSizeCc: 2500 });
      expect(r.rate).toBe(10);
      expect(r.hsHeading).toBe("8704");
    }
    for (const bodyType of ["BUS", "MINIVAN"] as const) {
      const r = resolveImportDutyRate({ fuelType: "DIESEL", bodyType, engineSizeCc: 2500 });
      expect(r.rate).toBe(5);
      expect(r.hsHeading).toBe("8702");
    }
  });

  it("puts passenger cars in the 20% CET band regardless of engine size", () => {
    for (const engineSizeCc of [900, 1500, 2500, 3500, 6200]) {
      const r = resolveImportDutyRate({ fuelType: "PETROL", bodyType: "SUV", engineSizeCc });
      expect(r.rate).toBe(20);
      expect(r.dutyClass).toBe("PASSENGER_CAR");
      expect(r.hsHeading).toBe("8703");
    }
  });
});

describe("resolveOverAgePenalty", () => {
  it("has no penalty at or below 10 years", () => {
    expect(resolveOverAgePenalty(0)).toBe(0);
    expect(resolveOverAgePenalty(10)).toBe(0);
    expect(resolveOverAgePenalty(10, "COMMERCIAL")).toBe(0);
  });

  it("steps up across the car bands (Act 891)", () => {
    expect(resolveOverAgePenalty(11)).toBe(5);
    expect(resolveOverAgePenalty(12)).toBe(5);
    expect(resolveOverAgePenalty(13)).toBe(20);
    expect(resolveOverAgePenalty(15)).toBe(20);
    expect(resolveOverAgePenalty(16)).toBe(50);
    expect(resolveOverAgePenalty(30)).toBe(50);
  });

  it("uses the gentler commercial-vehicle bands", () => {
    for (const dutyClass of ["COMMERCIAL", "PASSENGER_TRANSPORT"] as const) {
      expect(resolveOverAgePenalty(11, dutyClass)).toBe(2.5);
      expect(resolveOverAgePenalty(14, dutyClass)).toBe(10);
      expect(resolveOverAgePenalty(18, dutyClass)).toBe(15);
      expect(resolveOverAgePenalty(25, dutyClass)).toBe(30);
    }
  });
});

describe("calculateDuty — levy bases", () => {
  const r = bare({ cifValue: 100_000, condition: "NEW" });

  it("charges import duty on CIF alone", () => {
    const duty = findItem(r, "importDuty")!;
    expect(duty.amount).toBeCloseTo(20_000, 6);
    expect(duty.base).toBe("CIF");
    expect(duty.baseAmount).toBeCloseTo(100_000, 6);
  });

  it("puts NHIL, GETFund and VAT all on the duty-inclusive value (Act 1151)", () => {
    const vatBase = 120_000;
    for (const [key, rate] of [
      ["nhil", 2.5],
      ["getfund", 2.5],
      ["vat", 15],
    ] as const) {
      const li = findItem(r, key)!;
      expect(li.base).toBe("CIF_PLUS_DUTY");
      expect(li.baseAmount).toBeCloseTo(vatBase, 6);
      expect(li.amount).toBeCloseTo((vatBase * rate) / 100, 6);
    }
    // The three together are exactly 20% of the base — the post-Act-1151 rate.
    const family =
      findItem(r, "nhil")!.amount + findItem(r, "getfund")!.amount + findItem(r, "vat")!.amount;
    expect(family).toBeCloseTo(vatBase * 0.2, 6);
  });

  it("charges AU, ECOWAS, EXIM and the Special Import Levy on CIF", () => {
    for (const [key, rate] of [
      ["au", 0.2],
      ["ecowas", 0.5],
      ["exim", 0.75],
      ["specialImport", 2],
    ] as const) {
      const li = findItem(r, key)!;
      expect(li.base).toBe("CIF");
      expect(li.amount).toBeCloseTo((100_000 * rate) / 100, 6);
    }
  });

  it("charges the network charge on FOB, then stacks its own VAT family", () => {
    const fob = 100_000 / (1 + DEFAULT_FREIGHT_INSURANCE_RATE);
    expect(r.fobGhs).toBeCloseTo(fob, 6);

    const nc = findItem(r, "network")!;
    expect(nc.base).toBe("FOB");
    expect(nc.amount).toBeCloseTo(fob * 0.004, 6);

    // Unlike the goods VAT, this VAT sits on top of its own NHIL/GETFund.
    const ncVat = findItem(r, "networkVat")!;
    expect(ncVat.amount).toBeCloseTo(nc.amount * 1.05 * 0.15, 6);
    // Whole network family = 0.4% of FOB grossed up by 1.2075.
    const ncFamily =
      nc.amount +
      findItem(r, "networkNhil")!.amount +
      findItem(r, "networkGetfund")!.amount +
      ncVat.amount;
    expect(ncFamily).toBeCloseTo(fob * 0.004 * 1.2075, 6);
  });

  it("adds the fixed cedi charges", () => {
    expect(findItem(r, "shippersNetworkFee")!.amount).toBe(9);
    expect(findItem(r, "disinfection")!.amount).toBe(379);
    expect(findItem(r, "idf")!.amount).toBe(5);
  });

  it("no longer models the withdrawn COVID-19 Health Recovery Levy", () => {
    expect(findItem(r, "covid")).toBeUndefined();
    expect(Object.keys(DEFAULT_RATES)).not.toContain("covidLevyRate");
  });
});

describe("calculateDuty — examination fee", () => {
  it("charges 1% of CIF on used vehicles and nothing on new ones", () => {
    const used = bare({ cifValue: 100_000, condition: "USED" });
    const brandNew = bare({ cifValue: 100_000, condition: "NEW" });
    expect(findItem(used, "examination")!.amount).toBeCloseTo(1_000, 6);
    expect(findItem(brandNew, "examination")).toBeUndefined();
    expect(used.taxesSubtotal - brandNew.taxesSubtotal).toBeCloseTo(1_000, 6);
  });

  it("defaults to USED — the imports this platform handles are used vehicles", () => {
    expect(bare({ cifValue: 50_000 }).condition).toBe("USED");
  });
});

describe("calculateDuty — effective rates", () => {
  // Closed form: duty d gives 1.20d + 0.2345 of CIF, plus 0.43% for the
  // network family, plus 1% when the vehicle is used. These are the rates we
  // measured against real ICUMS Tax Results.
  const cases: { duty: number; bodyType: DutyInput["bodyType"]; expected: number }[] = [
    { duty: 5, bodyType: "BUS", expected: 29.88 },
    { duty: 10, bodyType: "PICKUP", expected: 35.88 },
    { duty: 20, bodyType: "SEDAN", expected: 47.88 },
  ];

  for (const { duty, bodyType, expected } of cases) {
    it(`a new vehicle at ${duty}% duty lands at ~${expected}% of CIF`, () => {
      const cif = 1_000_000;
      const r = bare({ cifValue: cif, bodyType, fuelType: "DIESEL", condition: "NEW" });
      expect(r.ratesUsed.importDutyRate).toBe(duty);
      // Net of the fixed cedi charges, which do not scale with CIF.
      const scaled = ((r.taxesSubtotal - FLAT_TOTAL) / cif) * 100;
      expect(scaled).toBeCloseTo(expected, 2);
    });
  }

  it("a used 20%-duty saloon lands at ~48.88%, matching observed ICUMS assessments", () => {
    const cif = 1_000_000;
    const r = bare({ cifValue: cif, condition: "USED" });
    const scaled = ((r.taxesSubtotal - FLAT_TOTAL) / cif) * 100;
    expect(scaled).toBeCloseTo(48.88, 2);
    // With the flats included this is the 48.91% we measured in the field.
    expect(r.effectiveTaxRate).toBeCloseTo(48.92, 2);
  });
});

describe("calculateDuty — published worked example", () => {
  /**
   * Independent third-party calculator, new vehicle, 5% duty band:
   * CIF GH¢300,099.82 → total duties + levies GH¢90,065.57.
   *
   * We reproduce it to within a cedi. The residual is the freight ratio used
   * to back out FOB for the network charge, which the source did not publish.
   */
  it("reproduces GH¢90,065.57 on CIF GH¢300,099.82 at 5% duty", () => {
    const r = bare({
      cifValue: 300_099.82,
      bodyType: "BUS",
      fuelType: "DIESEL",
      condition: "NEW",
    });
    expect(r.ratesUsed.importDutyRate).toBe(5);
    expect(r.taxesSubtotal).toBeGreaterThan(90_064.57);
    expect(r.taxesSubtotal).toBeLessThan(90_066.57);
  });
});

describe("calculateDuty — plumbing", () => {
  it("forces an exchange rate of 1 when the CIF is already in GHS", () => {
    const r = bare({ cifValue: 200_000 });
    expect(r.exchangeRate).toBe(1);
    expect(r.cifGhs).toBe(200_000);
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
    expect(r.cifGhs).toBeCloseTo(15_500, 2);
  });

  it("uses an explicit FOB for the network charge when one is supplied", () => {
    const r = bare({ cifValue: 100_000, fobValue: 80_000 });
    expect(r.fobGhs).toBe(80_000);
    expect(findItem(r, "network")!.amount).toBeCloseTo(320, 6);
  });

  it("clamps a negative CIF to zero, leaving only the fixed charges", () => {
    const r = bare({ cifValue: -5000 });
    expect(r.cifGhs).toBe(0);
    expect(r.taxesSubtotal).toBeCloseTo(FLAT_TOTAL, 6);
    expect(r.effectiveTaxRate).toBe(0);
  });

  it("honours an admin import-duty override", () => {
    const r = bare({ cifValue: 100_000, rates: { importDutyRate: 10 } });
    expect(findItem(r, "importDuty")!.amount).toBeCloseTo(10_000, 6);
    expect(r.ratesUsed.importDutyRate).toBe(10);
  });

  it("adds an over-age penalty for vehicles older than 15 years", () => {
    const r = bare({ cifValue: 100_000, manufactureYear: thisYear - 16 });
    expect(r.overAge).toBe(true);
    expect(r.vehicleAgeYears).toBe(16);
    expect(findItem(r, "overage")!.amount).toBeCloseTo(50_000, 6);
  });

  it("keeps the total, the subtotals and the line items in agreement", () => {
    const r = calculateDuty({
      cifValue: 12_000,
      currency: "USD",
      exchangeRate: 12.4,
      manufactureYear: thisYear - 5,
      engineSizeCc: 2000,
      fuelType: "PETROL",
      bodyType: "SEDAN",
      shippingCost: 20_000,
    });
    expect(r.taxesSubtotal).toBeCloseTo(
      r.taxLineItems.reduce((s, li) => s + li.amount, 0),
      6,
    );
    expect(r.totalLandedCost).toBeCloseTo(
      r.cifGhs + r.taxesSubtotal + r.logisticsSubtotal,
      6,
    );
    expect(r.lineItems).toHaveLength(1 + r.taxLineItems.length + r.logisticsLineItems.length);
  });

  it("uses the documented 2026 default rate set", () => {
    expect(DEFAULT_RATES).toEqual({
      importDutyRate: 20,
      vatRate: 15,
      nhilRate: 2.5,
      getfundRate: 2.5,
      ecowasLevyRate: 0.5,
      auLevyRate: 0.2,
      eximLevyRate: 0.75,
      specialImportLevyRate: 2,
      examinationFee: 1,
      networkCharge: 0.4,
    });
  });
});
