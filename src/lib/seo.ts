import { SITE } from "@/lib/constants";

/**
 * SEO helpers — structured data and crawl-directive utilities shared across
 * pages so behaviour stays consistent (and testable).
 */

export interface Crumb {
  name: string;
  /** Absolute-from-root path, e.g. "/vehicles". Omit for the current page. */
  path?: string;
}

/**
 * Build a schema.org BreadcrumbList for a page's trail. The last crumb is
 * normally the current page and may omit `path`. URLs are absolute — Google
 * requires fully-qualified `item` URLs for rich breadcrumb results.
 */
export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE.url}${item.path}` } : {}),
    })),
  };
}

/**
 * True when a listing page has any query params that produce a filtered,
 * sorted or paginated view. Such URLs are near-duplicates of the clean listing
 * page, so we mark them `noindex` (while still canonicalising to the base URL)
 * to keep crawl budget on the pages that matter and avoid index bloat.
 */
export function hasActiveFilters(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): boolean {
  if (!searchParams) return false;
  return Object.values(searchParams).some((v) =>
    Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim() !== "",
  );
}
