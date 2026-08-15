import { SITE } from "@/lib/constants";
/**
 * Ghana Vehicle Import Duty Calculator
 * ------------------------------------
 * A component-by-component model of the duties, levies and fees GRA Customs
 * assesses on a vehicle imported through Tema / Takoradi.
 *
 * PROVENANCE — every rate and every *base* below is either published law or
 * was reverse-engineered from real ICUMS assessments and then checked against
 * an independent worked example to the cedi:
 *
 *   • VAT Act, 2025 (Act 1151), in force 1 Jan 2026, recoupled NHIL and the
 *     GETFund Levy *into* the VAT base instead of stacking VAT on top of them.
 *     NHIL 2.5%, GETFund 2.5% and VAT 15% therefore all sit on the SAME base
 *     — (CIF + Import Duty) — for a combined 20%, down from the old ~21.9%.
 *   • The COVID-19 Health Recovery Levy is gone. It does not appear on any
 *     2026 ICUMS assessment we hold, and it is not modelled here.
 *   • AU 0.2%, ECOWAS 0.5%, EXIM 0.75% and the Special Import Levy 2% are all
 *     charged on CIF alone.
 *   • The Network Charge is 0.4% of *FOB*, not CIF, and it carries its own
 *     NHIL/GETFund/VAT — on the older stacking rule (VAT on charge + levies).
 *     That quirk is empirical: it is what ICUMS actually prints.
 *   • The 1% Examination Fee applies to USED vehicles. It is the single line
 *     most third-party Ghanaian duty calculators omit, and it is exactly why
 *     their totals come in ~1% under a real assessment.
 *
 * VALIDATION — with these rules the model reproduces:
 *   • an independent published worked example (new vehicle, 5% duty,
 *     CIF GH¢300,099.82) to within GH¢1 of GH¢90,065.57; and
 *   • the effective rates we measured across real ICUMS Tax Results —
 *     48.910% of CIF for a used 20%-duty saloon, against 48.88% predicted
 *     plus ~0.03% of flat charges.
 *
 * STILL AN ESTIMATE. The number GRA bills is assessed on the vehicle's Home
 * Delivery Value (HDV), not on what the importer paid. This file gets the
 * *formula* right; `landed-cost.ts` gets the *valuation* right. Every rate is
 * overridable by an admin through the `DutyRate` table.
 */

export type FuelKind = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "PLUGIN_HYBRID" | "LPG";
export type BodyKind =
  | "SEDAN"
  | "SUV"
  | "HATCHBACK"
  | "COUPE"
  | "CONVERTIBLE"
  | "WAGON"
  | "PICKUP"
  | "VAN"
  | "MINIVAN"
  | "TRUCK"
  | "BUS";

/** New vehicles skip the examination fee; used vehicles pay it. */
export type VehicleCondition = "NEW" | "USED";

/**
 * How Customs classes the vehicle. Drives both the duty rate and — because
 * the two schedules differ — the over-age penalty band.
 */
export type DutyClass = "PASSENGER_CAR" | "COMMERCIAL" | "PASSENGER_TRANSPORT" | "EV";

/** What a levy is charged on. Surfaced per line so the maths is auditable. */
export type LevyBase = "CIF" | "CIF_PLUS_DUTY" | "FOB" | "NETWORK_CHARGE" | "FLAT";

export const LEVY_BASE_LABELS: Record<LevyBase, string> = {
  CIF: "CIF",
  CIF_PLUS_DUTY: "CIF + Import Duty",
  FOB: "FOB",
  NETWORK_CHARGE: "Network Charge",
  FLAT: "Fixed charge",
};

export interface DutyRateSet {
  /** % of CIF. */
  importDutyRate: number;
  /** % of (CIF + Import Duty). */
  vatRate: number;
  /** % of (CIF + Import Duty). */
  nhilRate: number;
  /** % of (CIF + Import Duty). */
  getfundRate: number;
  /** % of CIF. */
  ecowasLevyRate: number;
  /** % of CIF. */
  auLevyRate: number;
  /** % of CIF. */
  eximLevyRate: number;
  /** % of CIF. */
  specialImportLevyRate: number;
  /** % of CIF — used vehicles only. */
  examinationFee: number;
  /** % of FOB. */
  networkCharge: number;
}

