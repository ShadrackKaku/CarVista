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

/**
 * Facets where more than one value may be chosen at once.
 *
 * These are the questions with an honest "or" in them — somebody shopping for
 * a family car will take a RAV4 or a CR-V, and forcing them to run the search
 * twice is the interface being difficult about it. Price and year are
 * deliberately absent: they are ranges, and two disjoint bands ("under
 * GH₵100,000 or over GH₵800,000") is not a search anybody means to run.
 *
 * Values are stored comma-joined in the same single string the fields always
 * used, so `brand=Toyota` from a saved search made before this existed still
 * parses and still matches.
 */
export const MULTI_FACETS = [
  "brand",
  "bodyType",
  "fuelType",
  "transmission",
  "condition",
  "region",
] as const satisfies readonly (keyof VehicleFilters)[];

export type MultiFacet = (typeof MULTI_FACETS)[number];

/** The values chosen in a multi-select facet. */
export function selectedValues(value: string): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function isSelected(current: string, value: string): boolean {
  return selectedValues(current).includes(value);
}

/** Add the value if absent, remove it if present. */
export function toggleValue(current: string, value: string): string {
  const values = selectedValues(current);
  const next = values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
  return next.join(",");
}

/**
 * How many filters are set — for the "active filters" badge.
 *
 * Counted as a person would: each chosen value in a multi-select facet is one
 * filter, and a price or year band is one filter rather than the two fields it
 * happens to write. The old count said "2 filters" for a single price band,
 * which made the badge quietly untrustworthy.
 */
export function activeFilterCount(filters: VehicleFilters): number {
  let n = 0;
  for (const key of FILTER_KEYS) {
    const value = filters[key].trim();
    if (!value) continue;
    if (key === "maxPrice" || key === "maxYear") continue; // counted with their floor
    if ((MULTI_FACETS as readonly string[]).includes(key)) n += selectedValues(value).length;
    else n += 1;
  }
  // A band with only a ceiling ("Under GH₵100,000") sets no floor, so it would
  // otherwise slip through the skip above.
  if (!filters.minPrice.trim() && filters.maxPrice.trim()) n += 1;
  if (!filters.minYear.trim() && filters.maxYear.trim()) n += 1;
  return n;
}

