/**
 * Ghana Vehicle Import Duty Calculator
 * ------------------------------------
 * Implements a transparent, component-by-component estimate of the total
 * landed cost of importing a vehicle into Ghana through Tema / Takoradi ports.
 *
 * NOTE: These are ESTIMATES for planning purposes. Actual assessment is done
 * by the Ghana Revenue Authority (GRA) Customs Division using the ICUMS
 * platform and the vehicle's Home Delivery Value (HDV). Rates below reflect
 * commonly-applied 2024/2025 levies and are fully overridable by an admin
 * through the `DutyRate` / `ShippingRate` tables.
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

export interface DutyRateSet {
  importDutyRate: number; // %
  vatRate: number; // %
  nhilRate: number; // %
  getfundRate: number; // %
  covidLevyRate: number; // %
  ecowasLevyRate: number; // %
  examinationFee: number; // %
  networkCharge: number; // %
}

export interface DutyInput {
  /** Cost, Insurance & Freight value in the entered currency (usually USD). */
  cifValue: number;
  /** Currency of the CIF value. If not GHS, exchangeRate is applied. */
  currency?: "USD" | "GHS" | "EUR" | "GBP";
  /** GHS per 1 unit of `currency`. Ignored when currency is GHS. */
  exchangeRate?: number;
  manufactureYear: number;
  engineSizeCc: number;
  fuelType: FuelKind;
  bodyType: BodyKind;
  /** Optional override rate-set (from admin config). */
  rates?: Partial<DutyRateSet>;
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
  note?: string;
}

export interface DutyResult {
  cifGhs: number;
  currency: string;
  exchangeRate: number;
  vehicleAgeYears: number;
  overAge: boolean;
  lineItems: DutyLineItem[];
  taxesSubtotal: number;
  logisticsSubtotal: number;
  totalTaxesAndDuties: number;
  totalLandedCost: number;
  ratesUsed: DutyRateSet;
}

/** Default Ghana levy set (percentages). Admin-overridable. */
export const DEFAULT_RATES: DutyRateSet = {
  importDutyRate: 20,
  vatRate: 15,
  nhilRate: 2.5,
  getfundRate: 2.5,
  covidLevyRate: 1,
  ecowasLevyRate: 0.5,
  examinationFee: 1,
  networkCharge: 0.4,
};

/**
 * Determine the applicable import-duty rate based on vehicle characteristics.
 * Ghana applies concessionary rates to some categories (e.g. commercial,
 * electric) and a standard 20% to most saloon cars & SUVs.
 */
export function resolveImportDutyRate(input: {
  bodyType: BodyKind;
  engineSizeCc: number;
  fuelType: FuelKind;
}): { rate: number; category: string; label: string } {
  const { bodyType, engineSizeCc, fuelType } = input;

  // Electric vehicles enjoy a concession to promote e-mobility.
  if (fuelType === "ELECTRIC") {
    return { rate: 10, category: "EV", label: "Electric Vehicle (concession)" };
  }

  // Commercial / goods vehicles.
  if (bodyType === "PICKUP" || bodyType === "TRUCK" || bodyType === "VAN") {
    return { rate: 10, category: "COMMERCIAL", label: "Commercial / Goods vehicle" };
  }
  if (bodyType === "BUS" || bodyType === "MINIVAN") {
    return { rate: 5, category: "PASSENGER_TRANSPORT", label: "Passenger transport (bus/minivan)" };
  }

  // Standard passenger vehicles.
  if (engineSizeCc <= 1900) {
    return { rate: 20, category: "SALOON_SMALL", label: "Saloon / SUV up to 1900cc" };
  }
  if (engineSizeCc <= 3000) {
    return { rate: 20, category: "SALOON_MID", label: "Saloon / SUV 1901–3000cc" };
  }
  return { rate: 20, category: "SALOON_LARGE", label: "Saloon / SUV above 3000cc" };
}

/**
 * Over-age penalty. Vehicles older than 10 years attract higher penalties
 * (levied on the depreciated value). Modelled here as a % uplift on CIF.
 */