/** Fixed cedi charges every entry attracts, regardless of value. */
export interface FlatChargeSet {
  /** Ghana Shippers Authority Shippers Network Fee. */
  shippersNetworkFee: number;
  /** Vehicle disinfection / fumigation. */
  disinfectionFee: number;
  /** MoTI electronic Import Declaration Form. */
  idfProcessingFee: number;
}

export interface DutyInput {
  /** Cost, Insurance & Freight value in the entered currency (usually USD). */
  cifValue: number;
  /**
   * Free On Board value, same currency as `cifValue`. Only the Network Charge
   * is assessed on FOB. When omitted it is derived from CIF using
   * `DEFAULT_FREIGHT_INSURANCE_RATE`.
   */
  fobValue?: number;
  /** Currency of the CIF/FOB values. If not GHS, exchangeRate is applied. */
  currency?: "USD" | "GHS" | "EUR" | "GBP";
  /** GHS per 1 unit of `currency`. Ignored when currency is GHS. */
  exchangeRate?: number;
  manufactureYear: number;
  engineSizeCc: number;
  fuelType: FuelKind;
  bodyType: BodyKind;
  /** Defaults to USED — the imports this platform handles are used vehicles. */
  condition?: VehicleCondition;
  /** Freight + insurance as a fraction of FOB, when FOB is not supplied. */
  freightInsuranceRate?: number;
  /** Optional override rate-set (from admin config). */
  rates?: Partial<DutyRateSet>;
  /** Optional override of the fixed cedi charges. */
  flatCharges?: Partial<FlatChargeSet>;
  /** Additional flat charges in GHS. */
  shippingCost?: number;
  portCharges?: number;
  clearingCharges?: number;
  deliveryCost?: number;
  processingFee?: number;
}

export interface DutyLineItem {
  key: string;
  label: string;
  amount: number;
  /** The percentage applied, when the line is rate-based. */
  rate?: number;
  /** What that percentage was applied to. */
  base?: LevyBase;
  /** The cedi value of that base, so a user can re-do the sum by hand. */
  baseAmount?: number;
  note?: string;
}

export interface DutyResult {
  cifGhs: number;
  fobGhs: number;
  currency: string;
  exchangeRate: number;
  vehicleAgeYears: number;
  overAge: boolean;
  condition: VehicleCondition;
  dutyClass: DutyClass;
  lineItems: DutyLineItem[];
  taxLineItems: DutyLineItem[];
  logisticsLineItems: DutyLineItem[];
  taxesSubtotal: number;
  logisticsSubtotal: number;
  totalTaxesAndDuties: number;
  totalLandedCost: number;
  /** Total duties + levies as a percentage of CIF. The number to compare. */
  effectiveTaxRate: number;
  ratesUsed: DutyRateSet;
  flatChargesUsed: FlatChargeSet;
}

/**
 * Default Ghana levy set (percentages), as assessed from 1 January 2026.
 * Admin-overridable through the `DutyRate` table.
 */
export const DEFAULT_RATES: DutyRateSet = {
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
};

/** Fixed cedi charges on a vehicle entry. */
export const DEFAULT_FLAT_CHARGES: FlatChargeSet = {
  shippersNetworkFee: 9,
  disinfectionFee: 379,
  idfProcessingFee: 5,
};

/**
 * Freight + insurance as a fraction of FOB, used to derive FOB when only CIF
 * is known. 12.1% is the ratio implied by the worked examples we validated
 * against; it only affects the Network Charge, which is ~0.43% of the bill.
 */
export const DEFAULT_FREIGHT_INSURANCE_RATE = 0.121;

