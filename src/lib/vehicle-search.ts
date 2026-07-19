/**
 * Shared vehicle-search filter model + serialization.
 *
 * Filters are serialized to the `/vehicles` query string so a search is
 * shareable by link and can be persisted as a Saved Search. Both the client
 * browser and the server page use these helpers, so the URL is the single
 * source of truth for a search.
 */

export interface VehicleFilters {
  q: string;
  brand: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  condition: string;
  region: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
}

export const EMPTY_FILTERS: VehicleFilters = {
  q: "",
  brand: "",
  bodyType: "",
  fuelType: "",
  transmission: "",
  condition: "",
  region: "",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
};

export const VEHICLE_SORTS = [
  "relevance",
  "price-asc",
  "price-desc",
  "year-desc",
  "mileage-asc",
] as const;
export type VehicleSort = (typeof VEHICLE_SORTS)[number];

const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as (keyof VehicleFilters)[];

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function read(source: ParamSource, key: string): string {
  if (source instanceof URLSearchParams) return source.get(key) ?? "";
  const v = source[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Serialize filters + sort to a query string (empty values omitted). */
export function filtersToQuery(filters: VehicleFilters, sort: VehicleSort = "relevance"): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key].trim();
    if (value) params.set(key, value);
  }
  if (sort && sort !== "relevance") params.set("sort", sort);
  return params.toString();
}

/** Parse a query source (URLSearchParams or Next.js searchParams) into filters + sort. */
export function queryToFilters(source: ParamSource): { filters: VehicleFilters; sort: VehicleSort } {
  const filters = { ...EMPTY_FILTERS };
  for (const key of FILTER_KEYS) filters[key] = read(source, key);
  const rawSort = read(source, "sort") as VehicleSort;
  const sort = VEHICLE_SORTS.includes(rawSort) ? rawSort : "relevance";
  return { filters, sort };
}

/** How many filters are set — for the "active filters" badge. */
export function activeFilterCount(filters: VehicleFilters): number {
  return FILTER_KEYS.reduce((n, key) => (filters[key].trim() ? n + 1 : n), 0);
}

/** A short human summary of a saved search, e.g. "Toyota · SUV · ≤ GHS 200,000". */
export function describeQuery(query: string): string {
  const p = new URLSearchParams(query);
  const parts: string[] = [];
  if (p.get("q")) parts.push(`"${p.get("q")}"`);
  if (p.get("brand")) parts.push(p.get("brand")!);
  if (p.get("bodyType")) parts.push(p.get("bodyType")!);
  if (p.get("condition")) parts.push(p.get("condition")!.replace(/_/g, " ").toLowerCase());
  if (p.get("region")) parts.push(p.get("region")!);
  if (p.get("minPrice") || p.get("maxPrice")) {
    const min = p.get("minPrice");
    const max = p.get("maxPrice");
    if (min && max) parts.push(`GHS ${min}–${max}`);
    else if (max) parts.push(`≤ GHS ${max}`);
    else if (min) parts.push(`≥ GHS ${min}`);
  }
  if (p.get("minYear") || p.get("maxYear")) {
    parts.push(`${p.get("minYear") ?? ""}–${p.get("maxYear") ?? ""}`);
  }
  return parts.length ? parts.join(" · ") : "All vehicles";
}
