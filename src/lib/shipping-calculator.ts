/**
 * Shipping Cost Estimator
 * -----------------------
 * Estimates the cost & transit time of shipping a vehicle to a Ghanaian port
 * (Tema / Takoradi). Base rates below are indicative USD figures and are
 * overridable by admin-configured `ShippingRate` records.
 */

export type ShippingMethod = "RORO" | "CONTAINER_20" | "CONTAINER_40";
export type VehicleClass = "SEDAN" | "SUV" | "PICKUP" | "BUS";

export interface ShippingLane {
  originCountry: string;
  originPort: string;
  destinationPort: string;
  /** base cost by method for a standard SEDAN, in USD */
  base: Record<ShippingMethod, number>;
  transitDaysMin: number;
  transitDaysMax: number;
}

/** Class multipliers relative to a standard sedan. */
const CLASS_MULTIPLIER: Record<VehicleClass, number> = {
  SEDAN: 1,
  SUV: 1.25,
  PICKUP: 1.4,
  BUS: 1.8,
};

/** Indicative default lanes into Ghana. Admin can override via DB. */
export const SHIPPING_LANES: ShippingLane[] = [
  {
    originCountry: "United States",
    originPort: "New York / New Jersey",
    destinationPort: "Tema",
    base: { RORO: 1150, CONTAINER_20: 2400, CONTAINER_40: 3100 },
    transitDaysMin: 28,
    transitDaysMax: 45,
  },
  {
    originCountry: "United States",
    originPort: "Baltimore",
    destinationPort: "Tema",
    base: { RORO: 1050, CONTAINER_20: 2300, CONTAINER_40: 3000 },
    transitDaysMin: 26,
    transitDaysMax: 42,
  },
  {
    originCountry: "Germany",
    originPort: "Bremerhaven",
    destinationPort: "Tema",
    base: { RORO: 950, CONTAINER_20: 2100, CONTAINER_40: 2800 },
    transitDaysMin: 18,
    transitDaysMax: 30,
  },
  {
    originCountry: "United Kingdom",
    originPort: "Southampton",
    destinationPort: "Tema",
    base: { RORO: 900, CONTAINER_20: 2000, CONTAINER_40: 2650 },
    transitDaysMin: 16,
    transitDaysMax: 28,
  },
  {
    originCountry: "Japan",
    originPort: "Yokohama",
    destinationPort: "Tema",
    base: { RORO: 1300, CONTAINER_20: 2600, CONTAINER_40: 3400 },
    transitDaysMin: 35,
    transitDaysMax: 55,
  },
  {
    originCountry: "United Arab Emirates",
    originPort: "Dubai / Jebel Ali",
    destinationPort: "Tema",
    base: { RORO: 1250, CONTAINER_20: 2500, CONTAINER_40: 3300 },
    transitDaysMin: 30,
    transitDaysMax: 45,
  },
  {
    originCountry: "Canada",
    originPort: "Halifax",
    destinationPort: "Tema",
    base: { RORO: 1200, CONTAINER_20: 2450, CONTAINER_40: 3150 },
    transitDaysMin: 28,
    transitDaysMax: 44,
  },
  {
    originCountry: "South Korea",
    originPort: "Busan",
    destinationPort: "Tema",
    base: { RORO: 1280, CONTAINER_20: 2550, CONTAINER_40: 3350 },
    transitDaysMin: 34,
    transitDaysMax: 52,
  },
];

export interface ShippingInput {
  originCountry: string;
  method: ShippingMethod;
  vehicleClass: VehicleClass;
  exchangeRate?: number; // GHS per USD, for the GHS estimate
}

export interface ShippingResult {
  lane: ShippingLane | null;
  method: ShippingMethod;
  vehicleClass: VehicleClass;
  costUsd: number;
  costGhs: number;
  transitDaysMin: number;
  transitDaysMax: number;
}

export function estimateShipping(input: ShippingInput): ShippingResult {
  const lane =
    SHIPPING_LANES.find((l) => l.originCountry === input.originCountry) ?? SHIPPING_LANES[0];
  const multiplier = CLASS_MULTIPLIER[input.vehicleClass];
  const base = lane.base[input.method];
  const costUsd = Math.round(base * multiplier);
  const exchangeRate = input.exchangeRate ?? 15.5;

  return {
    lane,
    method: input.method,
    vehicleClass: input.vehicleClass,
    costUsd,
    costGhs: Math.round(costUsd * exchangeRate),
    transitDaysMin: lane.transitDaysMin,
    transitDaysMax: lane.transitDaysMax,
  };
}

export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  RORO: "RoRo (Roll-on / Roll-off)",
  CONTAINER_20: "20ft Container (Shared)",
  CONTAINER_40: "40ft Container (Exclusive)",
};