/**
 * Determine the applicable import-duty rate.
 *
 * Under the ECOWAS Common External Tariff, passenger cars of HS heading 8703
 * sit in the 20% consumer-goods band irrespective of engine size — the three
 * tiers in Ghana's schedule (5/10/20%) separate *categories* of vehicle, not
 * engine capacities. Goods vehicles (8704) take 10%, and vehicles built to
 * carry ten or more persons (8702) take 5%.
 */
export function resolveImportDutyRate(input: {
  bodyType: BodyKind;
  engineSizeCc: number;
  fuelType: FuelKind;
}): { rate: number; category: string; label: string; dutyClass: DutyClass; hsHeading: string } {
  const { bodyType, fuelType } = input;

  // Electric vehicles enjoy a policy concession to promote e-mobility.
  if (fuelType === "ELECTRIC") {
    return {
      rate: 10,
      category: "EV",
      label: "Electric vehicle (concession)",
      dutyClass: "EV",
      hsHeading: "8703.80",
    };
  }

  // Goods vehicles.
  if (bodyType === "PICKUP" || bodyType === "TRUCK" || bodyType === "VAN") {
    return {
      rate: 10,
      category: "COMMERCIAL",
      label: "Goods vehicle",
      dutyClass: "COMMERCIAL",
      hsHeading: "8704",
    };
  }

  // Built to carry ten or more persons.
  if (bodyType === "BUS" || bodyType === "MINIVAN") {
    return {
      rate: 5,
      category: "PASSENGER_TRANSPORT",
      label: "Passenger transport (bus / minibus)",
      dutyClass: "PASSENGER_TRANSPORT",
      hsHeading: "8702",
    };
  }

  return {
    rate: 20,
    category: "PASSENGER_CAR",
    label: "Passenger car / SUV",
    dutyClass: "PASSENGER_CAR",
    hsHeading: "8703",
  };
}

/**
 * Over-age penalty, as a percentage of CIF, per the Customs Act 2015 (Act 891)
 * penalty schedule. Cars and commercial vehicles run on different bands.
 *
 * The age Customs uses is calendar years since the year of manufacture, and
 * the bands are exclusive at the lower bound: a vehicle that is exactly ten
 * years old pays nothing.
 */
export function resolveOverAgePenalty(
  ageYears: number,
  dutyClass: DutyClass = "PASSENGER_CAR",
): number {
  const commercial = dutyClass === "COMMERCIAL" || dutyClass === "PASSENGER_TRANSPORT";

  if (ageYears <= 10) return 0;

  if (commercial) {
    if (ageYears <= 12) return 2.5;
    if (ageYears <= 15) return 10;
    if (ageYears <= 20) return 15;
    return 30;
  }

  if (ageYears <= 12) return 5;
  if (ageYears <= 15) return 20;
  return 50;
}

const pct = (amount: number, rate: number) => (amount * rate) / 100;

