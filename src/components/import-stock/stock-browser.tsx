"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { StockCard } from "@/components/import-stock/stock-card";
import {
  Facet,
  FilterLayout,
  FilterOption,
  FilterOptionList,
  MultiFacet,
} from "@/components/shell/filter-dock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { matchesAny, selectedValues } from "@/lib/multi-select";
import { usePagedList } from "@/lib/use-paged-list";
import type { ImportStockRow } from "@/lib/queries";

/**
 * Browse what importers already have access to.
 *
 * "Available only" defaults on. A listing whose every unit is held is still
 * worth showing — holds lapse after two working days — but leading with cars
 * nobody can reserve makes the page look fuller than it is.
 */
export function StockBrowser({
  listings,
  basePath = "/imports/stock",
}: {
  listings: ImportStockRow[];
  basePath?: string;
}) {
  const [q, setQ] = useState("");
  const [origin, setOrigin] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);

  const origins = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of listings) counts.set(l.countryOfOrigin, (counts.get(l.countryOfOrigin) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [listings]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return listings.filter((l) => {
      if (availableOnly && l.quantity - l.held < 1) return false;
      if (!matchesAny(origin, l.countryOfOrigin)) return false;
      if (!term) return true;
      return `${l.title} ${l.make} ${l.model} ${l.trim ?? ""}`.toLowerCase().includes(term);
    });
  }, [listings, q, origin, availableOnly]);

  const activeCount = (q ? 1 : 0) + selectedValues(origin).length + (availableOnly ? 0 : 1);
  const paged = usePagedList(filtered, `${q}|${origin}|${availableOnly}`);

  function reset() {
    setQ("");
    setOrigin("");
    setAvailableOnly(true);
  }

  const FilterPanel = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Make, model or trim"
            className="pl-9"
            aria-label="Search import stock"
          />
        </div>
      </div>

      <Facet label="Source market">
        <MultiFacet
          name="origin"
          anyLabel="Anywhere"
          options={origins.map(([name]) => ({ value: name, label: name }))}
          value={origin}
          onChange={setOrigin}
          counts={{ any: listings.length, ...Object.fromEntries(origins) }}
        />
      </Facet>

      <div className="space-y-2">
        <Label>Availability</Label>
        <FilterOptionList>
          <FilterOption
            name="available"
            label="Has a free unit"
            multiple
            checked={availableOnly}
            onSelect={() => setAvailableOnly(!availableOnly)}
            count={listings.filter((l) => l.quantity - l.held > 0).length}
          />
        </FilterOptionList>
      </div>

      {activeCount > 0 && (
        <Button variant="outline" className="w-full" onClick={reset}>
          <X className="h-4 w-4" /> Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <FilterLayout filters={FilterPanel} activeCount={activeCount}>
      <div ref={paged.anchorRef}>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "car" : "cars"} ready to import
        </p>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paged.items.map((l) => (
              <StockCard key={l.id} listing={l} basePath={basePath} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            pageCount={paged.pageCount}
            onPageChange={paged.goToPage}
            itemNoun="car"
            from={paged.from}
            to={paged.to}
            total={paged.total}
          />
        </>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {listings.length === 0
            ? "No importer has published stock yet. Cars appear here as soon as they do."
            : "Nothing matches that. Try a broader search, or include cars that are fully reserved — holds lapse after two working days."}
        </p>
      )}
    </FilterLayout>
  );
}