/** A short human summary of a saved search, e.g. "Toyota · SUV · ≤ GHS 200,000". */
export function describeQuery(query: string): string {
  const p = new URLSearchParams(query);
  const parts: string[] = [];
  // Multi-select facets read back as "Toyota or Honda" rather than the raw
  // comma-joined value, so a saved search describes itself the way it was made.
  const list = (key: string, tidy: (s: string) => string = (s) => s) => {
    const values = selectedValues(p.get(key) ?? "").map(tidy);
    if (!values.length) return null;
    if (values.length === 1) return values[0];
    return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
  };

  if (p.get("q")) parts.push(`"${p.get("q")}"`);
  const brand = list("brand");
  if (brand) parts.push(brand);
  const bodyType = list("bodyType");
  if (bodyType) parts.push(bodyType);
  const condition = list("condition", (s) => s.replace(/_/g, " ").toLowerCase());
  if (condition) parts.push(condition);
  const region = list("region");
  if (region) parts.push(region);
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

/** The shape `matchesFilters` needs. Keeps this file free of the card type. */
export interface FilterableVehicle {
  title: string;
  brand: string;
  model: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  condition: string;
  /** Optional on the card type: a listing may not say where it is. Such a
   *  vehicle correctly fails a region filter rather than matching every one. */
  region?: string;
  price: number;
  year: number;
}

/**
 * Whether a vehicle survives the active filters.
 *
 * `ignore` drops one or more facets from the test, which is what makes
 * per-option counts honest: the number beside "Ghana Used" has to mean "how
 * many results if I pick this", so it must respect every *other* filter while
 * ignoring the condition already chosen. Counting against the unfiltered list
 * instead would promise 22 cars and deliver 3.
 *
 * It takes a list as well as a single key because price and year are one choice
 * spread over two fields — counting a price band while still applying the
 * band's own floor and ceiling would report only the cars already showing.
 */
export function matchesFilters(
  v: FilterableVehicle,
  filters: VehicleFilters,
  ignore?: keyof VehicleFilters | readonly (keyof VehicleFilters)[],
): boolean {
  const ignored = ignore == null ? [] : Array.isArray(ignore) ? ignore : [ignore];
  const on = <K extends keyof VehicleFilters>(key: K) =>
    (ignored as readonly string[]).includes(key) ? "" : filters[key];

  // Within a facet the chosen values are an OR; across facets they are an AND.
  // "Toyota or Honda, and an SUV" is what a person means by ticking three
  // boxes, and it is the only reading that can ever return anything.
  const anyOf = (facet: MultiFacet, actual: string | undefined) => {
    const values = selectedValues(on(facet));
    return values.length === 0 || (actual != null && values.includes(actual));
  };

  const q = on("q");
  if (q && !`${v.title} ${v.brand} ${v.model}`.toLowerCase().includes(q.toLowerCase())) return false;
  if (!anyOf("brand", v.brand)) return false;
  if (!anyOf("bodyType", v.bodyType)) return false;
  if (!anyOf("fuelType", v.fuelType)) return false;
  if (!anyOf("transmission", v.transmission)) return false;
  if (!anyOf("condition", v.condition)) return false;
  if (!anyOf("region", v.region)) return false;
  if (on("minPrice") && v.price < Number(filters.minPrice)) return false;
  if (on("maxPrice") && v.price > Number(filters.maxPrice)) return false;
  if (on("minYear") && v.year < Number(filters.minYear)) return false;
  if (on("maxYear") && v.year > Number(filters.maxYear)) return false;
  return true;
}

/**
 * Price and year as a short list of bands rather than two empty number boxes.
 *
 * A pair of Min/Max fields asks the buyer to know the market before they can
 * use it — someone shopping for their first car has no idea whether to type
 * 80,000 or 300,000, so the commonest outcome is that they type nothing and the
 * filter does no work. A band is a decision they can actually make, and it puts
 * price on the same left-aligned rhythm as every other facet instead of being
 * the one row with boxes in it.
 *
 * Bands set the same `minPrice`/`maxPrice` the fields did, so the query string,
 * saved searches and the matcher are all untouched.
 */
export interface RangeBand {
  id: string;
  label: string;
  /** Inclusive floor. Absent means "no lower bound". */
  min?: number;
  /** Inclusive ceiling. Absent means "no upper bound". */
  max?: number;
}

/** Pitched at the Ghanaian market: a tidy Corolla up to an imported Land Cruiser. */
export const PRICE_BANDS: readonly RangeBand[] = [
  { id: "u100", label: "Under GH₵100,000", max: 99_999 },
  { id: "100-200", label: "GH₵100,000 – 200,000", min: 100_000, max: 200_000 },
  { id: "200-300", label: "GH₵200,000 – 300,000", min: 200_001, max: 300_000 },
  { id: "300-500", label: "GH₵300,000 – 500,000", min: 300_001, max: 500_000 },
  { id: "500-800", label: "GH₵500,000 – 800,000", min: 500_001, max: 800_000 },
  { id: "o800", label: "Over GH₵800,000", min: 800_001 },
];

/**
 * Year bands, newest first.
 *
 * Deliberately open-ended at the top — "2023 and newer" keeps working next
 * year, where a hardcoded "2023–2026" quietly starts hiding cars.
 */
export const YEAR_BANDS: readonly RangeBand[] = [
  { id: "y2023", label: "2023 and newer", min: 2023 },
  { id: "y2020", label: "2020 – 2022", min: 2020, max: 2022 },
  { id: "y2017", label: "2017 – 2019", min: 2017, max: 2019 },
  { id: "y2014", label: "2014 – 2016", min: 2014, max: 2016 },
  { id: "y0", label: "Older than 2014", max: 2013 },
];

/** The band currently selected, or null when the range is unset or hand-edited. */
export function activeBand(
  bands: readonly RangeBand[],
  min: string,
  max: string,
): RangeBand | null {
  if (!min && !max) return null;
  return (
    bands.find((b) => String(b.min ?? "") === min && String(b.max ?? "") === max) ?? null
  );
}

/** The two filter values a band sets. */
export function bandToRange(band: RangeBand | null): { min: string; max: string } {
  if (!band) return { min: "", max: "" };
  return { min: band.min == null ? "" : String(band.min), max: band.max == null ? "" : String(band.max) };
}
