import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getBlogPosts, getDealers, getParts, getServices, getVehicles } from "@/lib/queries";
import {
  groupResults,
  RESULT_TYPE_LABELS_PLURAL,
  RESULT_TYPE_ORDER,
  searchSite,
  type SearchResult,
  type SearchResultType,
} from "@/lib/site-search";
import { SearchResultCard } from "@/components/search/search-result-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Metadata {
  const q = (searchParams.q ?? "").trim();
  return {
    // Search pages are per-query and near-infinite, so keep them out of the index.
    title: q ? `Search results for “${q}”` : "Search",
    description: `Search cars, parts, services and dealers across ${SITE.name}.`,
    robots: { index: false, follow: true },
  };
}

/** Cap results shown per group on the combined view; "See all" links to the filtered view. */
const PER_GROUP_CAP = 24;

function TypeChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const activeType = RESULT_TYPE_ORDER.includes(searchParams.type as SearchResultType)
    ? (searchParams.type as SearchResultType)
    : null;

  let results: SearchResult[] = [];
  if (q) {
    const [vehicles, parts, services, dealers, blog] = await Promise.all([
      getVehicles(),
      getParts(),
      getServices(),
      getDealers(),
      getBlogPosts(),
    ]);
    results = searchSite(q, { vehicles, parts, services, dealers, blog });
  }

  const groups = groupResults(results);
  const total = results.length;
  const visibleTypes = activeType ? [activeType] : RESULT_TYPE_ORDER;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Search</h1>

      {/* On-page search bar — a plain GET form, so it works without JavaScript. */}
      <form action="/search" method="get" role="search" className="mt-5 flex max-w-2xl gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search cars, parts, services, dealers…"
            aria-label="Search the site"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="gradient">
          Search
        </Button>
      </form>

      {!q ? (
        <p className="mt-6 text-muted-foreground">
          Type a make, model, part, service or dealer above to search across the whole marketplace.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            {total > 0 ? (
              <>
                {total} result{total === 1 ? "" : "s"} for{" "}
                <span className="font-medium text-foreground">“{q}”</span>
              </>
            ) : (
              <>
                No results for <span className="font-medium text-foreground">“{q}”</span>
              </>
            )}
          </p>

          {total > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <TypeChip
                href={`/app/search?q=${encodeURIComponent(q)}`}
                active={!activeType}
                label={`All (${total})`}
              />
              {RESULT_TYPE_ORDER.filter((t) => groups[t].length > 0).map((t) => (
                <TypeChip
                  key={t}
                  href={`/app/search?q=${encodeURIComponent(q)}&type=${t}`}
                  active={activeType === t}
                  label={`${RESULT_TYPE_LABELS_PLURAL[t]} (${groups[t].length})`}
                />
              ))}
            </div>
          )}

          {total > 0 && (
            <div className="mt-8 space-y-10">
              {visibleTypes.map((t) => {
                const items = groups[t];
                if (items.length === 0) return null;
                const shown = activeType ? items : items.slice(0, PER_GROUP_CAP);
                return (
                  <section key={t} aria-labelledby={`group-${t}`}>
                    <div className="mb-4 flex items-baseline justify-between">
                      <h2 id={`group-${t}`} className="font-display text-xl font-bold">
                        {RESULT_TYPE_LABELS_PLURAL[t]}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          {items.length}
                        </span>
                      </h2>
                      {!activeType && items.length > PER_GROUP_CAP && (
                        <Link
                          href={`/app/search?q=${encodeURIComponent(q)}&type=${t}`}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          See all {items.length}
                        </Link>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {shown.map((r) => (
                        <SearchResultCard key={`${r.type}-${r.id}`} result={r} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {total === 0 && (
            <div className="mt-8 rounded-2xl border bg-card p-8 text-center">
              <p className="font-semibold">Nothing matched your search.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different make, model, part name or service — or browse the marketplace.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/marketplace/vehicles">Browse cars</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/marketplace/parts">Browse parts</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/marketplace/services">Browse services</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
