/**
 * Site-wide "master" search.
 *
 * Ranks a query across every public content type — cars, parts, services,
 * dealers and articles — into a single unified result list, each entry pointing
 * at its own detail page. The `/search` results page (SERP) consumes this; the
 * nav-bar search box hands the query off to that page.
 *
 * The matcher is a pure, in-memory function over already-loaded records (the
 * `getX()` queries already back onto the DB with a sample-data fallback), which
 * keeps it trivially unit-testable and avoids a bespoke cross-model DB query for
 * a catalogue of this size.
 */
import type {
  SampleBlogPost,
  SampleDealer,
  SamplePart,
  SampleService,
  SampleVehicle,
} from "@/lib/sample-data";
import { formatCurrency } from "@/lib/utils";

export type SearchResultType = "vehicle" | "part" | "service" | "dealer" | "blog";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image?: string;
}

export interface SiteSearchData {
  vehicles: SampleVehicle[];
  parts: SamplePart[];
  services: SampleService[];
  dealers: SampleDealer[];
  blog: SampleBlogPost[];
}

/** Fixed order so result groups and score tie-breaks are deterministic. */
export const RESULT_TYPE_ORDER: SearchResultType[] = [
  "vehicle",
  "part",
  "service",
  "dealer",
  "blog",
];

/** Singular badge label per result type. */
export const RESULT_TYPE_LABELS: Record<SearchResultType, string> = {
  vehicle: "Car",
  part: "Part",
  service: "Service",
  dealer: "Dealer",
  blog: "Article",
};

/** Plural section/heading label per result type. */
export const RESULT_TYPE_LABELS_PLURAL: Record<SearchResultType, string> = {
  vehicle: "Cars",
  part: "Parts",
  service: "Services",
  dealer: "Dealers",
  blog: "Articles",
};

interface Candidate {
  result: SearchResult;
  haystack: string;
}

const stripTags = (s: string) => s.replace(/<[^>]*>/g, " ");

/** Build a searchable haystack from mixed fields (arrays/numbers flattened, blanks dropped). */
function haystackOf(...parts: (string | number | string[] | undefined | null)[]): string {
  return parts
    .flat()
    .filter((p): p is string | number => p !== undefined && p !== null && p !== "")
    .join(" ");
}

/** Join subtitle segments with " · ", dropping blanks. */
function dot(...parts: (string | undefined | null)[]): string {
  return parts.filter((p): p is string => !!p && p.trim() !== "").join(" · ");
}

/** Split a query into lowercase alphanumeric terms (capped to keep matching bounded). */
export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

/** Score one record: every term must appear (AND); title matches weigh more. 0 = no match. */
function scoreOf(terms: string[], haystack: string, title: string): number {
  const h = haystack.toLowerCase();
  const t = title.toLowerCase();
  let total = 0;
  for (const term of terms) {
    if (!h.includes(term)) return 0;
    total += t.includes(term) ? 3 : 1;
  }
  return total;
}

function vehicleCandidate(v: SampleVehicle): Candidate {
  return {
    result: {
      type: "vehicle",
      id: v.id,
      title: v.title,
      subtitle: dot(formatCurrency(v.price), v.location),
      href: `/vehicles/${v.slug}`,
      image: v.images[0],
    },
    haystack: haystackOf(
      v.title,
      v.brand,
      v.model,
      v.year,
      v.bodyType,
      v.fuelType,
      v.transmission,
      v.condition,
      v.color,
      v.city,
      v.region,
      v.countryOfOrigin,
      v.vin,
      v.dealer.name,
      v.features,
      stripTags(v.description),
    ),
  };
}

function partCandidate(p: SamplePart): Candidate {
  return {
    result: {
      type: "part",
      id: p.id,
      title: p.name,
      subtitle: dot(formatCurrency(p.discountPrice ?? p.price), p.category),
      href: `/parts/${p.slug}`,
      image: p.image,
    },
    haystack: haystackOf(
      p.name,
      p.category,
      p.brand,
      p.oemNumber,
      p.compatibleMakes,
      p.condition,
      p.store.name,
      stripTags(p.description ?? ""),
    ),
  };
}

function serviceCandidate(s: SampleService): Candidate {
  return {
    result: {
      type: "service",
      id: s.id,
      title: s.name,
      subtitle: dot(s.typeLabel, [s.city, s.region].filter(Boolean).join(", ")),
      href: `/services/${s.slug}`,
      image: s.image,
    },
    haystack: haystackOf(s.name, s.type, s.typeLabel, s.city, s.region, s.services),
  };
}

function dealerCandidate(d: SampleDealer): Candidate {
  return {
    result: {
      type: "dealer",
      id: d.id,
      title: d.name,
      subtitle: dot(
        [d.city, d.region].filter(Boolean).join(", "),
        d.vehicleCount ? `${d.vehicleCount} cars` : undefined,
      ),
      href: `/dealers/${d.slug}`,
      image: d.logo,
    },
    haystack: haystackOf(d.name, d.city, d.region, stripTags(d.description)),
  };
}

function blogCandidate(b: SampleBlogPost): Candidate {
  return {
    result: {
      type: "blog",
      id: b.id,
      title: b.title,
      subtitle: dot(b.category, b.readTime ? `${b.readTime} min read` : undefined),
      href: `/blog/${b.slug}`,
      image: b.cover,
    },
    haystack: haystackOf(b.title, b.excerpt, b.category, b.author, stripTags(b.content ?? "")),
  };
}

/** Rank a query across all content types into one relevance-sorted result list. */
export function searchSite(query: string, data: SiteSearchData): SearchResult[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const candidates: Candidate[] = [
    ...data.vehicles.map(vehicleCandidate),
    ...data.parts.map(partCandidate),
    ...data.services.map(serviceCandidate),
    ...data.dealers.map(dealerCandidate),
    ...data.blog.map(blogCandidate),
  ];

  return candidates
    .map((c) => ({ c, s: scoreOf(terms, c.haystack, c.result.title) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      const byType =
        RESULT_TYPE_ORDER.indexOf(a.c.result.type) - RESULT_TYPE_ORDER.indexOf(b.c.result.type);
      if (byType !== 0) return byType;
      return a.c.result.title.localeCompare(b.c.result.title);
    })
    .map((x) => x.c.result);
}

/** Bucket a flat result list by type (order preserved within each bucket). */
export function groupResults(results: SearchResult[]): Record<SearchResultType, SearchResult[]> {
  const groups: Record<SearchResultType, SearchResult[]> = {
    vehicle: [],
    part: [],
    service: [],
    dealer: [],
    blog: [],
  };
  for (const r of results) groups[r.type].push(r);
  return groups;
}