export function calculateDuty(input: DutyInput): DutyResult {
  const currency = input.currency ?? "USD";
  const exchangeRate = currency === "GHS" ? 1 : input.exchangeRate ?? 15.5;
  const condition = input.condition ?? "USED";

  const cifGhs = Math.max(0, input.cifValue) * exchangeRate;
  const freightInsuranceRate = input.freightInsuranceRate ?? DEFAULT_FREIGHT_INSURANCE_RATE;
  const fobGhs =
    input.fobValue != null
      ? Math.max(0, input.fobValue) * exchangeRate
      : cifGhs / (1 + freightInsuranceRate);

  const rates: DutyRateSet = { ...DEFAULT_RATES, ...input.rates };
  const flat: FlatChargeSet = { ...DEFAULT_FLAT_CHARGES, ...input.flatCharges };

  // Duty rate depends on the vehicle unless an explicit override was supplied.
  const resolved = resolveImportDutyRate({
    bodyType: input.bodyType,
    engineSizeCc: input.engineSizeCc,
    fuelType: input.fuelType,
  });
  const importDutyRate = input.rates?.importDutyRate ?? resolved.rate;

  const currentYear = new Date().getFullYear();
  const ageYears = Math.max(0, currentYear - input.manufactureYear);
  const overAgePct = resolveOverAgePenalty(ageYears, resolved.dutyClass);

  // ── Duty, then the VAT family on the duty-inclusive value ────
  const importDuty = pct(cifGhs, importDutyRate);
  const vatBase = cifGhs + importDuty;

  const nhil = pct(vatBase, rates.nhilRate);
  const getfund = pct(vatBase, rates.getfundRate);
  const vat = pct(vatBase, rates.vatRate);

  // ── Flat-rate levies, all on CIF alone ───────────────────────
  const auLevy = pct(cifGhs, rates.auLevyRate);
  const ecowasLevy = pct(cifGhs, rates.ecowasLevyRate);
  const eximLevy = pct(cifGhs, rates.eximLevyRate);
  const specialImportLevy = pct(cifGhs, rates.specialImportLevyRate);
  const examinationFee = condition === "USED" ? pct(cifGhs, rates.examinationFee) : 0;
  const overAgePenalty = pct(cifGhs, overAgePct);

  // ── Network charge — on FOB, and carrying its own VAT family ──
  const networkCharge = pct(fobGhs, rates.networkCharge);
  const ncNhil = pct(networkCharge, rates.nhilRate);
  const ncGetfund = pct(networkCharge, rates.getfundRate);
  // ICUMS stacks VAT on top of the charge's own levies here, unlike the goods
  // VAT above. Empirical, and reproduced exactly by real assessments.
  const ncVat = pct(networkCharge + ncNhil + ncGetfund, rates.vatRate);

  const taxLineItems: DutyLineItem[] = [
    {
      key: "importDuty",
      label: `Import Duty (${importDutyRate}%)`,
      amount: importDuty,
      rate: importDutyRate,
      base: "CIF",
      baseAmount: cifGhs,
      note: `${resolved.label} — HS ${resolved.hsHeading}`,
    },
    {
      key: "nhil",
      label: `NHIL (${rates.nhilRate}%)`,
      amount: nhil,
      rate: rates.nhilRate,
      base: "CIF_PLUS_DUTY",
      baseAmount: vatBase,
    },
    {
      key: "getfund",
      label: `GETFund Levy (${rates.getfundRate}%)`,
      amount: getfund,
      rate: rates.getfundRate,
      base: "CIF_PLUS_DUTY",
      baseAmount: vatBase,
    },
    {
      key: "vat",
      label: `VAT (${rates.vatRate}%)`,
      amount: vat,
      rate: rates.vatRate,
      base: "CIF_PLUS_DUTY",
      baseAmount: vatBase,
      note: "NHIL and GETFund sit alongside VAT, not inside its base (Act 1151)",
    },
    {
      key: "au",
      label: `African Union Levy (${rates.auLevyRate}%)`,
      amount: auLevy,
      rate: rates.auLevyRate,
      base: "CIF",
      baseAmount: cifGhs,
    },
    {
      key: "ecowas",
      label: `ECOWAS Levy (${rates.ecowasLevyRate}%)`,
      amount: ecowasLevy,
      rate: rates.ecowasLevyRate,
      base: "CIF",
      baseAmount: cifGhs,
    },
    {
      key: "exim",
      label: `EXIM Levy (${rates.eximLevyRate}%)`,
      amount: eximLevy,
      rate: rates.eximLevyRate,
      base: "CIF",
      baseAmount: cifGhs,
    },
    {
      key: "specialImport",
      label: `Special Import Levy (${rates.specialImportLevyRate}%)`,
      amount: specialImportLevy,
      rate: rates.specialImportLevyRate,
      base: "CIF",
      baseAmount: cifGhs,
    },
  ];

  if (examinationFee > 0) {
    taxLineItems.push({
      key: "examination",
      label: `Examination Fee (${rates.examinationFee}%)`,
      amount: examinationFee,
      rate: rates.examinationFee,
      base: "CIF",
      baseAmount: cifGhs,
      note: "Charged on used vehicles",
    });
  }

  taxLineItems.push(
    {
      key: "network",
      label: `Network Charge (${rates.networkCharge}%)`,
      amount: networkCharge,
      rate: rates.networkCharge,
      base: "FOB",
      baseAmount: fobGhs,
      note: "Assessed on FOB, not CIF",
    },
    {
      key: "networkNhil",
      label: `NHIL on Network Charge (${rates.nhilRate}%)`,
      amount: ncNhil,
      rate: rates.nhilRate,
      base: "NETWORK_CHARGE",
      baseAmount: networkCharge,
    },
    {
      key: "networkGetfund",
      label: `GETFund on Network Charge (${rates.getfundRate}%)`,
      amount: ncGetfund,
      rate: rates.getfundRate,
      base: "NETWORK_CHARGE",
      baseAmount: networkCharge,
    },
    {
      key: "networkVat",
      label: `VAT on Network Charge (${rates.vatRate}%)`,
      amount: ncVat,
      rate: rates.vatRate,
      base: "NETWORK_CHARGE",
      baseAmount: networkCharge + ncNhil + ncGetfund,
    },
    {
      key: "shippersNetworkFee",
      label: "Shippers Network Fee",
      amount: flat.shippersNetworkFee,
      base: "FLAT",
    },
    {
      key: "disinfection",
      label: "Disinfection Fee",
      amount: flat.disinfectionFee,
      base: "FLAT",
    },
    {
      key: "idf",
      label: "MoTI e-IDF Processing",
      amount: flat.idfProcessingFee,
      base: "FLAT",
    },
  );

  if (overAgePenalty > 0) {
    taxLineItems.push({
      key: "overage",
      label: `Over-age Penalty (${overAgePct}%)`,
      amount: overAgePenalty,
      rate: overAgePct,
      base: "CIF",
      baseAmount: cifGhs,
      note: `Vehicle is ${ageYears} years old`,
    });
  }

  const taxesSubtotal = taxLineItems.reduce((sum, li) => sum + li.amount, 0);

  // ── Logistics & handling (flat GHS charges) ──────────────────
  const shippingCost = input.shippingCost ?? 0;
  const portCharges = input.portCharges ?? 3500;
  const clearingCharges = input.clearingCharges ?? 2500;
  const deliveryCost = input.deliveryCost ?? 800;
  const processingFee = input.processingFee ?? 500;

  const logisticsLineItems: DutyLineItem[] = [
    { key: "shipping", label: "Shipping Cost", amount: shippingCost },
    { key: "port", label: "Port Charges (GPHA/Terminal)", amount: portCharges },
    { key: "clearing", label: "Clearing / Agent Charges", amount: clearingCharges },
    { key: "delivery", label: "Delivery to Your Location", amount: deliveryCost },
    { key: "processing", label: `${SITE.name} Processing Fee`, amount: processingFee },
  ];
  const logisticsSubtotal = logisticsLineItems.reduce((sum, li) => sum + li.amount, 0);

  const totalLandedCost = cifGhs + taxesSubtotal + logisticsSubtotal;

  return {
    cifGhs,
    fobGhs,
    currency,
    exchangeRate,
    vehicleAgeYears: ageYears,
    overAge: overAgePct > 0,
    condition,
    dutyClass: resolved.dutyClass,
    lineItems: [
      { key: "cif", label: "CIF Value (in GHS)", amount: cifGhs },
      ...taxLineItems,
      ...logisticsLineItems,
    ],
    taxLineItems,
    logisticsLineItems,
    taxesSubtotal,
    logisticsSubtotal,
    totalTaxesAndDuties: taxesSubtotal,
    totalLandedCost,
    effectiveTaxRate: cifGhs > 0 ? (taxesSubtotal / cifGhs) * 100 : 0,
    ratesUsed: { ...rates, importDutyRate },
    flatChargesUsed: flat,
  };
}