export function resolveOverAgePenalty(ageYears: number): number {
  if (ageYears <= 10) return 0;
  if (ageYears <= 12) return 5;
  if (ageYears <= 15) return 20;
  return 50; // vehicles older than 15 years attract the steepest penalty
}

export function calculateDuty(input: DutyInput): DutyResult {
  const currency = input.currency ?? "USD";
  const exchangeRate = currency === "GHS" ? 1 : input.exchangeRate ?? 15.5;
  const cifGhs = Math.max(0, input.cifValue) * exchangeRate;

  const rates: DutyRateSet = { ...DEFAULT_RATES, ...input.rates };

  // Duty rate depends on the vehicle unless an explicit override was supplied.
  const resolved = resolveImportDutyRate({
    bodyType: input.bodyType,
    engineSizeCc: input.engineSizeCc,
    fuelType: input.fuelType,
  });
  const importDutyRate = input.rates?.importDutyRate ?? resolved.rate;

  const currentYear = new Date().getFullYear();
  const ageYears = Math.max(0, currentYear - input.manufactureYear);
  const overAgePct = resolveOverAgePenalty(ageYears);

  // ── Duties & levies ──────────────────────────────────────────
  const importDuty = (cifGhs * importDutyRate) / 100;
  const nhil = (cifGhs * rates.nhilRate) / 100;
  const getfund = (cifGhs * rates.getfundRate) / 100;
  const covidLevy = (cifGhs * rates.covidLevyRate) / 100;
  const ecowasLevy = (cifGhs * rates.ecowasLevyRate) / 100;
  const examinationFee = (cifGhs * rates.examinationFee) / 100;
  const networkCharge = (cifGhs * rates.networkCharge) / 100;

  // VAT base = CIF + Import Duty + NHIL + GETFund + COVID levy
  const vatBase = cifGhs + importDuty + nhil + getfund + covidLevy;
  const vat = (vatBase * rates.vatRate) / 100;

  const overAgePenalty = (cifGhs * overAgePct) / 100;

  const taxLineItems: DutyLineItem[] = [
    {
      key: "importDuty",
      label: `Import Duty (${importDutyRate}%)`,
      amount: importDuty,
      note: resolved.label,
    },
    { key: "vat", label: `VAT (${rates.vatRate}%)`, amount: vat },
    { key: "nhil", label: `NHIL (${rates.nhilRate}%)`, amount: nhil },
    { key: "getfund", label: `GETFund Levy (${rates.getfundRate}%)`, amount: getfund },
    { key: "covid", label: `COVID-19 Health Levy (${rates.covidLevyRate}%)`, amount: covidLevy },
    { key: "ecowas", label: `ECOWAS Levy (${rates.ecowasLevyRate}%)`, amount: ecowasLevy },
    {
      key: "examination",
      label: `Examination Fee (${rates.examinationFee}%)`,
      amount: examinationFee,
    },
    { key: "network", label: `Network / Processing (${rates.networkCharge}%)`, amount: networkCharge },
  ];

  if (overAgePenalty > 0) {
    taxLineItems.push({
      key: "overage",
      label: `Over-age Penalty (${overAgePct}%)`,
      amount: overAgePenalty,
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
    { key: "processing", label: "CarVista Processing Fee", amount: processingFee },
  ];
  const logisticsSubtotal = logisticsLineItems.reduce((sum, li) => sum + li.amount, 0);

  const totalTaxesAndDuties = taxesSubtotal;
  const totalLandedCost = cifGhs + taxesSubtotal + logisticsSubtotal;

  return {
    cifGhs,
    currency,
    exchangeRate,
    vehicleAgeYears: ageYears,
    overAge: overAgePct > 0,
    lineItems: [
      { key: "cif", label: "CIF Value (in GHS)", amount: cifGhs },
      ...taxLineItems,
      ...logisticsLineItems,
    ],
    taxesSubtotal,
    logisticsSubtotal,
    totalTaxesAndDuties,
    totalLandedCost,
    ratesUsed: { ...rates, importDutyRate },
  };
}
